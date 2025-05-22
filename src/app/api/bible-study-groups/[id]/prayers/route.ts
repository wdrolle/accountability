import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const groupId = params.id;

    // Check if user is a member of the group
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
        { error: 'You must be a member to submit prayer requests' },
        { status: 403 }
      );
    }

    const { content, isAnonymous, isGroupOnly } = await request.json();

    if (!content?.trim()) {
      return NextResponse.json(
        { error: 'Prayer request content is required' },
        { status: 400 }
      );
    }

    const prayerRequest = await prisma.prayer_requests.create({
      data: {
        content,
        user_id: session.user.id,
        group_id: groupId,
        is_anonymous: isAnonymous,
        visibility: isGroupOnly ? 'GROUP' : 'PUBLIC',
        status: 'PENDING',
        tags: [],
        reactions: {
          hearts: 0,
          thumbsUp: 0,
        },
        journal_entries: [],
        shared_responses: [],
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Prayer request submitted successfully',
      prayerRequest,
    });
  } catch (error) {
    console.error('Error creating prayer request:', error);
    return NextResponse.json(
      { error: 'Failed to submit prayer request' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const groupId = params.id;

    // Check if user is a member of the group
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
        { error: 'You must be a member to view prayer requests' },
        { status: 403 }
      );
    }

    const prayerRequests = await prisma.prayer_requests.findMany({
      where: {
        group_id: groupId,
        OR: [
          { visibility: 'PUBLIC' },
          { visibility: 'GROUP' },
          { user_id: session.user.id },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        prayers: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      prayerRequests,
    });
  } catch (error) {
    console.error('Error fetching prayer requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prayer requests' },
      { status: 500 }
    );
  }
} 