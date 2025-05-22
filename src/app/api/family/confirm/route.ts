// /api/family/confirm/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const body = await request.json();
    console.log('Received body:', body);
    
    if (!body || typeof body !== 'object') {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid request body' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { invitationCode, firstName, lastName, phone, password } = body;

    if (!invitationCode || !firstName || !lastName || !password || !phone) {
      console.log('Missing required fields:', { invitationCode, firstName, lastName, phone });
      return new NextResponse(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('Looking up invitation:', invitationCode);
    const { data: invitation, error: invitationError } = await supabase
      .from('family_invitations')
      .select('*, user:inviter_id(*)')
      .eq('invitation_code', invitationCode)
      .single();

    if (invitationError || !invitation) {
      console.error('Error fetching invitation:', invitationError);
      return new NextResponse(
        JSON.stringify({ error: 'Invalid invitation code' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('Found invitation:', invitation);

    if (invitation.status !== 'PENDING') {
      return new NextResponse(
        JSON.stringify({ error: 'Invitation has already been used' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (new Date() > new Date(invitation.expires_at)) {
      return new NextResponse(
        JSON.stringify({ error: 'Invitation has expired' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (invitation.user.subscription_status !== 'ACTIVE') {
      return new NextResponse(
        JSON.stringify({ error: "Inviter's subscription is no longer active" }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { count: familyMemberCount, error: countError } = await supabase
      .from('family_members')
      .select('*', { count: 'exact', head: true })
      .eq('family_id', invitation.inviter_id);

    if (countError) {
      console.error('Error counting family members:', countError);
      return new NextResponse(
        JSON.stringify({ error: 'Failed to verify family member count' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('Current family member count:', familyMemberCount);

    if (familyMemberCount && familyMemberCount >= 5) {
      return new NextResponse(
        JSON.stringify({ error: 'Maximum family members limit reached' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Start a transaction by using multiple operations
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Creating auth user...');

    // Create auth.users record
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: invitation.email,
      password: password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        phone: phone
      }
    });

    if (authError || !authUser.user) {
      console.error('Error creating auth user:', authError);
      return new NextResponse(
        JSON.stringify({ error: 'Failed to create authentication user' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('Created auth user:', authUser.user.id);

    // Create agents.user record
    console.log('Creating app user...');
    const { data: appUser, error: appUserError } = await supabase
      .from('user')
      .insert({
        id: authUser.user.id,
        email: invitation.email,
        first_name: firstName,
        last_name: lastName,
        phone: phone,
        subscription_status: 'ACTIVE',
        role: 'USER',
        email_verified: new Date().toISOString(),
        timezone: 'America/New_York'
      })
      .select()
      .single();

    if (appUserError || !appUser) {
      console.error('Error creating app user:', appUserError);
      // Attempt to rollback auth user
      await supabase.auth.admin.deleteUser(authUser.user.id);
      return new NextResponse(
        JSON.stringify({ error: 'Failed to create application user' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('Created app user:', appUser.id);

    // Copy subscription from inviter
    console.log('Copying subscription from inviter...');
    const { error: subscriptionError } = await supabase.rpc(
      'copy_subscription_to_family_member',
      {
        inviter_id: invitation.inviter_id,
        invitee_id: authUser.user.id
      }
    );

    if (subscriptionError) {
      console.error('Error copying subscription:', subscriptionError);
      // Attempt rollback
      await supabase.auth.admin.deleteUser(authUser.user.id);
      await supabase.from('user').delete().eq('id', appUser.id);
      return new NextResponse(
        JSON.stringify({ error: 'Failed to copy subscription details' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Update invitation status
    console.log('Updating invitation status...');
    const { error: inviteUpdateError } = await supabase
      .from('family_invitations')
      .update({ status: 'ACTIVE' })
      .eq('id', invitation.id);

    if (inviteUpdateError) {
      console.error('Error updating invitation:', inviteUpdateError);
      // Attempt rollback
      await supabase.auth.admin.deleteUser(authUser.user.id);
      await supabase.from('user').delete().eq('id', appUser.id);
      return new NextResponse(
        JSON.stringify({ error: 'Failed to update invitation status' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create family member record
    console.log('Creating family member record...');
    const { error: familyMemberError } = await supabase
      .from('family_members')
      .insert({
        family_id: invitation.inviter_id,
        member_id: authUser.user.id,
        added_at: new Date().toISOString()
      });

    if (familyMemberError) {
      console.error('Error creating family member:', familyMemberError);
      // Attempt rollback
      await supabase.auth.admin.deleteUser(authUser.user.id);
      await supabase.from('user').delete().eq('id', appUser.id);
      await supabase
        .from('family_invitations')
        .update({ status: 'PENDING' })
        .eq('id', invitation.id);
      return new NextResponse(
        JSON.stringify({ error: 'Failed to create family member record' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('All operations completed successfully');

    return new NextResponse(
      JSON.stringify({
        success: true,
        message: 'Family member account created successfully',
        user: {
          id: appUser.id,
          email: appUser.email,
          firstName: appUser.first_name,
          lastName: appUser.last_name,
          subscription_status: appUser.subscription_status
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Family invitation confirmation error:', error);
    return new NextResponse(
      JSON.stringify({ error: error.message || 'Failed to confirm invitation' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}