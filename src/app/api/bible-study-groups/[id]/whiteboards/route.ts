export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

interface WhiteBoardContent {
  title: string;
  content: string;
  day: string;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get godV2UserId from headers
    const godV2UserId = request.headers.get('x-god-v2-user-id');
    // console.log('Whiteboard API - User IDs:', {
    //   sessionUserId: session.user.id,
    //   godV2UserId,
    //   groupId: params.id
    // });

    // Await params.id
    const { id: groupId } = await params;

    // First get the group
    const group = await prisma.agents_group.findUnique({
      where: { id: groupId }
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Check membership using either session.user.id or godV2UserId
    const membership = await prisma.agents_group_member.findFirst({
      where: {
        group_id: groupId,
        user_id: godV2UserId || session.user.id,  // If godV2UserId is undefined, use session.user.id
        status: 'ACCEPTED'
      }
    });

    // console.log('Whiteboard API - Membership check:', {
    //   found: !!membership,
    //   membership,
    //   userIdUsed: godV2UserId || session.user.id
    // });

    if (!membership) {
      // Try with session.user.id if godV2UserId failed
      if (godV2UserId) {
        const sessionMembership = await prisma.agents_group_member.findFirst({
          where: {
            group_id: groupId,
            user_id: session.user.id,
            status: 'ACCEPTED'
          }
        });
        if (sessionMembership) {
          // console.log('Found membership with session.user.id after godV2UserId failed');
          // Fetch whiteboards for session user
          const whiteboards = await prisma.agents_group_whiteboard.findMany({
            where: {
              group_id: groupId,
            },
            orderBy: {
              day: 'desc',
            },
          });
          return NextResponse.json({ whiteboards });
        }
      }
      return NextResponse.json({ error: 'Not a member of this group' }, { status: 403 });
    }

    // Fetch whiteboards - all members can view
    const whiteboards = await prisma.agents_group_whiteboard.findMany({
      where: {
        group_id: groupId,
      },
      orderBy: {
        day: 'desc',
      },
    });

    // console.log('Whiteboard API - Found whiteboards:', {
    //   count: whiteboards.length,
    //   whiteboards: whiteboards.map(wb => ({
    //     id: wb.id,
    //     title: wb.title,
    //     day: wb.day
    //   }))
    // });

    return NextResponse.json({ whiteboards });
  } catch (error) {
    console.error('Error fetching whiteboards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch whiteboards' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get godV2UserId from headers
    const godV2UserId = request.headers.get('x-god-v2-user-id');
    if (!godV2UserId) {
      return NextResponse.json({ error: 'Missing godV2UserId' }, { status: 400 });
    }

    // Await params.id
    const { id: groupId } = await params;

    // First get the group
    const group = await prisma.agents_group.findUnique({
      where: { id: groupId }
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Check if user is leader or admin
    const membership = await prisma.agents_group_member.findFirst({
      where: {
        group_id: groupId,
        user_id: godV2UserId,
        OR: [
          { role: 'ADMIN' },
          { user_id: group.leader_id }
        ]
      }
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'Only leaders and admins can edit whiteboards' },
        { status: 403 }
      );
    }

    const { whiteboards } = await request.json();

    // Delete existing whiteboards for this group
    await prisma.agents_group_whiteboard.deleteMany({
      where: {
        group_id: groupId,
      },
    });

    // Create new whiteboards
    const createdWhiteboards = await Promise.all(
      whiteboards.map((board: WhiteBoardContent) =>
        prisma.agents_group_whiteboard.create({
          data: {
            group_id: groupId,
            user_id: godV2UserId,
            title: board.title,
            content: board.content,
            day: new Date(board.day),
          },
        })
      )
    );

    return NextResponse.json({ success: true, whiteboards: createdWhiteboards });
  } catch (error) {
    console.error('Error in POST /api/agents-study-groups/[id]/whiteboards:', error);
    return NextResponse.json(
      { error: 'Failed to create whiteboards' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, day, group_id } = await request.json();

    if (!title || !day || !group_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Delete the whiteboard using Prisma
    await prisma.agents_group_whiteboard.deleteMany({
      where: {
        group_id: group_id,
        title: title,
        day: new Date(day)
      }
    });

    return NextResponse.json({ message: 'Whiteboard deleted successfully' });

  } catch (error) {
    console.error('Error deleting whiteboard:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete whiteboard' },
      { status: 500 }
    );
  }
}