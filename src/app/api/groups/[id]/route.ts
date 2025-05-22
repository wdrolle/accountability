// /src/app/api/groups/[id]/route.ts

// Purpose: API route for handling agents Study Group CRUD operations
//  Relationships: Used by GroupClient.tsx to fetch and manage groups

// Key Functions:
//  GET: Fetches a specific group by ID
//  PUT: Updates a group's details
//  DELETE: Deletes a group

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

const formatImageUrl = (image: string | null) => {
  if (!image) return '/placeholder-user.jpg';
  if (image.startsWith('http')) return image;
  return `https://fquqnvtknptzdycxyzug.supabase.co/storage/v1/object/public/user_images/${image}`;
};

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const group = await prisma.agents_group.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            first_name: true,
            last_name: true,
            image: true,
          },
        },
        agents_group_member: {
          include: {
            user_agents_group_member_user_idTouser: {
              select: {
                first_name: true,
                last_name: true,
                image: true,
              },
            },
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Format the response
    const formattedGroup = {
      ...group,
      leader: {
        name: `${group.user.first_name} ${group.user.last_name}`.trim(),
        image: formatImageUrl(group.user.image),
      },
      members: group.agents_group_member.map(member => ({
        user_id: member.user_id,
        role: member.role,
        name: `${member.user_agents_group_member_user_idTouser.first_name} ${member.user_agents_group_member_user_idTouser.last_name}`.trim(),
        image: formatImageUrl(member.user_agents_group_member_user_idTouser.image),
      })),
      member_count: group.agents_group_member.length,
    };

    return NextResponse.json({ group: formattedGroup });
  } catch (error) {
    console.error('Error fetching group:', error);
    return NextResponse.json({ error: 'Failed to fetch group' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const group = await prisma.agents_group.findUnique({
      where: { id: params.id },
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
      where: { id: params.id },
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

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const group = await prisma.agents_group.findUnique({
      where: { id: params.id },
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
      where: { group_id: params.id },
    });

    // Then delete the group
    await prisma.agents_group.delete({
      where: { id: params.id },
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