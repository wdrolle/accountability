// /src/app/api/agents-study-groups/my-groups/[id]/members/route.ts

// Purpose: API route for managing agents Study Group members
//  Relationships: Used by GroupClient.tsx to manage group members

// Key Functions:
//  POST: Adds a new member to a group
//  DELETE: Removes a member from a group

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {

    // Get the session
    // it is used to check if the user is authenticated
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get the group ID from the URL
    // it is used to check if the user is the leader of the group
    const url = new URL(request.url);
    const groupId = url.pathname.split('/')[5]; // Get the group ID from the URL

    // Check if the group ID is provided
    // if not, return an error
    if (!groupId) {
      return NextResponse.json(
        { error: 'Group ID is required' },
        { status: 400 }
      );
    }

    // Get the group data from the database
    // it is used to check if the user is the leader of the group
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

    // Check if the user is the leader of the group
    // if not, return an error
    if (group.leader_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get the user ID and role from the request
    // it is used to add a new member to the group
    const data = await request.json();
    const { user_id, role } = data;

    // Validate required fields
    // if not, return an error
    if (!user_id || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if the user exists
    // if not, return an error
    const user = await prisma.user.findUnique({
      where: { id: user_id },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if the user is already a member of the group
    // if not, return an error
    const existingMember = await prisma.agents_group_member.findFirst({
      where: {
        group_id: groupId,
        user_id: user_id,
      },
    });

    if (existingMember) {
      // Update the existing member's role
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
      // Add a new member to the group
      await prisma.agents_group_member.create({
        data: {
          group_id: groupId,
          user_id: user_id,
          role: role.toUpperCase(),
        },
      });
    }

    // Fetch the updated group data
    // it is used to display the updated group data
    // DO NOT CHANGE THIS CODE. IT IS WORKING AS INTENDED.
    // The code is designed to fetch the updated group data.
    // updatedGroup is the updated group data.
    // it is used by GroupDetailClient.tsx to display the updated group data.
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

    // Format the group data
    // it is used to display the updated group data
    // DO NOT CHANGE THIS CODE. IT IS WORKING AS INTENDED.
    // The code is designed to format the group data.
    // formattedGroup is the formatted group data.
    // it is used by GroupDetailClient.tsx to display the updated group data.
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

    // Return the updated group data
    // it is used by GroupDetailClient.tsx to display the updated group data.
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

interface UserMetaData {
  first_name?: string;
  last_name?: string;
  image?: string | null;
}

// Helper function to format user data
function formatUserData(user: { first_name: string | null; last_name: string | null; image: string | null }) {
  return {
    name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Anonymous',
    image: user.image
      ? `https://fquqnvtknptzdycxyzug.supabase.co/storage/v1/object/public/user_images/${user.image}`
      : '/images/logo/agents.png'
  };
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const groupId = url.pathname.split('/')[4]; // Get the group ID from the URL

    if (!groupId) {
      return NextResponse.json(
        { error: 'Group ID is required' },
        { status: 400 }
      );
    }

    // First, get the group to get the leader info
    const group = await prisma.agents_group.findUnique({
      where: { id: groupId },
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            image: true,
          }
        },
      },
    });

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    // Fetch members with user information
    const members = await prisma.agents_group_member.findMany({
      where: { 
        group_id: groupId,
        status: 'ACTIVE',
      },
      include: {
        user_agents_group_member_user_idTouser: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            image: true,
          }
        },
      },
    });

    // Create leader member object
    const leaderMember = {
      group_id: groupId,
      user_id: group.leader_id,
      role: 'LEADER',
      status: 'ACCEPTED',
      last_active_at: group.last_active_at?.toISOString() || null,
      visibility: 'GROUP',
      joined_at: group.created_at?.toISOString() || null,
      invited_by: null,
      invited_at: null,
      user: {
        id: group.user.id,
        ...formatUserData(group.user)
      },
      name: formatUserData(group.user).name,
      image: formatUserData(group.user).image,
    };

    // Format the members data and include the leader
    const formattedMembers = [
      leaderMember,
      ...members.map(member => ({
        group_id: member.group_id,
        user_id: member.user_id,
        role: member.role || 'MEMBER',
        status: member.status || 'ACCEPTED',
        last_active_at: member.last_active_at?.toISOString() || null,
        visibility: member.visibility || 'GROUP',
        joined_at: member.joined_at?.toISOString() || null,
        invited_by: member.invited_by,
        invited_at: member.invited_at?.toISOString() || null,
        user: {
          id: member.user_agents_group_member_user_idTouser.id,
          ...formatUserData(member.user_agents_group_member_user_idTouser)
        },
        name: formatUserData(member.user_agents_group_member_user_idTouser).name,
        image: formatUserData(member.user_agents_group_member_user_idTouser).image,
      }))
    ];

    return NextResponse.json({ members: formattedMembers });
  } catch (error) {
    console.error('Error fetching group members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch group members' },
      { status: 500 }
    );
  }
}