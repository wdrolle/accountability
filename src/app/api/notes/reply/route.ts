import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { noteId, content, groupId } = await req.json();

    const reply = await prisma.agents_group_note_reply.create({
      data: {
        content,
        note_id: noteId,
        user_id: session.user.id,
      },
    });

    return NextResponse.json(reply);
  } catch (error) {
    console.error('Failed to create reply:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 