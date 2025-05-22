// /src/app/api/family/invitations/[code]/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const code = await params.code;
    console.log('Fetching invitation with code:', code);

    const invitation = await prisma.family_invitations.findFirst({
      where: {
        invitation_code: code,
        status: 'PENDING'
      },
      include: {
        user: {
          select: {
            first_name: true,
            last_name: true
          }
        }
      }
    });

    if (!invitation) {
      console.log('Invitation not found or already used');
      return NextResponse.json(
        { error: 'Invalid or expired invitation' },
        { status: 404 }
      );
    }

    if (new Date() > invitation.expires_at) {
      console.log('Invitation has expired');
      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      invitation: {
        id: invitation.id,
        status: invitation.status,
        expires_at: invitation.expires_at,
        inviter_name: `${invitation.user.first_name} ${invitation.user.last_name}`,
        email: invitation.email
      }
    });
  } catch (error) {
    console.error('Error fetching invitation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invitation' },
      { status: 500 }
    );
  }
} 