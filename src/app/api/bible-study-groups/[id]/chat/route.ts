export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Message, ReactionType } from '@/types/agents-study-group-chat-messages';

// Initialize default reactions count
const defaultReactionsCount: Record<string, number> = {
  SMILE: 0,
  HEART: 0,
  BLUE_HEART: 0,
  CLAP: 0,
  CRY: 0,
  TEARS: 0,
  MONOCLE: 0,
  JOY: 0,
  ASTONISHED: 0
};

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get godV2UserId from headers
    const godV2UserId = request.headers.get('x-god-v2-user-id');
    if (!godV2UserId) {
      return NextResponse.json({ error: 'Missing godV2UserId' }, { status: 400 });
    }

    const groupId = params.id;
    // console.log('[DEBUG] Group ID:', groupId);
    // console.log('[DEBUG] godV2UserId:', godV2UserId);

    // First get the group
    const group = await prisma.agents_group.findUnique({
      where: { id: groupId }
    });

    if (!group) {
      // console.log('[DEBUG] Group not found in database');
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Check membership using godV2UserId
    const membership = await prisma.agents_group_member.findFirst({
      where: {
        group_id: groupId,
        user_id: godV2UserId,
        status: { in: ['ACTIVE', 'ACCEPTED'] }
      },
      include: {
        agents_group: true
      }
    });

    // console.log('[DEBUG] Membership:', membership);

    if (!membership) {
      // console.log('[DEBUG] User not a member of group');
      return NextResponse.json({ error: 'Not a member of this group' }, { status: 403 });
    }

    // Fetch messages with user details and reactions
    const messages = await prisma.agents_chat_messages.findMany({
      where: {
        group_id: groupId
      },
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            image: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    // Format messages with reaction counts
    const formattedMessages = messages.map((message) => ({
      id: message.id,
      content: message.content,
      created_at: message.created_at.toISOString(),
      user_id: message.user_id,
      user: {
        id: message.user.id,
        first_name: message.user.first_name || '',
        last_name: message.user.last_name || '',
        image: message.user.image || '/images/logo/agents.png'
      },
      reactions_count: {
        ...defaultReactionsCount,
        ...(typeof message.reactions_count === 'object' ? message.reactions_count as Record<string, number> : {})
      },
      user_reactions: Array.isArray(message.user_reactions) ? message.user_reactions : []
    }));

    // console.log('[DEBUG] Returning messages count:', formattedMessages.length);
    return NextResponse.json(formattedMessages);

  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get godV2UserId from headers
    const godV2UserId = request.headers.get('x-god-v2-user-id');
    if (!godV2UserId) {
      return NextResponse.json({ error: 'Missing godV2UserId' }, { status: 400 });
    }

    const groupId = params.id;

    // Check membership using godV2UserId
    const membership = await prisma.agents_group_member.findFirst({
      where: {
        group_id: groupId,
        user_id: godV2UserId,
        status: { in: ['ACTIVE', 'ACCEPTED'] }
      },
      include: {
        agents_group: true
      }
    });

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this group' }, { status: 403 });
    }

    const data = await request.json();
    const { content } = data;

    if (!content?.text?.trim()) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    // Create new message using godV2UserId
    const message = await prisma.agents_chat_messages.create({
      data: {
        content: { 
          text: content.text,
          type: 'text',
          files: [],
          edited: false,
          mentions: [],
          edited_at: null,
          reactions: {}
        },
        group_id: groupId,
        user_id: godV2UserId,
        reactions_count: defaultReactionsCount,
        user_reactions: []
      },
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            image: true
          }
        }
      }
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error('Error posting message:', error);
    return NextResponse.json(
      { error: 'Failed to post message' },
      { status: 500 }
    );
  }
} 