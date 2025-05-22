// /src/app/api/groups/[id]/members/route.ts

// Purpose: API route for managing agents Study Group members
//  Relationships: Used by GroupClient.tsx to manage group members

// Key Functions:
//  GET: Fetches members for a specific group
//  POST: Adds a new member to a group
//  DELETE: Removes a member from a group

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Role priority for sorting
const ROLE_PRIORITY = {
  'LEADER': 0,
  'ADMIN': 1,
  'MEMBER': 2,
};

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const groupId = params.id;

    // Get the group to check if the current user is the leader
    const group = await prisma.agents_group.findUnique({
      where: { id: groupId },
      select: { leader_id: true }
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const members = await prisma.agents_group_member.findMany({
      where: {
        group_id: groupId,
      },
      include: {
        user_agents_group_member_user_idTouser: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            image: true,
          },
        },
      },
      orderBy: {
        joined_at: 'desc',
      },
    });

    const formattedMembers = members.map((member) => ({
      id: member.user_agents_group_member_user_idTouser.id,
      name: `${member.user_agents_group_member_user_idTouser.first_name} ${member.user_agents_group_member_user_idTouser.last_name}`.trim() || 'Anonymous',
      image: member.user_agents_group_member_user_idTouser.image 
        ? `https://fquqnvtknptzdycxyzug.supabase.co/storage/v1/object/public/user_images/${member.user_agents_group_member_user_idTouser.image}`
        : null,
      role: member.user_agents_group_member_user_idTouser.id === group.leader_id ? 'LEADER' : (member.role || 'MEMBER'),
      joined_at: member.joined_at,
    }))
    // Sort by role priority first, then by join date
    .sort((a, b) => {
      const rolePriorityDiff = ROLE_PRIORITY[a.role as keyof typeof ROLE_PRIORITY] - ROLE_PRIORITY[b.role as keyof typeof ROLE_PRIORITY];
      if (rolePriorityDiff !== 0) return rolePriorityDiff;
      
      // If same role, sort by join date (most recent first)
      return new Date(b.joined_at || 0).getTime() - new Date(a.joined_at || 0).getTime();
    });

    return NextResponse.json({ members: formattedMembers });
  } catch (error) {
    console.error('Error fetching group members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch group members' },
      { status: 500 }
    );
  }
} 