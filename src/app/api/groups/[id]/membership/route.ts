// /src/app/api/groups/[id]/membership/route.ts

// Purpose: API route for checking agents Study Group membership
//  Relationships: Used by GroupClient.tsx to check membership

// Key Functions:
//  GET: Checks if the current user is a member of a specific group
//  Returns a JSON response indicating membership status

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const groupId = url.pathname.split('/')[3];

    if (!groupId) {
      return NextResponse.json(
        { error: 'Group ID is required' },
        { status: 400 }
      );
    }

    const membership = await prisma.agents_group_member.findFirst({
      where: {
        group_id: groupId,
        user_id: session.user.id,
      },
    });

    return NextResponse.json({ isMember: !!membership });
  } catch (error) {
    console.error('Error checking membership:', error);
    return NextResponse.json(
      { error: 'Failed to check membership' },
      { status: 500 }
    );
  }
} 