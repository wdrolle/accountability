// /api/family/verify/[code]/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: { code: string } }
) {
  try {
    console.log('Verifying invitation code:', params.code);
    
    const invitation = await prisma.agents_invitations.findUnique({
      where: {
        token: params.code,
      },
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            subscription_status: true
          }
        }
      }
    });

    if (!invitation) {
      console.log('Invalid invitation code');
      return NextResponse.json({ error: 'Invalid invitation code' }, { status: 404 });
    }

    if (invitation.status !== 'PENDING') {
      console.log('Invitation status is not pending:', invitation.status);
      return NextResponse.json({ error: 'Invitation has already been used' }, { status: 400 });
    }

    if (new Date() > invitation.expires_at) {
      console.log('Invitation has expired');
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 400 });
    }

    // Check if inviter has an active subscription
    if (invitation.user.subscription_status !== 'ACTIVE') {
      console.log('No active subscription found for inviter');
      return NextResponse.json({ error: 'Inviter\'s subscription is no longer active' }, { status: 400 });
    }

    // Count existing family members
    const familyMemberCount = await prisma.agents_invitations_members.count({
      where: { 
        user_id: invitation.inviter_id
      }
    });

    console.log('Current family member count:', familyMemberCount);

    if (familyMemberCount >= 5) {
      console.log('Family member limit reached');
      return NextResponse.json({ error: 'Maximum family members limit reached' }, { status: 400 });
    }

    return NextResponse.json({
      inviter: {
        first_name: invitation.user.first_name,
        last_name: invitation.user.last_name,
        subscription_type: 'FAMILY'
      }
    });
  } catch (error) {
    console.error('Family invitation verification error:', error);
    return NextResponse.json({ error: 'Failed to verify invitation' }, { status: 500 });
  }
} 