// /api/agents-study-groups/[id]/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

// Define the user select type to be reused
const userSelect = {
  id: true,
  first_name: true,
  last_name: true,
  image: true,
} as const;

// Type for formatting user data
type UserData = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  image: string | null;
};

// Helper function to format user data
function formatUserData(user: UserData | null) {
  if (!user) {
    return {
      id: '',
      name: 'Anonymous',
      image: '/images/logo/agents.png'
    };
  }
  
  return {
    id: user.id,
    name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Anonymous',
    image: user.image
      ? `https://fquqnvtknptzdycxyzug.supabase.co/storage/v1/object/public/user_images/${user.image}`
      : '/images/logo/agents.png'
  };
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const groupId = await Promise.resolve(params.id);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Fetch group data with leader information
    const group = await prisma.agents_group.findUnique({
      where: { id: groupId },
      include: {
        user: {
          select: userSelect
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
        status: {
          in: ['ACTIVE', 'ACCEPTED', 'APPROVED']
        }
      },
      include: {
        user_agents_group_member_user_idTouser: {
          select: userSelect
        },
      },
    });

    // Check if user is a member or leader
    const userId = session.user?.id;
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const isMemberOrLeader = 
      group.leader_id === userId || 
      members.some(member => 
        member.user_id === userId && 
        ['ACTIVE', 'ACCEPTED', 'APPROVED'].includes(member.status || '')
      );

    if (!isMemberOrLeader) {
      return NextResponse.json(
        { error: 'Not authorized to view this group' },
        { status: 403 }
      );
    }

    // Fetch notes
    const notes = await prisma.agents_group_note.findMany({
      where: {
        group_id: groupId,
        OR: [
          { visibility: 'GROUP' },
          { visibility: 'LEADER', user_id: session.user.id },
          { visibility: 'PRIVATE', user_id: session.user.id },
        ],
      },
      include: {
        user: {
          select: userSelect
        },
      },
      orderBy: { created_at: 'desc' },
    });

    // Fetch prayers
    const prayers = await prisma.agents_group_prayer.findMany({
      where: {
        group_id: groupId,
        OR: [
          { visibility: 'GROUP' },
          { visibility: 'LEADER', user_id: session.user.id },
          { visibility: 'PRIVATE', user_id: session.user.id },
        ],
      },
      include: {
        user: {
          select: userSelect
        },
      },
      orderBy: { created_at: 'desc' },
    });

    // Fetch messages
    const messages = await prisma.agents_group_message.findMany({
      where: { group_id: groupId },
      include: {
        user: {
          select: userSelect
        },
      },
      orderBy: { created_at: 'desc' },
      take: 50, // Limit to last 50 messages
    });

    // Format the response
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
      created_at: group.created_at?.toISOString() || '',
      updated_at: group.last_active_at?.toISOString() || '',
      leader: formatUserData(group.user),
      member_count: members.length,
    };

    const formattedMembers = members.map(member => ({
      group_id: member.group_id,
      user_id: member.user_id,
      role: member.role || 'MEMBER',
      status: member.status || 'ACCEPTED',
      last_active_at: member.last_active_at?.toISOString() || null,
      visibility: member.visibility || 'GROUP',
      joined_at: member.joined_at?.toISOString() || null,
      invited_by: member.invited_by,
      invited_at: member.invited_at?.toISOString() || null,
      user: formatUserData(member.user_agents_group_member_user_idTouser),
      name: formatUserData(member.user_agents_group_member_user_idTouser).name,
      image: formatUserData(member.user_agents_group_member_user_idTouser).image,
      first_name: member.user_agents_group_member_user_idTouser?.first_name || '',
      last_name: member.user_agents_group_member_user_idTouser?.last_name || '',
    }));

    const formattedNotes = notes.map(note => ({
      ...note,
      user: formatUserData(note.user),
    }));

    const formattedPrayers = prayers.map(prayer => ({
      ...prayer,
      user: formatUserData(prayer.user),
    }));

    const formattedMessages = messages.map(message => ({
      ...message,
      user: formatUserData(message.user),
    }));

    const response = {
      group: formattedGroup,
      members: formattedMembers,
      notes: formattedNotes,
      prayers: formattedPrayers,
      messages: formattedMessages,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching group data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch group data from src/app/api/agents-study-groups/[id]/route.ts' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  return NextResponse.json(
    { error: 'Method not allowed. Use /notes endpoint for adding notes.' },
    { status: 405 }
  );
} 