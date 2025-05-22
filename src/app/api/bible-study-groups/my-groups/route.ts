// /src/app/api/agents-study-groups/my-groups/route.ts

// Purpose: API route for handling agents Study Group CRUD operations
//  Relationships: Used by GroupClient.tsx to fetch and manage groups

// Key Functions:
//  GET: Fetches all groups for the current user
//  PUT: Updates a group's details
//  DELETE: Deletes a group

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
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

    // Get the group ID from the URL if it exists
    const url = new URL(request.url);
    const groupId = url.pathname.split('/').pop();

    // If a specific group ID is provided, fetch that group
    if (groupId && groupId !== 'my-groups') {
      const group = await prisma.agents_group.findUnique({
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

      if (!group) {
        return NextResponse.json(
          { error: 'Group not found' },
          { status: 404 }
        );
      }

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
    }

    // Otherwise, fetch all groups for the user
    const groups = await prisma.agents_group.findMany({
      where: {
        OR: [
          { leader_id: session.user.id },
          {
            agents_group_member: {
              some: {
                user_id: session.user.id,
              },
            },
          },
        ],
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

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const groupId = url.pathname.split('/').pop();

    if (!groupId || groupId === 'my-groups') {
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

    const updatedGroup = await prisma.agents_group.update({
      where: { id: groupId },
      data: {
        name,
        description,
        meeting_schedule,
        location,
        current_topic,
        language,
        visibility: visibility.toUpperCase(),
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
    };

    return NextResponse.json({ group: formattedGroup });
  } catch (error) {
    console.error('Error updating group:', error);
    return NextResponse.json(
      { error: 'Failed to update group' },
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
    const groupId = url.pathname.split('/').pop();

    if (!groupId || groupId === 'my-groups') {
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

    // Delete all group members first
    await prisma.agents_group_member.deleteMany({
      where: { group_id: groupId },
    });

    // Then delete the group
    await prisma.agents_group.delete({
      where: { id: groupId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting group:', error);
    return NextResponse.json(
      { error: 'Failed to delete group' },
      { status: 500 }
    );
  }
} 