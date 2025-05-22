import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const url = new URL(req.url);
    const type = url.searchParams.get('type');
    const limit = parseInt(url.searchParams.get('limit') || '5');

    // Get user details
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Get chat history
    const chatHistory = await prisma.chat_messages.findMany({
      where: {
        chat_conversations: {
          user_id: user.id,
          title: type || undefined
        }
      },
      include: {
        chat_conversations: true
      },
      orderBy: {
        created_at: 'desc'
      },
      take: limit
    });

    // Format the response
    const formattedHistory = chatHistory.map(chat => ({
      id: chat.id,
      conversation_id: chat.conversation_id,
      content: chat.messages,
      created_at: chat.created_at
    }));

    return NextResponse.json(formattedHistory);
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch chat history'
    }, { status: 500 });
  }
} 