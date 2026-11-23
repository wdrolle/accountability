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

function journalFallbackReply(userName: string, prompt: string, journalNotes: string) {
  if (detectCrisisLanguage(prompt)) {
    return `Hello ${userName}, that sounds like a lot to carry. I am not able to help with something this serious. Call or text 988 (Suicide & Crisis Lifeline), available 24/7.`;
  }

  const trimmed = prompt.trim().slice(0, 240);
  const notes = journalNotes
    ? `\n\nFrom recent journal notes:\n${journalNotes}`
    : "";

  return `Hello ${userName}, I read what you wrote: “${trimmed}”.${notes}

Here is a simple next step: write one sentence about what would help in the next 24 hours, then add it as a reminder or a list item if you want follow-through.

The hub-to-local AI connection is offline right now. On the PC running Ollama, start the reserved tunnel:

ngrok http 11434 --url https://amorolle.ngrok.app --basic-auth "ollama:$OLLAMA_NGROK_PASSWORD"`;
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

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email && !session?.user?.id) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
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
      console.error("Zoe user lookup skipped:", error);
    }

    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "No prompt provided" },
        { status: 400 }
      );
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
      console.error("Zoe journal context skipped:", error);
    }

    let rawResponse = "";
    let usedLocalAi = false;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 120000);
      const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
        signal: controller.signal,
        method: "POST",
        headers: OLLAMA_HEADERS,
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          stream: false,
          think: false,
          prompt: `You are a private journal assistant for ${userName}. Be warm, practical, and non-clinical. Never diagnose. If the user is in crisis, point them to 988.
Address the user by their first name once: ${userName}
Use recent journal notes only if they help. Do not invent entries.

Recent journal notes:
${journalNotes || "(none yet)"}

User says: ${prompt}

Provide a helpful response:`,
          options: {
            temperature: 0.7,
            top_p: 0.9,
            top_k: 40,
            num_predict: 500,
          },
        }),
      });
      clearTimeout(timeout);

      const bodyText = await response.text();
      if (response.ok && bodyText && !bodyText.trim().startsWith("<")) {
        const data = JSON.parse(bodyText);
        rawResponse = stripModelThinking(data.response || data.message || "");
        usedLocalAi = !!rawResponse;
      } else {
        console.error("Local Ollama gateway error:", response.status, bodyText.slice(0, 200));
      }
    } catch (error) {
      console.error("Ollama unavailable, using journal fallback:", error);
    }

    if (!rawResponse) {
      rawResponse = journalFallbackReply(userName, prompt, journalNotes);
    }

    const formattedResponse = rawResponse
      .trim()
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const markdownResponse = rawResponse
      .trim()
      .replace(/\n/g, "<br>");

    return NextResponse.json({
      command: formattedResponse,
      markdown: markdownResponse,
      source: usedLocalAi ? "local" : "fallback",
      model: usedLocalAi ? OLLAMA_MODEL : "fallback",
    });
  } catch (error) {
    console.error("Zoe API Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process request" },
      { status: 500 }
    );
  }
}
