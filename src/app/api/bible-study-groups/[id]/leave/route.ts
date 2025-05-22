import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const groupId = url.pathname.split('/')[4]; // Get the group ID from the URL

    if (!groupId) {
      return NextResponse.json(
        { error: 'Group ID is required' },
        { status: 400 }
      );
    }

    // Check if group exists
    const group = await prisma.agents_group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    // Check if user is a member
    const membership = await prisma.agents_group_member.findFirst({
      where: {
        group_id: groupId,
        user_id: session.user.id,
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'You are not a member of this group' },
        { status: 400 }
      );
    }

    // Check if user is the group leader
    if (group.leader_id === session.user.id) {
      return NextResponse.json(
        { error: 'Group leaders cannot leave their own group. Please transfer leadership first.' },
        { status: 400 }
      );
    }

    // Remove user from group
    await prisma.agents_group_member.delete({
      where: {
        group_id_user_id: {
          group_id: groupId,
          user_id: session.user.id,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error leaving group:', error);
    return NextResponse.json(
      { error: 'Failed to leave group' },
      { status: 500 }
    );
  }
} 