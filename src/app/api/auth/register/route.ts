import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendEmail, getVerificationEmailHtml } from "@/lib/email";
import { randomBytes, randomUUID } from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Split name into first and last name
    const nameParts = name.trim().split(/\s+/);
    if (nameParts.length < 2) {
      return NextResponse.json(
        { error: "Please enter both your first and last name" },
        { status: 400 }
      );
    }

    // Get first name and last name from the full name
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');

    // Check if user exists in both auth.users and agents.user
    const existingAuthUser = await prisma.users.findUnique({
      where: { email: email.toLowerCase() }
    });

    const existingAgentUser = existingAuthUser && await prisma.user.findUnique({
      where: { id: existingAuthUser.id }
    });

    // If user exists in both tables, return exists message
    if (existingAuthUser && existingAgentUser) {
      return NextResponse.json(
        { status: 'exists', success: true, message: "User created successfully." },
        { status: 400 }
      );

    }

    const hashedPassword = await hash(password, 12);
    const verificationToken = randomBytes(32).toString('hex');
    let userId;

    try {
      // If user doesn't exist in auth.users, create them
      if (!existingAuthUser) {
        try {
          const newUserId = randomUUID();
          const newAuthUser = await prisma.users.create({
            data: {
              id: newUserId,
              instance_id: null,
              aud: 'authenticated',
              role: 'authenticated',
              email: email.toLowerCase(),
              encrypted_password: hashedPassword,
              email_confirmed_at: null,
              invited_at: null,
              confirmation_token: verificationToken,
              confirmation_sent_at: new Date(),
              recovery_token: null,
              recovery_sent_at: null,
              email_change_token_new: null,
              email_change: null,
              email_change_sent_at: null,
              last_sign_in_at: null,
              raw_app_meta_data: {},
              raw_user_meta_data: {
                first_name: firstName,
                last_name: lastName,
                subscription_plan: "STARTER",
                subscription_status: "TRIAL"
              },
              is_super_admin: false,
              created_at: new Date(),
              updated_at: new Date(),
              phone: null,
              phone_confirmed_at: null,
              phone_change: null,
              phone_change_token: null,
              phone_change_sent_at: null,
              confirmed_at: null,
              email_change_token_current: null,
              email_change_confirm_status: 0,
              banned_until: null,
              reauthentication_token: null,
              reauthentication_sent_at: null
            }
          });
          console.log('Created auth user:', newAuthUser);
          userId = newAuthUser.id;
        } catch (authError: any) {
          console.error('Auth user creation error:', authError.message, authError.stack);
          return NextResponse.json(
            { error: `Failed to create auth user: ${authError.message}` },
            { status: 500 }
          );
        }
      } else {
        userId = existingAuthUser.id;
      }

      // Create records in agent tables if they don't exist
      if (!existingAgentUser) {
        try {
          console.log('Creating agent user with ID:', userId);

          // First create agent user record
          const agentUser = await prisma.user.create({
            data: {
              id: userId,
              email: email.toLowerCase(),
              first_name: firstName,
              last_name: lastName,
              role: 'USER',
              subscription_status: 'TRIAL',
              timezone: 'America/New_York',
              created_at: new Date(),
              updated_at: new Date()
            }
          });
          console.log('Created agent user:', agentUser);

          // Check if user preferences exist before creating
          const existingPreferences = await prisma.user_preferences.findUnique({
            where: { user_id: userId }
          });

          if (!existingPreferences) {
            // Create user preferences record
            await prisma.user_preferences.create({
              data: {
                user_id: userId,
                theme_preferences: ['faith'],
                blocked_themes: [],
                message_length_preference: 'MEDIUM',
                created_at: new Date(),
                updated_at: new Date()
              }
            });
          }

          // Create subscriptions record
          try {
            console.log('Attempting to create subscription for user:', userId);
            const subscription = await prisma.subscriptions.create({
              data: {
                user_id: userId,
                status: 'TRIAL',
                theme_ids: ['faith'],
                preferred_time: new Date('2024-01-01T09:00:00Z'),
                frequency: 'DAILY',
                trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
                last_message_at: new Date(),
                next_message_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
                subscription_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
                payment_status: 'PENDING',
                subscription_plan: 'STARTER',
                family_plan: [],
                congregation: []
              }
            });
            console.log('Successfully created subscription:', subscription);
          } catch (subscriptionError: any) {
            console.error('Failed to create subscription:', {
              error: subscriptionError.message,
              stack: subscriptionError.stack,
              userId,
              code: subscriptionError.code,
              meta: subscriptionError.meta
            });
            throw subscriptionError;
          }

          // Send verification email with the SAME token
          const emailResult = await sendEmail(
            email,
            "Verify your CStudios account",
            getVerificationEmailHtml(firstName, verificationToken) // Use the same token here
          );

          if (!emailResult.success) {
            console.error('Failed to send verification email');
          }

          return NextResponse.json({
            success: true,
            message: "Registration successful! Please check your email to verify your account."
          });

        } catch (agentError: any) {
          console.error('Agent tables creation error:', agentError.message, agentError.stack);
          // If agent tables creation fails, we should clean up the auth user
          if (!existingAuthUser) {
            try {
              await prisma.users.delete({
                where: { id: userId }
              });
            } catch (cleanupError: any) {
              console.error('Cleanup error:', cleanupError.message, cleanupError.stack);
            }
          }
          return NextResponse.json(
            { error: `Failed to create agent user records: ${agentError.message}` },
            { status: 500 }
          );
        }
      }

    } catch (dbError: any) {
      console.error('Database error:', dbError.message, dbError.stack);
      return NextResponse.json(
        { error: `Database error: ${dbError.message}` },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error("Registration error:", error.message, error.stack);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
} 