import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

interface AuthUser {
  id: string;
  email: string;
  name: string | null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const groupId = params.id;
    if (!groupId) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });
    }

    const membership = await prisma.agents_group_member.findFirst({
      where: {
        group_id: groupId,
        user_id: session.user.id
      }
    });

    if (!membership) {
      return NextResponse.json({ error: 'Not a member' }, { status: 404 });
    }

    return NextResponse.json(membership);
  } catch (error) {
    console.error('Error checking membership:', error);
    return NextResponse.json(
      { error: 'Failed to check membership' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const groupId = params.id;
    if (!groupId) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });
    }

    // Get the group to check if it exists
    const group = await prisma.agents_group.findUnique({
      where: { id: groupId }
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Check if user is a member
    const membership = await prisma.agents_group_member.findFirst({
      where: {
        group_id: groupId,
        user_id: session.user.id
      }
    });

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this group' }, { status: 404 });
    }

    // Don't allow the leader to leave through this endpoint
    if (group.leader_id === session.user.id) {
      return NextResponse.json(
        { error: 'Group leader cannot leave the group' },
        { status: 400 }
      );
    }

    // Delete the membership
    await prisma.agents_group_member.delete({
      where: {
        group_id_user_id: {
          group_id: groupId,
          user_id: session.user.id
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Successfully left the group'
    });
  } catch (error) {
    console.error('Error leaving group:', error);
    return NextResponse.json(
      { error: 'Failed to leave group' },
      { status: 500 }
    );
  }
} 