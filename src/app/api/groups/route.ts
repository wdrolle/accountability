// /src/app/api/groups/route.ts

// Purpose: API route for handling agents Study Group CRUD operations
//  Relationships: Used by GroupClient.tsx to fetch and manage groups

// Key Functions:
//  GET: Fetches all groups for the current user
//  POST: Creates a new group

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
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

    const { searchParams } = new URL(request.url);
    const memberOnly = searchParams.get('member_only') === 'true';

    const groups = await prisma.agents_group.findMany({
      where: memberOnly ? {
        agents_group_member: {
          some: {
            user_id: session.user.id
          }
        }
      } : undefined,
      include: {
        user: {
          select: {
            first_name: true,
            last_name: true,
            image: true,
          },
        },
        agents_group_member: {
          select: {
            user_id: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

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
          : '/images/logo/agents.png'
      },
      member_count: group.agents_group_member.length,
      isMember: group.agents_group_member.some(member => member.user_id === session.user.id)
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

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const data = await request.json();
    const {
      name,
      description,
      meeting_schedule,
      location,
      current_topic,
      language,
      visibility,
    } = data;

    // Validate required fields
    if (!name || !description || !language || !visibility) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const group = await prisma.agents_group.create({
      data: {
        name,
        description,
        meeting_schedule,
        location,
        current_topic,
        language,
        visibility: visibility.toUpperCase(),
        leader_id: session.user.id,
        agents_group_member: {
          create: {
            user_id: session.user.id,
            role: 'LEADER',
            status: 'ACCEPTED',
          },
        },
      },
      include: {
        user: {
          select: {
            first_name: true,
            last_name: true,
            image: true,
          },
        },
        agents_group_member: {
          select: {
            user_id: true,
          },
        },
      },
    });

    const formattedGroup = {
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
          : '/images/logo/agents.png'
      },
      member_count: group.agents_group_member.length,
    };

    return NextResponse.json({ group: formattedGroup });
  } catch (error) {
    console.error('Error creating group:', error);
    let errorMessage = 'Failed to create group';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 