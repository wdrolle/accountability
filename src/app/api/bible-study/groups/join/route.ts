import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { groupId } = await request.json();

    // Check if the group exists
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        group_member: true
      }
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }
    // Check if user is already a member
    const existingMembership = await prisma.group_member.findFirst({
      where: {
        group_id: groupId,
        user_id: user.id
      }
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: 'You are already a member of this group' },
        { status: 400 }
      );
    }

    // Add user as a member
    const membership = await prisma.group_member.create({
      data: {
        group_id: groupId,
        user_id: user.id,
        role: 'MEMBER'
      }
    });


    // Send email notification to the new member and group leader
    // TODO: Implement email notification

    return NextResponse.json({ membership });
  } catch (error) {
    console.error('Error joining agents study group:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 