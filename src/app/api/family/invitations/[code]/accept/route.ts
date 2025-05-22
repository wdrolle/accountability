// /src/app/api/family/invitations/[code]/accept/route.ts

import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
// If you have enum roles, import them from '@prisma/client':
import { user_role_enum, subscription_status_enum, user_status_enum } from '@prisma/client';

export async function POST(
  request: Request,
  context: { params: Promise<{ code: string }> }
) {
  // console.log('1. [Debug] Entering /api/family/invitations/[code]/accept route...');

  // 1) Read the dynamic route param: must await
  const p = await context.params;
  const invitationCode = p.code;
  // console.log('2. [Debug] Route param code:', invitationCode);

  // 2) Parse request body
  let body: any;
  try {
    body = await request.json();
    // console.log('3. [Debug] Parsed request body:', body);
  } catch (parseError) {
    console.error('4. [Error] Parsing request body:', parseError);
    return NextResponse.json(
      { success: false, message: 'Invalid request body' },
      { status: 400 }
    );
  }

  // 3) Extract fields from body
  const { firstName, lastName, phone, password } = body;
  // console.log('5. [Debug] Fields extracted:', {
  //   invitationCode: invitationCode,
  //   firstName,
  //   lastName,
  //   phone,
  //   password: !!password, // logs true if password is present
  // });

  // 4.a) Validate presence
  if (invitationCode && firstName && lastName && phone && password) {
    // console.log('4.a) [Debug] all required fields are present.');
  }
  // 4.b) Check for required fields
  if (!invitationCode ) {
    // console.log('4.b) [Debug] Missing required fields. Returning 400...');
    return NextResponse.json(
      { success: false, message: 'All fields are required (code)' },
      { status: 400 }
    );
  }
  if (!firstName) {
    // console.log('4.b) [Debug] Missing required fields. Returning 400...');
    return NextResponse.json(
      { success: false, message: 'All fields are required (firstName)' },
      { status: 400 }
    );
  }
  if (!lastName) {
    // console.log('4.b) [Debug] Missing required fields. Returning 400...');
    return NextResponse.json(
      { success: false, message: 'All fields are required (lastName)' },
      { status: 400 }
    );
  }
  if (!phone) {
    // console.log('4.b) [Debug] Missing required fields. Returning 400...');
    return NextResponse.json(
      { success: false, message: 'All fields are required (phone)' },
      { status: 400 }
    );
  }
  if (!password) {
    // console.log('4.b) [Debug] Missing required fields. Returning 400...');
    return NextResponse.json(
      { success: false, message: 'All fields are required (password)' },
      { status: 400 }
    );
  }

  // 5) Format phone to E.164
  const digitsOnly = phone.replace(/\D/g, '');
  if (digitsOnly.length < 10) {
    // console.log('5. [Debug] Invalid phone format:', digitsOnly);
    return NextResponse.json(
      { success: false, message: 'Invalid phone number format' },
      { status: 400 }
    );
  }
  const e164Phone = digitsOnly.length === 10 ? `+1${digitsOnly}` : `+${digitsOnly}`;
  // console.log('6. [Debug] e164Phone:', e164Phone);

  // Fetch the invitation first
  const invitation = await prisma.agents_invitations.findFirst({
    where: {
      token: invitationCode,
      status: user_status_enum.PENDING
    },
    include: {
      user: true
    }
  });

  if (!invitation) {
    return NextResponse.json(
      { success: false, message: 'Invalid or expired invitation code' },
      { status: 400 }
    );
  }

  // console.log('7. [Debug] Found invitation:', {
  //   id: invitation.id,
  //   inviter_id: invitation.inviter_id,
  //   invitee_email: invitation.email,
  //   status: invitation.status
  // });

  // Now prepare the data with the correct email
  const hashedPassword = await bcrypt.hash(password, 12);
  const newUserId = randomBytes(16).toString('hex').replace(
    /(.{8})(.{4})(.{4})(.{4})(.{12})/,
    '$1-$2-$3-$4-$5'
  );
  const now = new Date();
  const inviteeEmail = invitation.email.toLowerCase();

  const auth_User_Data = {
    id: newUserId,
    aud: 'authenticated',
    role: 'authenticated',
    email: inviteeEmail,
    encrypted_password: hashedPassword,
    first_name: firstName,
    last_name: lastName,
    email_confirmed_at: now,
    confirmation_sent_at: now,
    raw_app_meta_data: JSON.stringify({
      provider: 'email',
      providers: ['email']
    }),
    raw_user_meta_data: JSON.stringify({
      first_name: firstName,
      last_name: lastName
    }),
    created_at: now,
    updated_at: now,
    phone: e164Phone,
    confirmed_at: now,
    phone_confirmed_at: null,
    phone_change: "",
    phone_change_token: "",
    phone_change_sent_at: null,
    email_change_token_new: null,
    email_change: null,
    email_change_sent_at: null,
    recovery_token: null,
    recovery_sent_at: null,
    email_change_token_current: "",
    email_change_confirm_status: 0,
    banned_until: null,
    reauthentication_token: "",
    reauthentication_sent_at: null,
    is_sso_user: false,
    deleted_at: null,
    is_anonymous: false,
    invited_at: null,
    is_super_admin: false,
    confirmation_token: null
  };

  const agents_User_Data = {
    id: newUserId,
    email: inviteeEmail,
    name: `${firstName} ${lastName}`,
    first_name: firstName,
    last_name: lastName,
    phone: e164Phone,
    role: user_role_enum.USER,
    subscription_status: subscription_status_enum.TRIAL,
    email_verified: now,
    image: null,
    password: hashedPassword,
    password_reset_token: null,
    password_reset_token_exp: null,
    created_at: now,
    updated_at: now,
    timezone: 'America/New_York',
    text_message_time: '09:00'
  };

  // 6) Prepare creation data
  try {
    // Disable the trigger before starting transaction
    await prisma.$executeRaw`ALTER TABLE agents.family_members DISABLE TRIGGER update_family_count_trigger`;

    // Prepare data
    await prisma.$transaction(async (tx) => {
      // console.log('10. [Debug] Creating auth.users record...');
      const createdAuthUser = await tx.users.create({ 
        data: auth_User_Data
      });
      // console.log('10.a [Debug] Auth user created:', { id: createdAuthUser.id });

      // console.log('11. [Debug] Creating agents.user record...');
      // console.log('11.a [Debug] Full agents_User_Data:', JSON.stringify(agents_User_Data, null, 2));
      
      // Create agents.user record with explicit fields
      const createdAppUser = await tx.user.upsert({
        where: { id: newUserId },
        create: {
          id: newUserId,
          email: inviteeEmail,
          name: `${firstName} ${lastName}`.trim(),
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: e164Phone,
          role: user_role_enum.USER,
          subscription_status: subscription_status_enum.TRIAL,
          email_verified: now,
          image: null,
          password: hashedPassword,
          password_reset_token: null,
          password_reset_token_exp: null,
          created_at: now,
          updated_at: now,
          timezone: 'America/New_York',
          text_message_time: '09:00'
        },
        update: {
          name: `${firstName} ${lastName}`.trim(),
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: e164Phone,
          updated_at: now
        }
      });
      // console.log('11.b [Debug] App user created:', { id: createdAppUser.id, email: createdAppUser.email });

      // Create user preferences
      // console.log('11.c [Debug] Creating user preferences...');
      const preferencesId = randomBytes(16).toString('hex').replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');
      // console.log('11.c.1 [Debug] Generated preferences ID:', preferencesId);

      const preferencesData = {
        id: preferencesId,
        user_id: newUserId,
        theme_preferences: ['faith'],
        blocked_themes: [],
        preferred_agents_version: ['DeepSeek-Coding'],
        message_length_preference: 'MEDIUM',
        created_at: now,
        updated_at: now
      };
      // console.log('11.c.2 [Debug] User preferences data:', JSON.stringify(preferencesData, null, 2));

      try {
        // console.log('11.c.3 [Debug] Attempting to upsert user preferences...');
        const userPreferences = await tx.user_preferences.upsert({
          where: {
            user_id: newUserId
          },
          create: preferencesData,
          update: {
            theme_preferences: ['faith'],
            blocked_themes: [],
            preferred_agents_version: ['DeepSeek-Coding'],
            message_length_preference: 'MEDIUM',
            updated_at: now
          }
        });
        // console.log('11.c.4 [Debug] Raw user preferences result:', userPreferences);
        // console.log('11.d [Debug] User preferences created:', { id: userPreferences.id, userId: userPreferences.user_id });
      } catch (error: any) {
        console.error('11.c.5 [Error] Failed to create user preferences. Error details:', {
          name: error?.name || 'Unknown error name',
          message: error?.message || 'Unknown error message',
          code: error?.code,
          meta: error?.meta,
          stack: error?.stack
        });
        throw error;
      }

      // Update invitation status
      // console.log('11.e [Debug] Updating invitation status...');
      await tx.agents_invitations.update({
        where: { id: invitation.id },
        data: {
          status: user_status_enum.ACCEPTED,
          updated_at: now
        }
      });
      // console.log('11.f [Debug] Invitation status updated');

      // First get the FAMILY subscription plan
      // console.log('11.g [Debug] Getting FAMILY subscription plan...');
      const familyPlan = await tx.subscription_plans.findFirst({
        where: { name: 'FAMILY' }
      });
      if (!familyPlan) {
        throw new Error('FAMILY subscription plan not found');
      }
      // console.log('11.h [Debug] Found FAMILY plan:', familyPlan);

      // Ensure inviter has a subscription
      // console.log('11.i [Debug] Checking/creating inviter subscription...');
      const inviterSubscription = await tx.subscriptions.upsert({
        where: { id: invitation.inviter_id },
        create: {
          user_id: invitation.inviter_id,
          subscription_plan: 'FAMILY',
          status: 'ACTIVE',
          created_at: now,
          updated_at: now
        },
        update: {} // No updates needed if exists
      });
      // console.log('11.j [Debug] Inviter subscription:', inviterSubscription);

      // Create family member record
      // console.log('11.k [Debug] Creating family member record...');
      
      // First ensure the family member doesn't already exist
      const existingMember = await tx.agents_invitations_members.findFirst({
        where: {
          family_id: invitation.inviter_id,
          user_id: newUserId
        }
      });

      if (!existingMember) {
        try {
          // First get the subscription record
          const subscription = await tx.subscriptions.findFirst({
            where: { user_id: invitation.inviter_id }
          });
          
          if (!subscription) {
            throw new Error('Subscription not found for inviter');
          }

          // console.log('11.k.0 [Debug] Current subscription family_plan:', subscription.family_plan);

          // Check current family member count - only if family_plan array exists
          const currentFamilyCount = subscription.family_plan && Array.isArray(subscription.family_plan) ? subscription.family_plan.length : 0;
          // console.log('11.k.0.1 [Debug] Current family count:', currentFamilyCount);

          if (currentFamilyCount >= 5) {
            return NextResponse.json(
              { 
                success: false, 
                message: 'This family plan has reached its maximum limit of 5 members. Please contact the plan owner.' 
              },
              { status: 400 }
            );
          }

          // Update the subscription's family_plan array first
          await tx.subscriptions.update({
            where: { id: subscription.id },
            data: {
              family_plan: {
                set: Array.isArray(subscription.family_plan) ? [...subscription.family_plan, newUserId] : [newUserId]
              }
            }
          });
          // console.log('11.k.1 [Debug] Updated subscription family plan');

          // Create family member record using raw SQL to bypass trigger
          await tx.$executeRaw`
            INSERT INTO agents.family_members (family_id, member_id, added_at)
            VALUES (${invitation.inviter_id}::uuid, ${newUserId}::uuid, ${now})
            ON CONFLICT DO NOTHING
          `;
          // console.log('11.l [Debug] Family member record created');
        } catch (error: any) {
          console.error('11.l.1 [Error] Failed to create family member:', {
            error: error?.message || error,
            code: error?.code,
            meta: error?.meta,
            stack: error?.stack
          });
          throw error;
        }
      } else {
        // console.log('11.l [Debug] Family member record already exists');
      }

      // Create family subscription record
      // console.log('11.m [Debug] Creating family subscription record...');
      await tx.subscriptions.create({
        data: {
          id: randomBytes(16).toString('hex').replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5'),
          user_id: invitation.inviter_id,
          status: 'ACTIVE',
          created_at: now,
          updated_at: now
        }
      });
      // console.log('11.n [Debug] Family subscription record created');

      // Connect the users after creation
      // console.log('11.e [Debug] Connecting auth user to app user...');
      await tx.users.update({
        where: { id: newUserId },
        data: {
          user: {
            connect: { id: newUserId }
          }
        }
      });
      // console.log('11.f [Debug] Users connected');
    });

    // Re-enable the trigger after transaction
    await prisma.$executeRaw`ALTER TABLE agents.family_members ENABLE TRIGGER update_family_count_trigger`;

    // 8) Now call your DB function to attach them to the invitation
    // console.log('12. [Debug] Attempting to accept invitation via function...');

    // Check for pending invitation
    const pendingInvitation = await prisma.agents_invitations.findFirst({
      where: {
        token: invitationCode,
        email: inviteeEmail,
        status: user_status_enum.PENDING
      }
    });

    if (!pendingInvitation) {
      // console.log('12.a. [Debug] No pending invitation found.');
    }

    // Update the invitation to ACCEPTED
    // console.log('12.b [Debug] Updating invitation to ACCEPTED...');
    const acceptResult = await prisma.agents_invitations.update({
      where: {
        token: invitationCode,
        email: inviteeEmail
      },
      data: {
        status: user_status_enum.ACCEPTED,
        updated_at: now
      }
    });

    const final = { accept_family_invitation: !!acceptResult };
    // console.log('12.c. [Debug] acceptResult row:', final);

    if (!final || !final.accept_family_invitation) {
      // console.log('12.d. [Debug] Invitation acceptance returned false');
      return NextResponse.json(
        { success: false, message: 'Invitation acceptance failed. Possibly expired or limit reached.' },
        { status: 400 }
      );
    }

    // console.log('12.e. [Debug] Invitation accepted successfully!');
    return NextResponse.json(
      {
        success: true,
        message: 'Invitation accepted, new family member added!',
        user: {
          id: newUserId,
          firstName,
          lastName,
          phone: e164Phone,
        },
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('12.f. [Error] In invitation acceptance code:', err);
    return NextResponse.json(
      {
        success: false,
        message: err.message || 'Internal error. Possibly invalid enum for role or DB trigger error.',
      },
      { status: 500 }
    );
  }
}
