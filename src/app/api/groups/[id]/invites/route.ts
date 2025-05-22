import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET: Fetch invites for a group
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

    // Check if user is admin or leader
    const membership = await prisma.agents_group_member.findFirst({
      where: {
        group_id: groupId,
        user_id: session.user.id,
        OR: [
          { role: 'ADMIN' },
          {
            agents_group: {
              leader_id: session.user.id
            }
          }
        ]
      }
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'Not authorized to view invites' },
        { status: 403 }
      );
    }

    const invites = await prisma.agents_group_member.findMany({
      where: {
        group_id: groupId,
        status: 'PENDING'
      },
      include: {
        agents_group: {
          select: {
            id: true,
            name: true,
            leader_id: true
          }
        },
        user_agents_group_member_user_idTouser: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            image: true
          }
        }
      },
      orderBy: {
        invited_at: 'desc'
      }
    });

    return NextResponse.json({ invites });
  } catch (error) {
    console.error('Error fetching group invites:', error);
    return NextResponse.json(
      { error: 'Failed to fetch group invites' },
      { status: 500 }
    );
  }
}

// POST: Send an invite to a user
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const groupId = params.id;
    const { userId } = await request.json();

    // Check if user is admin or leader
    const membership = await prisma.agents_group_member.findFirst({
      where: {
        group_id: groupId,
        user_id: session.user.id,
        OR: [
          { role: 'ADMIN' },
          {
            agents_group: {
              leader_id: session.user.id
            }
          }
        ]
      }
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'Not authorized to send invites' },
        { status: 403 }
      );
    }

    // Check if user is already a member
    const existingMembership = await prisma.agents_group_member.findFirst({
      where: {
        group_id: groupId,
        user_id: userId,
        status: {
          in: ['ACCEPTED', 'PENDING']
        }
      }
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: existingMembership.status === 'ACCEPTED' ? 
            'User is already a member' : 'User already has a pending invite' },
        { status: 400 }
      );
    }

    // Create the invite
    const invite = await prisma.agents_group_member.create({
      data: {
        group_id: groupId,
        user_id: userId,
        role: 'MEMBER',
        status: 'PENDING',
        invited_by: session.user.id,
        invited_at: new Date()
      },
      include: {
        agents_group: {
          select: {
            id: true,
            name: true,
            leader_id: true
          }
        },
        user_agents_group_member_user_idTouser: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            image: true
          }
        }
      }
    });

    return NextResponse.json({ invite });
  } catch (error) {
    console.error('Error creating group invite:', error);
    return NextResponse.json(
      { error: 'Failed to create group invite' },
      { status: 500 }
    );
  }
}

// PUT: Update invite status (accept/reject)
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const groupId = params.id;
    const { action } = await request.json();

    if (!['ACCEPT', 'REJECT'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    // Get the invite
    const invite = await prisma.agents_group_member.findFirst({
      where: {
        group_id: groupId,
        user_id: session.user.id,
        status: 'PENDING'
      }
    });

    if (!invite) {
      return NextResponse.json(
        { error: 'Invite not found or already processed' },
        { status: 404 }
      );
    }

    // Update the invite status
    const updatedInvite = await prisma.agents_group_member.update({
      where: {
        group_id_user_id: {
          group_id: groupId,
          user_id: session.user.id
        }
      },
      data: {
        status: action === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED',
        joined_at: action === 'ACCEPT' ? new Date() : null
      }
    });

    return NextResponse.json({ invite: updatedInvite });
  } catch (error) {
    console.error('Error updating group invite:', error);
    return NextResponse.json(
      { error: 'Failed to update group invite' },
      { status: 500 }
    );
  }
}

// DELETE: Cancel an invite (admin/leader only)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const groupId = params.id;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if user is admin or leader
    const membership = await prisma.agents_group_member.findFirst({
      where: {
        group_id: groupId,
        user_id: session.user.id,
        OR: [
          { role: 'ADMIN' },
          {
            agents_group: {
              leader_id: session.user.id
            }
          }
        ]
      }
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'Not authorized to cancel invites' },
        { status: 403 }
      );
    }

    // Delete the invite
    await prisma.agents_group_member.delete({
      where: {
        group_id_user_id: {
          group_id: groupId,
          user_id: userId
        }
      }
    });

    return NextResponse.json({ message: 'Invite cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling group invite:', error);
    return NextResponse.json(
      { error: 'Failed to cancel group invite' },
      { status: 500 }
    );
  }
} 