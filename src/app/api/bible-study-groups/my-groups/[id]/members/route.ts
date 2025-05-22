// /src/app/api/agents-study-groups/my-groups/[id]/members/route.ts

// Purpose: API route for managing agents Study Group members
//  Relationships: Used by GroupClient.tsx to manage group members

// Key Functions:
//  POST: Adds a new member to a group
//  DELETE: Removes a member from a group

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../auth/[...nextauth]/route';
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
    const groupId = url.pathname.split('/')[5]; // Get the group ID from the URL

    if (!groupId) {
      return NextResponse.json(
        { error: 'Group ID is required' },
        { status: 400 }
      );
    }

    const group = await prisma.agents_group.findUnique({
      where: { id: groupId },
      select: { leader_id: true },
    });

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    // Check if user is the group leader
    if (group.leader_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const data = await request.json();
    const { user_id, role } = data;

    // Validate required fields
    if (!user_id || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: user_id },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is already a member
    const existingMember = await prisma.agents_group_member.findFirst({
      where: {
        group_id: groupId,
        user_id: user_id,
      },
    });

    if (existingMember) {
      // Update existing member's role
      await prisma.agents_group_member.update({
        where: {
          group_id_user_id: {
            group_id: groupId,
            user_id: user_id
          }
        },
        data: {
          role: role.toUpperCase(),
        },
      });
    } else {
      // Add new member
      await prisma.agents_group_member.create({
        data: {
          group_id: groupId,
          user_id: user_id,
          role: role.toUpperCase(),
        },
      });
    }

    // Fetch updated group data
    const updatedGroup = await prisma.agents_group.findUnique({
      where: { id: groupId },
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
            role: true,
          },
        },
      },
    });

    if (!updatedGroup) {
      return NextResponse.json(
        { error: 'Failed to fetch updated group' },
        { status: 500 }
      );
    }

    const formattedGroup = {
      id: updatedGroup.id,
      name: updatedGroup.name,
      description: updatedGroup.description,
      leader_id: updatedGroup.leader_id,
      meeting_schedule: updatedGroup.meeting_schedule,
      location: updatedGroup.location,
      current_topic: updatedGroup.current_topic,
      language: updatedGroup.language,
      visibility: updatedGroup.visibility,
      created_at: updatedGroup.created_at,
      leader: {
        name: `${updatedGroup.user.first_name} ${updatedGroup.user.last_name}`.trim() || 'Anonymous',
        image: updatedGroup.user.image 
          ? `https://fquqnvtknptzdycxyzug.supabase.co/storage/v1/object/public/user_images/${updatedGroup.user.image}`
          : '/images/logo/agents.png'
      },
      member_count: updatedGroup.agents_group_member.length,
      members: updatedGroup.agents_group_member,
    };

    return NextResponse.json({ group: formattedGroup });
  } catch (error) {
    console.error('Error managing group member:', error);
    return NextResponse.json(
      { error: 'Failed to manage group member' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const groupId = url.pathname.split('/')[5]; // Get the group ID from the URL
    const userId = url.searchParams.get('user_id');

    if (!groupId || !userId) {
      return NextResponse.json(
        { error: 'Group ID and User ID are required' },
        { status: 400 }
      );
    }

    const group = await prisma.agents_group.findUnique({
      where: { id: groupId },
      select: { leader_id: true },
    });

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    // Check if user is the group leader
    if (group.leader_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Remove member from group
    await prisma.agents_group_member.deleteMany({
      where: {
        group_id: groupId,
        user_id: userId,
      },
    });

    // Fetch updated group data
    const updatedGroup = await prisma.agents_group.findUnique({
      where: { id: groupId },
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
            role: true,
          },
        },
      },
    });

    if (!updatedGroup) {
      return NextResponse.json(
        { error: 'Failed to fetch updated group' },
        { status: 500 }
      );
    }

    const formattedGroup = {
      id: updatedGroup.id,
      name: updatedGroup.name,
      description: updatedGroup.description,
      leader_id: updatedGroup.leader_id,
      meeting_schedule: updatedGroup.meeting_schedule,
      location: updatedGroup.location,
      current_topic: updatedGroup.current_topic,
      language: updatedGroup.language,
      visibility: updatedGroup.visibility,
      created_at: updatedGroup.created_at,
      leader: {
        name: `${updatedGroup.user.first_name} ${updatedGroup.user.last_name}`.trim() || 'Anonymous',
        image: updatedGroup.user.image 
          ? `https://fquqnvtknptzdycxyzug.supabase.co/storage/v1/object/public/user_images/${updatedGroup.user.image}`
          : '/images/logo/agents.png'
      },
      member_count: updatedGroup.agents_group_member.length,
      members: updatedGroup.agents_group_member,
    };

    return NextResponse.json({ group: formattedGroup });
  } catch (error) {
    console.error('Error removing group member:', error);
    return NextResponse.json(
      { error: 'Failed to remove group member' },
      { status: 500 }
    );
  }
} 