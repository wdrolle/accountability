import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  detectCrisisLanguage,
  parseJournalMessage,
  serializeJournalPayload,
  suggestTags,
  type JournalKind,
} from "@/lib/journal";

async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!user) {
    return { error: NextResponse.json({ error: "User not found" }, { status: 404 }) };
  }

  return { user };
}

function ownMessageWhere(userId: string) {
  return {
    sender_id: userId,
    receiver_id: userId,
  };
}

export async function GET(request: Request) {
  try {
    const auth = await requireUser();
    if ("error" in auth && auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const kind = (searchParams.get("kind") || "journal_entry") as JournalKind;

    const rows = await prisma.messages.findMany({
      where: ownMessageWhere(auth.user!.id),
      orderBy: { created_at: "desc" },
      take: 200,
    });

    const items = rows
      .map(parseJournalMessage)
      .filter((item): item is NonNullable<typeof item> => !!item && item.kind === kind);

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error loading journal records:", error);
    return NextResponse.json({ error: "Failed to load journal records" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireUser();
    if ("error" in auth && auth.error) return auth.error;

    const body = await request.json();
    const kind = (body.kind || "journal_entry") as JournalKind;
    const text = String(body.text || "").trim();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const crisis = detectCrisisLanguage(text);
    const tags = Array.isArray(body.tags) && body.tags.length
      ? body.tags
      : suggestTags(text);

    const content = serializeJournalPayload({
      kind,
      text,
      mood: body.mood ? Number(body.mood) : undefined,
      tags,
      excludeFromAi: !!body.excludeFromAi || crisis,
      prompt: body.prompt || "",
      listName: body.listName || (kind === "bill" ? "Bills" : "To-do"),
      done: !!body.done,
      amount: body.amount != null ? Number(body.amount) : null,
      dueDate: body.dueDate || null,
      crisis,
      source: body.source === "ai_suggested" ? "ai_suggested" : "user",
      sourceEntryId: body.sourceEntryId || null,
    });

    const row = await prisma.messages.create({
      data: {
        sender_id: auth.user!.id,
        receiver_id: auth.user!.id,
        content,
      },
    });

    return NextResponse.json({
      item: parseJournalMessage(row),
      crisis,
      crisisMessage: crisis
        ? "That sounds like a lot to carry right now. This journal is not able to help with something this serious. Call or text 988 (Suicide & Crisis Lifeline), available 24/7."
        : null,
    });
  } catch (error) {
    console.error("Error creating journal record:", error);
    return NextResponse.json({ error: "Failed to save journal record" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await requireUser();
    if ("error" in auth && auth.error) return auth.error;

    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const existing = await prisma.messages.findFirst({
      where: { id: body.id, ...ownMessageWhere(auth.user!.id) },
    });

    if (!existing) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    const current = parseJournalMessage(existing);
    if (!current) {
      return NextResponse.json({ error: "Record is not a journal item" }, { status: 400 });
    }

    const text = body.text != null ? String(body.text).trim() : current.text;
    const crisis = detectCrisisLanguage(text);
    const content = serializeJournalPayload({
      kind: current.kind,
      text,
      mood: body.mood != null ? Number(body.mood) : current.mood,
      tags: Array.isArray(body.tags) ? body.tags : current.tags,
      excludeFromAi: body.excludeFromAi != null ? !!body.excludeFromAi : current.excludeFromAi || crisis,
      prompt: body.prompt != null ? body.prompt : current.prompt,
      listName: body.listName != null ? body.listName : current.listName,
      done: body.done != null ? !!body.done : current.done,
      amount: body.amount !== undefined ? body.amount : current.amount,
      dueDate: body.dueDate !== undefined ? body.dueDate : current.dueDate,
      crisis,
    });

    const row = await prisma.messages.update({
      where: { id: existing.id },
      data: { content, updated_at: new Date() },
    });

    return NextResponse.json({ item: parseJournalMessage(row), crisis });
  } catch (error) {
    console.error("Error updating journal record:", error);
    return NextResponse.json({ error: "Failed to update journal record" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await requireUser();
    if ("error" in auth && auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const existing = await prisma.messages.findFirst({
      where: { id, ...ownMessageWhere(auth.user!.id) },
    });

    if (!existing) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    await prisma.messages.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting journal record:", error);
    return NextResponse.json({ error: "Failed to delete journal record" }, { status: 500 });
  }
}
