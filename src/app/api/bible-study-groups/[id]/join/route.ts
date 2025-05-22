import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// Validate UUID format
function isValidUUID(uuid: string) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const groupId = params.id;
    if (!groupId) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });
    }

    // Get the group to check if it exists and get visibility
    const group = await prisma.agents_group.findUnique({
      where: { id: groupId }
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    // Check if already a member
    const existingMembership = await prisma.agents_group_member.findFirst({
      where: {
        group_id: groupId,
        user_id: session.user.id
      }
    });

    if (existingMembership) {
      return NextResponse.json({ error: 'Already a member' }, { status: 400 });
    }

    // Create new membership
    const membership = await prisma.agents_group_member.create({
      data: {
        group_id: groupId,
        user_id: session.user.id,
        role: 'MEMBER',
        status: group.visibility === 'PUBLIC' ? 'ACCEPTED' : 'PENDING',
        joined_at: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      membership,
      message: group.visibility === 'PUBLIC' 
        ? 'Successfully joined the group' 
        : 'Membership request sent'
    });
  } catch (error) {
    console.error('Error joining group:', error);
    return NextResponse.json(
      { error: 'Failed to join group' },
      { status: 500 }
    );
  }
}