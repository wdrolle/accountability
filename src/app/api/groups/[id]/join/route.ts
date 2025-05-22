// /src/app/api/groups/[id]/join/route.ts

// Purpose: API route for joining a agents Study Group
//  Relationships: Used by GroupClient.tsx to join a group

// Key Functions:
//  POST: Joins a user to a group
//  Fetches updated group data after joining

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
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const groupId = params.id;
    const userId = session.user.id;

    // Check if user is already a member
    const existingMembership = await prisma.agents_group_member.findFirst({
      where: {
        group_id: groupId,
        user_id: userId,
      },
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: 'Already a member of this group' },
        { status: 400 }
      );
    }

    // Add user to group
    await prisma.agents_group_member.create({
      data: {
        group_id: groupId,
        user_id: userId,
        role: 'MEMBER',
      },
    });

    return NextResponse.json({ message: 'Successfully joined group' });
  } catch (error) {
    console.error('Error joining group:', error);
    return NextResponse.json(
      { error: 'Failed to join group' },
      { status: 500 }
    );
  }
} 