import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role } = await request.json();
    const { id: groupId, userId } = params;

    // Check if the current user is the group leader
    const group = await prisma.agents_group.findUnique({
      where: { id: groupId },
      select: { leader_id: true },
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    if (group.leader_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Only the group leader can update member roles' },
        { status: 403 }
      );
    }

    // Don't allow changing the role of the group leader
    if (userId === group.leader_id) {
      return NextResponse.json(
        { error: 'Cannot change the role of the group leader' },
        { status: 400 }
      );
    }

    // Update the member's role
    const updatedMember = await prisma.agents_group_member.update({
      where: {
        group_id_user_id: {
          group_id: groupId,
          user_id: userId,
        },
      },
      data: {
        role,
      },
    });

    return NextResponse.json({ member: updatedMember });
  } catch (error) {
    console.error('Error updating member role:', error);
    return NextResponse.json(
      { error: 'Failed to update member role' },
      { status: 500 }
    );
  }
} 