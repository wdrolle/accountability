import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  JOURNAL_KIND_PREFIX,
  detectCrisisLanguage,
  friendlyFirstName,
  parseJournalMessage,
  stripModelThinking,
} from "@/lib/journal";

export const maxDuration = 180;

/** Same hub -> local Ollama routing as /api/ai/zoe — do not change this resolution. */
const OLLAMA_HOST = (
  process.env.LOCAL_PC_OLLAMA_HOST ||
  process.env.OLLAMA_API_URL ||
  process.env.NEXT_PUBLIC_OLLAMA_URL ||
  "http://127.0.0.1:11434"
).replace(/\/+$/, "");

const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen3:14b";

function ollamaAuthHeader(): Record<string, string> {
  const user = process.env.LOCAL_PC_OLLAMA_USER || process.env.OLLAMA_NGROK_USER || "";
  const pass = process.env.LOCAL_PC_OLLAMA_PASSWORD || process.env.OLLAMA_NGROK_PASSWORD || "";
  if (!user || !pass) return {};
  return { Authorization: `Basic ${Buffer.from(`${user}:${pass}`).toString("base64")}` };
}

const OLLAMA_HEADERS = {
  "Content-Type": "application/json",
  "ngrok-skip-browser-warning": "true",
  ...ollamaAuthHeader(),
};

type ChatTurn = { role: "user" | "assistant"; content: string };

const CRISIS_REPLY =
  "That sounds like a lot to carry right now. I'm not able to help with something this serious, " +
  "but I want to make sure you have support — call or text 988 (Suicide & Crisis Lifeline), available 24/7.";

function fallbackReply(userName: string) {
  return `I'm having trouble reaching your local AI companion right now, ${userName}. ` +
    "Keep writing below — I'll pick the conversation back up once it's reachable. " +
    "If it's still offline on your end, start the tunnel on the PC running Ollama:\n\n" +
    "ngrok http 11434 --url https://amorolle.ngrok.app --basic-auth \"ollama:$OLLAMA_NGROK_PASSWORD\"";
}

function buildJournalNotes(rows: { id: string; content: string; created_at: Date | string | null }[]) {
  return rows
    .map(parseJournalMessage)
    .filter((item): item is NonNullable<typeof item> => !!item && item.kind === "journal_entry" && !item.excludeFromAi && !item.crisis)
    .slice(0, 8)
    .map((item) => {
      const date = item.created_at.slice(0, 10);
      const mood = typeof item.mood === "number" ? ` mood ${item.mood}/5` : "";
      const tags = item.tags?.length ? ` [${item.tags.join(", ")}]` : "";
      return `- ${date}${mood}${tags}: ${item.text.slice(0, 280)}`;
    })
    .join("\n");
}

const SYSTEM_PROMPT = (userName: string, journalNotes: string) => `You are a warm, thoughtful journaling companion talking with ${userName}.
Your job is to help them think out loud, the way a good therapist opens a session: mostly listening,
asking one gentle, open-ended follow-up question at a time, and occasionally naming a pattern you notice
("it sounds like this is the third time this week you've mentioned feeling stretched thin at work — is that
part of what's going on?"). Keep replies short (2-5 sentences) and conversational, never a lecture.

Hard rules:
- Never diagnose or claim a clinical condition. Reflect patterns as observations and questions, not labels.
- Never claim to be a therapist or medical professional. If asked, say plainly you're an AI journaling companion.
- If the person's message suggests self-harm, suicidal thoughts, or acute crisis, do not continue the normal
  conversation — respond only with warmth and point them to 988 (Suicide & Crisis Lifeline), available 24/7.
- Use recent journal notes only if they're relevant. Do not invent entries or details that aren't there.
- End most turns with a single focused question that helps them go one layer deeper, or that helps turn a
  vague feeling into something concrete they could act on.

Recent journal notes for context:
${journalNotes || "(none yet)"}`;

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email && !session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    let userName = friendlyFirstName(null, session?.user?.name);
    let userId = session?.user?.id || "";
    try {
      if (session?.user?.email) {
        const user = await prisma.user.findUnique({
          where: { email: session.user.email },
          select: { id: true, first_name: true },
        });
        if (user?.id) userId = user.id;
        userName = friendlyFirstName(user?.first_name, session.user.name);
      }
    } catch (error) {
      console.error("Journal coach user lookup skipped:", error);
    }

    const body = await request.json();
    const messages: ChatTurn[] = Array.isArray(body?.messages) ? body.messages : [];
    const lastUser = [...messages].reverse().find((turn) => turn.role === "user");

    if (!lastUser?.content?.trim()) {
      return NextResponse.json({ error: "No message provided" }, { status: 400 });
    }

    if (detectCrisisLanguage(lastUser.content)) {
      return NextResponse.json({ reply: CRISIS_REPLY, crisis: true, source: "guardrail" });
    }

    let journalNotes = "";
    try {
      if (userId) {
        const rows = await prisma.messages.findMany({
          where: {
            sender_id: userId,
            receiver_id: userId,
            content: { startsWith: JOURNAL_KIND_PREFIX },
          },
          orderBy: { created_at: "desc" },
          take: 12,
          select: { id: true, content: true, created_at: true },
        });
        journalNotes = buildJournalNotes(rows);
      }
    } catch (error) {
      console.error("Journal coach journal context skipped:", error);
    }

    let rawResponse = "";
    let usedLocalAi = false;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 120000);
      const response = await fetch(`${OLLAMA_HOST}/api/chat`, {
        signal: controller.signal,
        method: "POST",
        headers: OLLAMA_HEADERS,
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          stream: false,
          think: false,
          messages: [
            { role: "system", content: SYSTEM_PROMPT(userName, journalNotes) },
            ...messages.slice(-10),
          ],
          options: { temperature: 0.8, top_p: 0.9, num_predict: 350 },
        }),
      });
      clearTimeout(timeout);

      const bodyText = await response.text();
      if (response.ok && bodyText && !bodyText.trim().startsWith("<")) {
        const data = JSON.parse(bodyText);
        rawResponse = stripModelThinking(data.message?.content || data.response || "");
        usedLocalAi = !!rawResponse;
      } else {
        console.error("Local Ollama gateway error:", response.status, bodyText.slice(0, 200));
      }
    } catch (error) {
      console.error("Ollama unavailable, using journal-coach fallback:", error);
    }

    if (!rawResponse) {
      rawResponse = fallbackReply(userName);
    }

    return NextResponse.json({
      reply: rawResponse.trim(),
      crisis: false,
      source: usedLocalAi ? "local" : "fallback",
      model: usedLocalAi ? OLLAMA_MODEL : "fallback",
    });
  } catch (error) {
    console.error("Journal coach API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process request" },
      { status: 500 }
    );
  }
}
