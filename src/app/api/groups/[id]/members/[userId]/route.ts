import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: groupId, userId } = params;

    // Check if the current user is the group leader or an admin
    const group = await prisma.agents_group.findUnique({
      where: { id: groupId },
      select: { leader_id: true },
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const currentUserMembership = await prisma.agents_group_member.findFirst({
      where: {
        group_id: groupId,
        user_id: session.user.id,
        OR: [
          { role: 'ADMIN' },
          {
            agents_group: {
              leader_id: session.user.id
            }
          }
        ]
      }
    });

    if (!currentUserMembership) {
      return NextResponse.json(
        { error: 'Only group leaders and admins can remove members' },
        { status: 403 }
      );
    }

    // Don't allow removing the group leader
    if (userId === group.leader_id) {
      return NextResponse.json(
        { error: 'Cannot remove the group leader' },
        { status: 400 }
      );
    }

    // Remove the member
    await prisma.agents_group_member.delete({
      where: {
        group_id_user_id: {
          group_id: groupId,
          user_id: userId,
        },
      },
    });

    return NextResponse.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Error removing member:', error);
    return NextResponse.json(
      { error: 'Failed to remove member' },
      { status: 500 }
    );
  }
} 