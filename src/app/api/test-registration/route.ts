import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { randomBytes, randomUUID } from "crypto";

export async function POST(req: Request) {
  try {
    console.log('🚀 Step-by-step registration test started');
    
    const body = await req.json();
    const { name, email, password } = body;
    
    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    
    const firstName = name.split(' ')[0];
    const lastName = name.split(' ').slice(1).join(' ') || 'Test';
    const hashedPassword = await hash(password, 12);
    const verificationToken = randomBytes(32).toString('hex');
    const userId = randomUUID();
    
    console.log('📝 Test data prepared:', { userId, firstName, lastName, email });
    
    // Step 1: Test auth.users insertion with raw SQL
    try {
      console.log('🔍 Step 1: Testing auth.users insertion...');
      await prisma.$executeRaw`
        INSERT INTO auth.users (
          id, aud, role, email, encrypted_password, 
          confirmation_token, confirmation_sent_at, 
          raw_user_meta_data, is_super_admin, 
          created_at, updated_at, is_sso_user, is_anonymous
        ) VALUES (
          ${userId}::uuid,
          'authenticated',
          'authenticated', 
          ${email.toLowerCase()},
          ${hashedPassword},
          ${verificationToken},
          NOW(),
          '{"test": "data"}'::jsonb,
          false,
          NOW(),
          NOW(),
          false,
          false
        )
      `;
      console.log('✅ Step 1 completed: auth.users insertion successful');
    } catch (step1Error) {
      console.error('❌ Step 1 failed:', step1Error);
      return NextResponse.json({
        error: "Step 1 failed: auth.users insertion",
        details: String(step1Error),
        step: 1
      }, { status: 500 });
    }
    
    // Step 2: Test accountability.user insertion
    try {
      console.log('🔍 Step 2: Testing accountability.user insertion...');
      await prisma.user.create({
        data: {
          id: userId,
          email: email.toLowerCase(),
          first_name: firstName,
          last_name: lastName,
          role: 'USER',
          subscription_status: 'TRIAL',
          timezone: 'America/New_York'
        }
      });
      console.log('✅ Step 2 completed: accountability.user insertion successful');
    } catch (step2Error) {
      console.error('❌ Step 2 failed:', step2Error);
      // Cleanup auth user
      try {
        await prisma.$executeRaw`DELETE FROM auth.users WHERE id = ${userId}::uuid`;
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
      return NextResponse.json({
        error: "Step 2 failed: accountability.user insertion",
        details: String(step2Error),
        step: 2
      }, { status: 500 });
    }
    
    // Step 3: Test user_preferences insertion
    try {
      console.log('🔍 Step 3: Testing user_preferences insertion...');
      await prisma.user_preferences.create({
        data: {
          user_id: userId,
          theme_preferences: ['faith'],
          blocked_themes: [],
          message_length_preference: 'MEDIUM'
        }
      });
      console.log('✅ Step 3 completed: user_preferences insertion successful');
    } catch (step3Error) {
      console.error('❌ Step 3 failed:', step3Error);
      // Cleanup previous records
      try {
        await prisma.user.delete({ where: { id: userId } });
        await prisma.$executeRaw`DELETE FROM auth.users WHERE id = ${userId}::uuid`;
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
      return NextResponse.json({
        error: "Step 3 failed: user_preferences insertion", 
        details: String(step3Error),
        step: 3
      }, { status: 500 });
    }
    
    // Step 4: Test subscriptions insertion
    try {
      console.log('🔍 Step 4: Testing subscriptions insertion...');
      await prisma.subscriptions.create({
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
      console.log('✅ Step 4 completed: subscriptions insertion successful');
    } catch (step4Error) {
      console.error('❌ Step 4 failed:', step4Error);
      // Cleanup previous records
      try {
        await prisma.user_preferences.delete({ where: { user_id: userId } });
        await prisma.user.delete({ where: { id: userId } });
        await prisma.$executeRaw`DELETE FROM auth.users WHERE id = ${userId}::uuid`;
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
      return NextResponse.json({
        error: "Step 4 failed: subscriptions insertion",
        details: String(step4Error),
        step: 4
      }, { status: 500 });
    }
    
    console.log('🎉 All steps completed successfully!');
    
    return NextResponse.json({
      success: true,
      message: "Step-by-step registration test completed successfully",
      userId: userId,
      steps: ['auth.users', 'accountability.user', 'user_preferences', 'subscriptions']
    });
    
  } catch (mainError) {
    console.error('❌ Main error in step-by-step test:', mainError);
    return NextResponse.json({
      error: "Main error in registration test",
      details: String(mainError)
    }, { status: 500 });
  }
} 