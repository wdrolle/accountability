import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; messageId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', success: false },
        { status: 401 }
      );
    }

    const groupId = params.id;
    const messageId = params.messageId;

    // Get the message to verify ownership
    const message = await prisma.chat_messages.findUnique({
      where: {
        id: parseInt(messageId)
      }
    });

    if (!message) {
      return NextResponse.json(
        { error: 'Message not found', success: false },
        { status: 404 }
      );
    }

    // Verify user is a member of the group
    const membership = await prisma.agents_group_member.findUnique({
      where: {
        group_id_user_id: {
          group_id: groupId,
          user_id: session.user.id,
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'You must be a member to delete messages', success: false },
        { status: 403 }
      );
    }

    // Delete the message
    await prisma.chat_messages.delete({
      where: {
        id: parseInt(messageId)
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json(
      { error: 'Failed to delete message', success: false },
      { status: 500 }
    );
  }
} 