import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { user_status_enum } from '@prisma/client';

// GET: Fetch all pending invites for the user
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get pending invites for the user
    const pendingInvites = await prisma.agents_invitations.findMany({
      where: {
        inviter_id: session.user.id,
        status: user_status_enum.PENDING
      }
    });

    // Then get the members separately if needed
    const membersInfo = await prisma.agents_invitations_members.findMany({
      where: {
        family_id: {
          in: pendingInvites.map(invite => invite.id)
        },
        user_id: session.user.id,
        role: 'MEMBER'
      }
    });

    // Combine the data
    const invitesWithMembers = pendingInvites.map(invite => ({
      ...invite,
      members: membersInfo.filter(member => member.family_id === invite.id)
    }));

    return NextResponse.json(invitesWithMembers);
  } catch (error) {
    console.error('Error fetching invites:', error);
    return NextResponse.json({ error: 'Failed to fetch invites' }, { status: 500 });
  }
}

// POST: Accept or reject an invite
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { email, token } = await req.json();

    // Create invitation
    const invite = await prisma.agents_invitations.create({
      data: {
        inviter_id: session.user.id,
        email,
        token,
        status: user_status_enum.PENDING,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    });

    // Create member record
    await prisma.agents_invitations_members.create({
      data: {
        family_id: invite.id,
        user_id: session.user.id,
        role: 'MEMBER'
      }
    });

    // Create subscription record
    await prisma.agents_invitations_subscriptions.create({
      data: {
        family_id: invite.id,
        subscription_id: invite.id,
        status: 'TRIAL'
      }
    });

    return NextResponse.json({ success: true, invite });
  } catch (error) {
    console.error('Error creating invite:', error);
    return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { token, accept } = await req.json();

    // Find the invitation
    const invitation = await prisma.agents_invitations.findUnique({
      where: { token }
    });

    if (!invitation) {
      return NextResponse.json({ error: 'Invalid invitation' }, { status: 404 });
    }

    if (accept) {
      // Accept invitation
      await prisma.agents_invitations_members.create({
        data: {
          family_id: invitation.id,
          user_id: session.user.id,
          role: 'MEMBER'
        }
      });

      // Update invitation status
      await prisma.agents_invitations.update({
        where: { id: invitation.id },
        data: { status: user_status_enum.ACTIVE }
      });
    } else {
      // Decline invitation
      await prisma.agents_invitations.update({
        where: { id: invitation.id },
        data: { status: user_status_enum.BLOCKED }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing invite:', error);
    return NextResponse.json({ error: 'Failed to process invite' }, { status: 500 });
  }
} 