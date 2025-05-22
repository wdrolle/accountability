import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { ReactionType } from '@/types/agents-study-group-chat-messages';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; messageId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type } = await request.json();
    const messageId = params.messageId;

    // Get the message
    const message = await prisma.agents_chat_messages.findUnique({
      where: { id: messageId }
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Toggle the reaction
    const reactionKey = `${session.user.id}:${type}`;
    const hasReacted = message.user_reactions.includes(reactionKey);
    const currentCount = (message.reactions_count as Record<ReactionType, number>)[type as ReactionType] || 0;
    
    if (hasReacted) {
      // Remove reaction
      await prisma.agents_chat_messages.update({
        where: { id: messageId },
        data: {
          reactions_count: {
            set: {
              SMILE: type === 'SMILE' ? Math.max(0, currentCount - 1) : (message.reactions_count as any).SMILE,
              HEART: type === 'HEART' ? Math.max(0, currentCount - 1) : (message.reactions_count as any).HEART,
              BLUE_HEART: type === 'BLUE_HEART' ? Math.max(0, currentCount - 1) : (message.reactions_count as any).BLUE_HEART,
              CLAP: type === 'CLAP' ? Math.max(0, currentCount - 1) : (message.reactions_count as any).CLAP,
              CRY: type === 'CRY' ? Math.max(0, currentCount - 1) : (message.reactions_count as any).CRY,
              TEARS: type === 'TEARS' ? Math.max(0, currentCount - 1) : (message.reactions_count as any).TEARS,
              MONOCLE: type === 'MONOCLE' ? Math.max(0, currentCount - 1) : (message.reactions_count as any).MONOCLE,
              JOY: type === 'JOY' ? Math.max(0, currentCount - 1) : (message.reactions_count as any).JOY,
              ASTONISHED: type === 'ASTONISHED' ? Math.max(0, currentCount - 1) : (message.reactions_count as any).ASTONISHED
            }
          },
          user_reactions: {
            set: message.user_reactions.filter(r => r !== reactionKey)
          }
        }
      });
    } else {
      // Add reaction
      await prisma.agents_chat_messages.update({
        where: { id: messageId },
        data: {
          reactions_count: {
            set: {
              SMILE: type === 'SMILE' ? currentCount + 1 : (message.reactions_count as any).SMILE,
              HEART: type === 'HEART' ? currentCount + 1 : (message.reactions_count as any).HEART,
              BLUE_HEART: type === 'BLUE_HEART' ? currentCount + 1 : (message.reactions_count as any).BLUE_HEART,
              CLAP: type === 'CLAP' ? currentCount + 1 : (message.reactions_count as any).CLAP,
              CRY: type === 'CRY' ? currentCount + 1 : (message.reactions_count as any).CRY,
              TEARS: type === 'TEARS' ? currentCount + 1 : (message.reactions_count as any).TEARS,
              MONOCLE: type === 'MONOCLE' ? currentCount + 1 : (message.reactions_count as any).MONOCLE,
              JOY: type === 'JOY' ? currentCount + 1 : (message.reactions_count as any).JOY,
              ASTONISHED: type === 'ASTONISHED' ? currentCount + 1 : (message.reactions_count as any).ASTONISHED
            }
          },
          user_reactions: {
            push: reactionKey
          }
        }
      });
    }

    // Get updated message
    const updatedMessage = await prisma.agents_chat_messages.findUnique({
      where: { id: messageId }
    });

    return NextResponse.json({
      success: true,
      message: updatedMessage
    });
  } catch (error) {
    console.error('Error handling reaction:', error);
    return NextResponse.json(
      { error: 'Failed to process reaction' },
      { status: 500 }
    );
  }
} 