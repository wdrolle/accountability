/** Shared journal / list payload stored in accountability.messages as JSON. */

export type JournalKind = "journal_entry" | "list_item" | "bill";

export type JournalRecord = {
  id: string;
  kind: JournalKind;
  text: string;
  mood?: number;
  tags?: string[];
  excludeFromAi?: boolean;
  prompt?: string;
  listName?: string;
  done?: boolean;
  amount?: number | null;
  dueDate?: string | null;
  crisis?: boolean;
  /** Who created this record — surfaced in the UI as an "AI suggested" badge. */
  source?: "user" | "ai_suggested";
  /** For an ai_suggested list_item, the journal_entry id it was drawn from. */
  sourceEntryId?: string | null;
  /** Set on a journal_entry once the background worker has scanned it for action items. */
  aiProcessed?: boolean;
  created_at: string;
  updated_at?: string | null;
};

export const JOURNAL_KIND_PREFIX = "__aj__:";

const CRISIS_PATTERNS = [
  /suicid/i,
  /kill myself/i,
  /end my life/i,
  /want to die/i,
  /self[- ]?harm/i,
  /hurt myself/i,
  /no reason to live/i,
];

const TAG_HINTS: { tag: string; pattern: RegExp }[] = [
  { tag: "work", pattern: /\b(work|job|boss|office|deadline|career)\b/i },
  { tag: "relationship", pattern: /\b(partner|relationship|date|dating|spouse)\b/i },
  { tag: "grateful", pattern: /\b(grateful|thankful|appreciate|blessed)\b/i },
  { tag: "anxious", pattern: /\b(anxious|anxiety|worried|overwhelm|stress)\b/i },
  { tag: "sleep", pattern: /\b(sleep|insomnia|tired|rest)\b/i },
  { tag: "money", pattern: /\b(money|bill|budget|rent|debt|pay)\b/i },
  { tag: "health", pattern: /\b(health|doctor|sick|exercise|walk)\b/i },
  { tag: "family", pattern: /\b(mom|dad|family|kids|parent)\b/i },
  { tag: "planning", pattern: /\b(plan|goal|next step|remind|todo|to-do)\b/i },
];

export function appApiUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_BASE_PATH || "/accountability";
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}

export function journalApiUrl(query = "") {
  return `${appApiUrl("/api/journal")}${query}`;
}

export function friendlyFirstName(firstName?: string | null, sessionName?: string | null) {
  const candidates = [firstName, sessionName?.split(/\s+/)[0]];
  for (const value of candidates) {
    const name = String(value || "").trim();
    if (name && !name.includes("@")) return name;
  }
  return "there";
}

export function stripModelThinking(text: string) {
  return String(text || "")
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/<think>[\s\S]*$/gi, "")
    .replace(/^\s*thinking\s*[:.-][\s\S]*?\n\n/i, "")
    .trim();
}

export function detectCrisisLanguage(text: string): boolean {
  return CRISIS_PATTERNS.some((pattern) => pattern.test(text || ""));
}

export function suggestTags(text: string): string[] {
  return TAG_HINTS.filter(({ pattern }) => pattern.test(text || "")).map(({ tag }) => tag);
}

export function serializeJournalPayload(record: Omit<JournalRecord, "id" | "created_at" | "updated_at">) {
  return JOURNAL_KIND_PREFIX + JSON.stringify({
    kind: record.kind,
    text: record.text,
    mood: record.mood,
    tags: record.tags || [],
    excludeFromAi: !!record.excludeFromAi,
    prompt: record.prompt || "",
    listName: record.listName || "",
    done: !!record.done,
    amount: record.amount ?? null,
    dueDate: record.dueDate || null,
    crisis: !!record.crisis,
    source: record.source || "user",
    sourceEntryId: record.sourceEntryId ?? null,
    aiProcessed: !!record.aiProcessed,
  });
}

export function parseJournalMessage(row: {
  id: string;
  content: string;
  created_at: Date | string | null;
  updated_at?: Date | string | null;
}): JournalRecord | null {
  if (!row.content?.startsWith(JOURNAL_KIND_PREFIX)) {
    return null;
  }

  try {
    const payload = JSON.parse(row.content.slice(JOURNAL_KIND_PREFIX.length));
    return {
      id: row.id,
      kind: payload.kind || "journal_entry",
      text: payload.text || "",
      mood: payload.mood,
      tags: Array.isArray(payload.tags) ? payload.tags : [],
      excludeFromAi: !!payload.excludeFromAi,
      prompt: payload.prompt || "",
      listName: payload.listName || "",
      done: !!payload.done,
      amount: payload.amount ?? null,
      dueDate: payload.dueDate || null,
      crisis: !!payload.crisis,
      source: payload.source === "ai_suggested" ? "ai_suggested" : "user",
      sourceEntryId: payload.sourceEntryId || null,
      aiProcessed: !!payload.aiProcessed,
      created_at: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
      updated_at: row.updated_at ? new Date(row.updated_at).toISOString() : null,
    };
  } catch {
    return null;
  }
}

/** Physical energy, independent of emotion-wheel valence. Stored as mood 1–5. */
export const ENERGY_LEVELS = [
  { value: 1, emoji: "😴", label: "Drained" },
  { value: 2, emoji: "🥱", label: "Low" },
  { value: 3, emoji: "😐", label: "Steady" },
  { value: 4, emoji: "🙂", label: "Energized" },
  { value: 5, emoji: "🤩", label: "Wired" },
] as const;

export function energyLevel(value?: number | null) {
  return ENERGY_LEVELS.find((level) => level.value === value) ?? null;
}

export const JOURNAL_PROMPTS = [
  "What's one thing on your mind today?",
  "What's something you're avoiding?",
  "What felt heavy, and what helped even a little?",
  "What is one next step you want help remembering?",
];

const INTENTION_PATTERN =
  /\b(i should|i need to|i have to|i want to|i'm going to|i am going to|i will|i'll|remind me|remember to|let's|gotta|have got to)\b/i;

const SENTENCE_SPLIT = /(?<=[.!?\n])\s+/;

/**
 * Pulls candidate action items out of free-text (a journal entry, or a coach
 * conversation transcript). Heuristic, not LLM-based, so it stays fast and
 * predictable — mirrors the "intentions" detector already used on the
 * insights page. Callers are responsible for asking the user before turning
 * a candidate into a real to-do (see spec section 4.5 — never silent).
 */
export function extractActionCandidates(text: string, max = 5): string[] {
  const sentences = String(text || "")
    .split(SENTENCE_SPLIT)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  const seen = new Set<string>();
  const candidates: string[] = [];

  for (const sentence of sentences) {
    if (!INTENTION_PATTERN.test(sentence)) continue;
    if (detectCrisisLanguage(sentence)) continue;
    const cleaned = sentence.replace(/\s+/g, " ").slice(0, 140);
    const key = cleaned.toLowerCase();
    if (cleaned.length < 6 || seen.has(key)) continue;
    seen.add(key);
    candidates.push(cleaned);
    if (candidates.length >= max) break;
  }

  return candidates;
}
