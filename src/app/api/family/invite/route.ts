// src/app/api/family/invite/route.ts

import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import prisma from '@/lib/prisma';
import { sendFamilyInvitationEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    console.log('Starting invitation process...');
    const body = await request.json();
    console.log('Request body:', body);
    const { email, inviterId } = body;

    if (!email || !inviterId) {
      console.log('Missing required fields:', { email, inviterId });
      return NextResponse.json(
        { success: false, error: "Missing Fields" },
        { status: 400 }
      );
    }

    console.log('Looking up inviter:', inviterId);
    const inviter = await prisma.user.findUnique({
      where: { id: inviterId },
      select: {
        id: true,
        first_name: true,
        last_name: true,
      },
    });
    console.log('Inviter found:', inviter);

    if (!inviter) {
      console.log('Invalid inviter - not found');
      return NextResponse.json(
        { success: false, error: "Invalid inviter" },
        { status: 400 }
      );
    }

    // Check active subscription in agents.subscriptions table
    const activeSubscription = await prisma.subscriptions.findFirst({
      where: { 
        user_id: inviterId,
        status: 'ACTIVE'
      }
    });
    console.log('Active subscription:', activeSubscription);

    if (!activeSubscription || activeSubscription.status !== 'ACTIVE') {
      console.log('No active subscription found');
      return NextResponse.json(
        { success: false, error: "Active subscription required" },
        { status: 400 }
      );
    }

    // Default to 5 family members for now
    const maxFamilyMembers = 5;

    // Check if max family members limit is reached
    const currentFamilyMembers = await prisma.family_members.count({
      where: { family_id: inviterId }
    });
    console.log('Current family members:', currentFamilyMembers);
    console.log('Max family members allowed:', maxFamilyMembers);

    if (currentFamilyMembers >= maxFamilyMembers) {
      return NextResponse.json(
        { success: false, error: "Maximum family members limit reached" },
        { status: 400 }
      );
    }

    console.log('Checking for existing user with email:', email);
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      console.log('Email already registered');
      return NextResponse.json(
        { success: false, error: "Email already registered" },
        { status: 400 }
      );
    }

    // Generate a shorter invitation code (20 chars max)
    const invitationCode = uuidv4().split('-')[0];
    const inviteUrl = `${process.env.NEXTAUTH_URL}/community/add-family/confirm/${invitationCode}`;
    console.log('Generated invitation code:', invitationCode);
    console.log('Generated invitation URL:', inviteUrl);

    console.log('Creating invitation record with data:', {
      inviter_id: inviterId,
      email,
      invitation_code: invitationCode,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'PENDING'
    });

    try {
      await prisma.family_invitations.create({
        data: {
          id: uuidv4(),
          inviter_id: inviterId,
          email,
          token: invitationCode,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          status: 'PENDING',
        },
      });
      console.log('Successfully created invitation record');
    } catch (dbError) {
      console.error('Database error creating invitation:', dbError);
      throw dbError;
    }

    console.log('Sending family invitation email...');
    try {
      const inviterName = `${inviter.first_name} ${inviter.last_name}`;
      const emailResult = await sendFamilyInvitationEmail(
        email,
        inviterName,
        inviteUrl
      );
      console.log('Email sent successfully:', emailResult);
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      throw emailError;
    }

    console.log('Invitation process completed successfully');
    return NextResponse.json({
      success: true,
      message: "Invitation sent successfully",
    });
  } catch (error) {
    console.error('Invitation error details:', {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { success: false, error: "Failed to send invitation" },
      { status: 500 }
    );
  }
}