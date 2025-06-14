import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendEmail, getVerificationEmailHtml } from "@/lib/email";
import { randomBytes, randomUUID, createHash } from "crypto";

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
    const normalizedEmail = email.toLowerCase().trim();

    console.log('📝 Registration request for:', { firstName, lastName, email: normalizedEmail });

    // More robust user existence check using raw SQL to avoid caching issues
    console.log('🔍 Checking user existence with raw SQL...');
    
    const authUserCheck = await prisma.$queryRaw`
      SELECT id, email, created_at FROM auth.users 
      WHERE LOWER(TRIM(email)) = ${normalizedEmail} 
      LIMIT 1
    `;
    
    const existingAuthUser = Array.isArray(authUserCheck) && authUserCheck.length > 0 ? authUserCheck[0] : null;
    
    let existingAccountabilityUser = null;
    if (existingAuthUser) {
      const accountabilityUserCheck = await prisma.$queryRaw`
        SELECT id, email, created_at FROM accountability."user" 
        WHERE id = ${(existingAuthUser as any).id}::uuid 
        LIMIT 1
      `;
      existingAccountabilityUser = Array.isArray(accountabilityUserCheck) && accountabilityUserCheck.length > 0 ? accountabilityUserCheck[0] : null;
    }

    console.log('🔍 User check results:', {
      existingAuthUser: !!existingAuthUser,
      existingAccountabilityUser: !!existingAccountabilityUser,
      authUserEmail: existingAuthUser ? (existingAuthUser as any).email : 'none',
      authUserId: existingAuthUser ? (existingAuthUser as any).id : 'none'
    });

    // If user exists in both tables, return exists message
    if (existingAuthUser && existingAccountabilityUser) {
      return NextResponse.json(
        { 
          status: 'exists', 
          success: false, 
          message: "User already exists with this email address.",
          debug: {
            authUser: (existingAuthUser as any).id,
            accountabilityUser: (existingAccountabilityUser as any).id
          }
        },
        { status: 400 }
      );
    }

    // If user exists in auth but not in accountability, we can create accountability records
    if (existingAuthUser && !existingAccountabilityUser) {
      console.log('User exists in auth but not accountability, creating accountability records for:', (existingAuthUser as any).id);
    }

    const hashedPassword = await hash(password, 12);
    const verificationToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(verificationToken).digest('hex');
    const userId = existingAuthUser ? (existingAuthUser as any).id : randomUUID();

    try {
      // Use Prisma transaction to handle all database operations atomically
      const result = await prisma.$transaction(async (tx) => {
        
        // If user doesn't exist in auth.users, create them with accountability app metadata
        if (!existingAuthUser) {
          console.log('✨ Creating new auth user with ID:', userId);
          
          // Double-check within transaction to prevent race conditions
          const doubleCheck = await tx.$queryRaw`
            SELECT id FROM auth.users WHERE LOWER(TRIM(email)) = ${normalizedEmail} LIMIT 1
          `;
          
          if (Array.isArray(doubleCheck) && doubleCheck.length > 0) {
            throw new Error(`Email ${normalizedEmail} already exists in database (race condition detected)`);
          }
          
          const newAuthUser = await tx.users.create({
            data: {
              id: userId,
              instance_id: null,
              aud: 'authenticated',
              role: 'authenticated',
              email: normalizedEmail,
              encrypted_password: hashedPassword,
              email_confirmed_at: null,
              invited_at: null,
              confirmation_token: null, // We'll use one_time_tokens instead
              confirmation_sent_at: new Date(),
              recovery_token: null,
              recovery_sent_at: null,
              email_change_token_new: null,
              email_change: null,
              email_change_sent_at: null,
              last_sign_in_at: null,
              raw_app_meta_data: {},
              raw_user_meta_data: {
                app: 'accountability', // This triggers the automatic user creation
                firstName: firstName,
                lastName: lastName,
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
          console.log('✅ Created auth user:', newAuthUser.id);

          // Create verification token in one_time_tokens table
          await tx.one_time_tokens.create({
            data: {
              id: randomUUID(),
              user_id: userId,
              token_type: 'confirmation_token',
              token_hash: tokenHash,
              relates_to: normalizedEmail,
              created_at: new Date(),
              updated_at: new Date()
            }
          });
          console.log('✅ Created verification token in one_time_tokens');
        } else {
          // For existing auth users, create verification token if email not confirmed
          const authUser = existingAuthUser as any;
          if (!authUser.email_confirmed_at) {
            console.log('📧 Creating verification token for existing unverified user:', authUser.id);
            
            // Delete any existing confirmation tokens for this user
            await tx.one_time_tokens.deleteMany({
              where: {
                user_id: authUser.id,
                token_type: 'confirmation_token'
              }
            });

            // Create new verification token
            await tx.one_time_tokens.create({
              data: {
                id: randomUUID(),
                user_id: authUser.id,
                token_type: 'confirmation_token',
                token_hash: tokenHash,
                relates_to: normalizedEmail,
                created_at: new Date(),
                updated_at: new Date()
              }
            });
            console.log('✅ Created verification token for existing user');
          }
        }

        // Check if accountability user was created by the trigger (for new users) or create manually (for existing auth users)
        let accountabilityUser = await tx.user.findUnique({
          where: { id: userId }
        });

        if (!accountabilityUser) {
          console.log('🔧 Creating accountability user manually (trigger didn\'t fire):', userId);
          accountabilityUser = await tx.user.create({
            data: {
              id: userId,
              email: normalizedEmail,
              first_name: firstName,
              last_name: lastName,
              role: 'USER',
              subscription_status: 'TRIAL',
              timezone: 'America/New_York',
              created_at: new Date(),
              updated_at: new Date()
            }
          });
          console.log('✅ Created accountability user manually:', accountabilityUser.id);
        } else {
          console.log('✅ Accountability user exists (created by trigger):', accountabilityUser.id);
        }

        // Create user preferences if they don't exist
        let userPreferences = await tx.user_preferences.findUnique({
          where: { user_id: userId }
        });

        if (!userPreferences) {
          console.log('📝 Creating user preferences for user:', userId);
          userPreferences = await tx.user_preferences.create({
            data: {
              user_id: userId,
              theme_preferences: ['faith'],
              blocked_themes: [],
              message_length_preference: 'MEDIUM',
              created_at: new Date(),
              updated_at: new Date()
            }
          });
          console.log('✅ Created user preferences:', userPreferences.id);
        }

        // Create subscriptions record if it doesn't exist
        let subscription = await tx.subscriptions.findUnique({
          where: { user_id: userId }
        });

        if (!subscription) {
          console.log('📋 Creating subscription for user:', userId);
          subscription = await tx.subscriptions.create({
            data: {
              user_id: userId,
              status: 'TRIAL',
              theme_ids: ['faith'],
              preferred_time: new Date('1970-01-01T09:00:00.000Z'),
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
          console.log('✅ Created subscription:', subscription.id);
        }

        return {
          authUser: !existingAuthUser,
          accountabilityUser: !!accountabilityUser,
          userPreferences: !!userPreferences,
          subscription: !!subscription,
          userId: userId
        };
      });

      console.log('🎉 Transaction completed successfully:', result);

      // Send verification email for new users or existing users with unconfirmed emails
      const shouldSendEmail = !existingAuthUser || (existingAuthUser && !(existingAuthUser as any).email_confirmed_at);
      
      if (shouldSendEmail) {
        try {
          const emailResult = await sendEmail(
            email,
            "Verify your CStudios account",
            getVerificationEmailHtml(firstName, verificationToken)
          );

          if (!emailResult.success) {
            console.error('Failed to send verification email');
          }
        } catch (emailError: any) {
          console.error('Email sending error:', emailError);
          // Don't fail the registration if email fails
        }
      }

      // Determine appropriate message based on user state
      let message;
      if (!existingAuthUser) {
        message = "Registration successful! Please check your email to verify your account.";
      } else if (!(existingAuthUser as any).email_confirmed_at) {
        message = "Accountability account created successfully! Please check your email to verify your account.";
      } else {
        message = "Accountability account created successfully! You can now use your existing login credentials.";
      }

      return NextResponse.json({
        success: true,
        message: message,
        userId: result.userId
      });

    } catch (dbError: any) {
      console.error('Database transaction error:', {
        message: dbError.message,
        code: dbError.code,
        meta: dbError.meta,
        stack: dbError.stack
      });
      
      // Provide more specific error messages
      if (dbError.code === 'P2002') {
        return NextResponse.json(
          { error: "Email already registered. Please use a different email or try logging in." },
          { status: 400 }
        );
      } else if (dbError.code === 'P2003') {
        return NextResponse.json(
          { error: "Foreign key constraint error. Please try again." },
          { status: 500 }
        );
      } else if (dbError.message.includes('race condition detected')) {
        return NextResponse.json(
          { error: "Email was just registered by another request. Please try logging in instead." },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: `Failed to create user account: ${dbError.message}` },
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