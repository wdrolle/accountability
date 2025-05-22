import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Convert string ID to number for chat_messages
    const messageId = parseInt(params.id);
    if (isNaN(messageId)) {
      return NextResponse.json({ success: false, error: 'Invalid message ID' }, { status: 400 });
    }

    // First find the chat message and its conversation
    const chatMessage = await prisma.chat_messages.findFirst({
      where: { 
        id: messageId
      },
      include: {
        chat_conversations: true
      }
    });

    if (!chatMessage) {
      return NextResponse.json({ success: false, error: 'Message not found' }, { status: 404 });
    }

    // Verify the message belongs to the user
    if (chatMessage.chat_conversations.user_id !== user.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    // Start a transaction to delete the message and related records
    await prisma.$transaction(async (tx) => {
      // Delete the chat message
      await tx.chat_messages.delete({
        where: {
          id: messageId
        }
      });

      // Check if this was the last message in the conversation
      const remainingMessages = await tx.chat_messages.count({
        where: {
          conversation_id: chatMessage.conversation_id
        }
      });

      // If no messages left, delete the conversation
      if (remainingMessages === 0) {
        await tx.chat_conversations.delete({
          where: {
            id: chatMessage.conversation_id
          }
        });
      }

      // Delete the related daily devotional
      await tx.daily_devotionals.deleteMany({
        where: {
          user_id: user.id,
          created_at: chatMessage.created_at
        }
      });
    });

    return NextResponse.json({ success: true, id: messageId });
  } catch (error) {
    console.error('Error deleting chat history:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete chat history'
    }, { status: 500 });
  }
} 