/**
 * Background AI worker: scans new journal entries for concrete action items
 * and turns them into "To-do" list items, tagged source: 'ai_suggested' so
 * the Lists page can flag them clearly. Runs as its own PM2 process
 * alongside god-scheduler (see scripts/ecosystem.config.js) — separate
 * process so it can be started/stopped/tuned independently.
 *
 * Guardrails (mirrors src/lib/journal.ts + the product spec):
 *  - never reads/suggests from entries marked excludeFromAi ("Private") or
 *    flagged crisis — those are skipped entirely, unread by the model.
 *  - never marks a to-do "done" or auto-deletes anything — purely additive.
 *  - every AI-suggested item stays visibly tagged and removable, never
 *    silently blended in with the user's own items.
 *  - uses the same hub -> local Ollama routing as the rest of the app
 *    (LOCAL_PC_OLLAMA_HOST / OLLAMA_API_URL / NEXT_PUBLIC_OLLAMA_URL); if
 *    that's unreachable, falls back to a plain regex heuristic instead of
 *    failing the run.
 */

const { Client } = require('pg');

const POLL_MS = Number(process.env.JOURNAL_AI_WORKER_INTERVAL_MS || 5 * 60 * 1000);
const BATCH_SIZE = Number(process.env.JOURNAL_AI_WORKER_BATCH_SIZE || 20);
const MAX_ITEMS_PER_ENTRY = 3;

const JOURNAL_KIND_PREFIX = '__aj__:';

const OLLAMA_HOST = (
  process.env.LOCAL_PC_OLLAMA_HOST ||
  process.env.OLLAMA_API_URL ||
  process.env.NEXT_PUBLIC_OLLAMA_URL ||
  'http://127.0.0.1:11434'
).replace(/\/+$/, '');

const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen3:14b';

function ollamaHeaders() {
  const headers = {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true',
  };
  const user = process.env.LOCAL_PC_OLLAMA_USER || process.env.OLLAMA_NGROK_USER || '';
  const pass = process.env.LOCAL_PC_OLLAMA_PASSWORD || process.env.OLLAMA_NGROK_PASSWORD || '';
  if (user && pass) {
    headers.Authorization = `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}`;
  }
  return headers;
}

const INTENTION_PATTERN =
  /\b(i should|i need to|i have to|i want to|i'm going to|i am going to|i will|i'll|remind me|remember to|let's|gotta|have got to)\b/i;

const CRISIS_PATTERNS = [
  /suicid/i,
  /kill myself/i,
  /end my life/i,
  /want to die/i,
  /self[- ]?harm/i,
  /hurt myself/i,
  /no reason to live/i,
];

function isCrisisText(text) {
  return CRISIS_PATTERNS.some((pattern) => pattern.test(text || ''));
}

function regexActionCandidates(text, max) {
  const sentences = String(text || '')
    .split(/(?<=[.!?\n])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const seen = new Set();
  const out = [];
  for (const sentence of sentences) {
    if (!INTENTION_PATTERN.test(sentence) || isCrisisText(sentence)) continue;
    const cleaned = sentence.replace(/\s+/g, ' ').slice(0, 140);
    const key = cleaned.toLowerCase();
    if (cleaned.length < 6 || seen.has(key)) continue;
    seen.add(key);
    out.push(cleaned);
    if (out.length >= max) break;
  }
  return out;
}

function parseModelJsonArray(raw) {
  if (!raw) return null;
  const start = raw.indexOf('[');
  const end = raw.lastIndexOf(']');
  if (start === -1 || end === -1 || end < start) return null;
  try {
    const parsed = JSON.parse(raw.slice(start, end + 1));
    if (!Array.isArray(parsed)) return null;
    return parsed
      .map((item) => (typeof item === 'string' ? item : item && item.task))
      .filter((item) => typeof item === 'string' && item.trim().length > 0)
      .map((item) => item.trim().slice(0, 140));
  } catch {
    return null;
  }
}

async function askOllamaForActionItems(entryText) {
  const prompt = `You help keep a private journal's to-do list up to date.
Read the entry below. If — and only if — the writer clearly states something
they intend to do, extract up to ${MAX_ITEMS_PER_ENTRY} short, concrete action
items (a few words each, imperative form, e.g. "Call mom back").
If nothing actionable is stated, reply with an empty array.
Reply with ONLY a JSON array of strings. No prose, no markdown, no explanation.

Journal entry:
"""
${entryText.slice(0, 2000)}
"""

JSON array:`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);
  try {
    const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
      signal: controller.signal,
      method: 'POST',
      headers: ollamaHeaders(),
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        stream: false,
        think: false,
        prompt,
        options: { temperature: 0.2, top_p: 0.9, num_predict: 200 },
      }),
    });
    clearTimeout(timeout);
    if (!response.ok) return null;
    const bodyText = await response.text();
    if (!bodyText || bodyText.trim().startsWith('<')) return null;
    const data = JSON.parse(bodyText);
    return parseModelJsonArray(data.response || '');
  } catch (error) {
    clearTimeout(timeout);
    return null;
  }
}

function buildListItemContent({ text, sourceEntryId }) {
  return (
    JOURNAL_KIND_PREFIX +
    JSON.stringify({
      kind: 'list_item',
      text,
      mood: undefined,
      tags: [],
      excludeFromAi: false,
      prompt: '',
      listName: 'To-do',
      done: false,
      amount: null,
      dueDate: null,
      crisis: false,
      source: 'ai_suggested',
      sourceEntryId,
      aiProcessed: false,
    })
  );
}

async function processEntry(client, row) {
  let payload;
  try {
    payload = JSON.parse(row.content.slice(JOURNAL_KIND_PREFIX.length));
  } catch {
    return { skipped: true };
  }

  if (payload.kind !== 'journal_entry' || payload.excludeFromAi || payload.crisis) {
    // Mark it processed so we stop looking at it, but never suggest from it.
    payload.aiProcessed = true;
    await client.query('UPDATE accountability.messages SET content = $1, updated_at = now() WHERE id = $2', [
      JOURNAL_KIND_PREFIX + JSON.stringify(payload),
      row.id,
    ]);
    return { skipped: true };
  }

  const text = String(payload.text || '');
  let candidates = await askOllamaForActionItems(text);
  let usedLocalAi = Array.isArray(candidates);
  if (!Array.isArray(candidates)) {
    candidates = regexActionCandidates(text, MAX_ITEMS_PER_ENTRY);
  }
  candidates = candidates.filter((c) => !isCrisisText(c)).slice(0, MAX_ITEMS_PER_ENTRY);

  for (const task of candidates) {
    await client.query(
      'INSERT INTO accountability.messages (sender_id, receiver_id, content) VALUES ($1, $1, $2)',
      [row.sender_id, buildListItemContent({ text: task, sourceEntryId: row.id })]
    );
  }

  payload.aiProcessed = true;
  await client.query('UPDATE accountability.messages SET content = $1, updated_at = now() WHERE id = $2', [
    JOURNAL_KIND_PREFIX + JSON.stringify(payload),
    row.id,
  ]);

  return { skipped: false, added: candidates.length, usedLocalAi };
}

async function runOnce(client) {
  const { rows } = await client.query(
    `SELECT id, sender_id, content, created_at
     FROM accountability.messages
     WHERE sender_id = receiver_id
       AND content LIKE '${JOURNAL_KIND_PREFIX}%'
       AND content LIKE '%"kind":"journal_entry"%'
       AND content NOT LIKE '%"aiProcessed":true%'
     ORDER BY created_at ASC
     LIMIT $1`,
    [BATCH_SIZE]
  );

  if (rows.length === 0) {
    console.log('[journal-ai-worker] no new entries at', new Date().toISOString());
    return;
  }

  let processed = 0;
  let added = 0;
  for (const row of rows) {
    try {
      const result = await processEntry(client, row);
      if (!result.skipped) {
        processed += 1;
        added += result.added || 0;
      }
    } catch (error) {
      console.error('[journal-ai-worker] failed on entry', row.id, error);
    }
  }
  console.log(
    `[journal-ai-worker] scanned ${rows.length} entr${rows.length === 1 ? 'y' : 'ies'}, ` +
      `processed ${processed}, suggested ${added} to-do${added === 1 ? '' : 's'} at ${new Date().toISOString()}`
  );
}

async function start() {
  const connectionString = String(process.env.DATABASE_URL || '').replace(
    /([?&])sslmode=[^&]+/g,
    '$1sslmode=no-verify',
  );
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log('[journal-ai-worker] connected to database at', new Date().toISOString());
  console.log('[journal-ai-worker] using Ollama host', OLLAMA_HOST, 'model', OLLAMA_MODEL);

  const tick = () => runOnce(client).catch((error) => console.error('[journal-ai-worker] run failed:', error));
  const interval = setInterval(tick, POLL_MS);
  await tick();

  const shutdown = async (signal) => {
    console.log(`[journal-ai-worker] received ${signal}, shutting down...`);
    clearInterval(interval);
    await client.end();
    process.exit(0);
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start().catch((error) => {
  console.error('[journal-ai-worker] failed to start:', error);
  process.exit(1);
});
