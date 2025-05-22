// /src/app/api/groups/available/route.ts

// Purpose: API route for fetching available groups
//  Relationships: Used by groups/page.tsx to fetch public groups

// Key Functions:
//  Fetches all public groups
//  Includes leader information and member count
//  Handles authentication and session management

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Fetch all public groups
    const groups = await prisma.agents_group.findMany({
      where: {
        visibility: 'PUBLIC',
      },
      include: {
        user: {
          select: {
            first_name: true,
            last_name: true,
            image: true,
          },
        },
        agents_group_member: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    // Format the groups data
    const formattedGroups = groups.map((group) => ({
      id: group.id,
      name: group.name,
      description: group.description,
      leader_id: group.leader_id,
      meeting_schedule: group.meeting_schedule,
      location: group.location,
      current_topic: group.current_topic,
      language: group.language,
      visibility: group.visibility,
      created_at: group.created_at,
      leader: {
        name: `${group.user.first_name} ${group.user.last_name}`.trim() || 'Anonymous',
        image: group.user.image 
          ? `https://fquqnvtknptzdycxyzug.supabase.co/storage/v1/object/public/user_images/${group.user.image}`
          : '/placeholder-user.jpg'
      },
      member_count: group.agents_group_member.length,
    }));

    return NextResponse.json({ groups: formattedGroups });
  } catch (error) {
    console.error('Error fetching groups:', error);
    return NextResponse.json(
      { error: 'Failed to fetch groups' },
      { status: 500 }
    );
  }
} 