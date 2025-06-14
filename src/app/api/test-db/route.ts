import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  // If action=schema-check, check actual database schema
  if (action === 'schema-check') {
    try {
      console.log('🔍 Checking database schema...');
      
      // Check user table structure
      const userTable = await prisma.$queryRaw`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'accountability' AND table_name = 'user'
        ORDER BY ordinal_position
      `;
      console.log('👤 User table structure:', userTable);
      
      // Check user_preferences table structure
      const userPrefsTable = await prisma.$queryRaw`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'accountability' AND table_name = 'user_preferences'
        ORDER BY ordinal_position
      `;
      console.log('⚙️ User_preferences table structure:', userPrefsTable);
      
      // Check if there are any records in these tables
      const userCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM accountability.user`;
      const prefsCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM accountability.user_preferences`;
      
      console.log('📊 Table counts:', { userCount, prefsCount });
      
      return NextResponse.json({
        success: true,
        message: "Schema check completed",
        schema: {
          userTable,
          userPrefsTable,
          counts: { userCount, prefsCount }
        }
      });
      
    } catch (error: any) {
      console.error('❌ Schema check error:', error);
      return NextResponse.json({
        error: "Schema check failed",
        details: error?.message || 'Unknown error'
      }, { status: 500 });
    }
  }

  // If action=comprehensive-fix, run the comprehensive foreign key fix
  if (action === 'comprehensive-fix') {
    try {
      console.log('🔧 Starting comprehensive foreign key constraint fix...');
      
      // Step 1: Check ALL foreign key constraints on user_preferences table
      console.log('🔍 Checking ALL constraints on user_preferences table...');
      const allConstraints = await prisma.$queryRaw`
        SELECT 
          tc.constraint_name, 
          tc.table_name, 
          kcu.column_name, 
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name 
        FROM 
          information_schema.table_constraints AS tc 
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND tc.table_name = 'user_preferences'
          AND tc.table_schema = 'accountability'
      `;
      
      console.log('All current constraints on user_preferences:', allConstraints);
      
      // Step 2: Drop ALL foreign key constraints on user_preferences table
      console.log('🗑️ Dropping ALL foreign key constraints on user_preferences...');
      
      // Get constraint names to drop
      const constraintNames = await prisma.$queryRaw`
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'user_preferences' 
          AND table_schema = 'accountability'
          AND constraint_type = 'FOREIGN KEY'
      `;
      
      console.log('Constraints to drop:', constraintNames);
      
      // Drop each constraint
      for (const constraint of constraintNames as any[]) {
        console.log(`Dropping constraint: ${constraint.constraint_name}`);
        const constraintName = constraint.constraint_name;
        await prisma.$executeRawUnsafe(`
          ALTER TABLE accountability.user_preferences 
          DROP CONSTRAINT IF EXISTS "${constraintName}"
        `);
      }
      console.log('✅ All old constraints dropped');
      
      // Step 3: Create the correct foreign key constraint
      console.log('🔗 Creating the correct constraint...');
      await prisma.$executeRaw`
        ALTER TABLE accountability.user_preferences 
        ADD CONSTRAINT user_preferences_user_id_fkey 
          FOREIGN KEY (user_id) 
          REFERENCES accountability."user"(id) 
          ON DELETE CASCADE
          DEFERRABLE INITIALLY DEFERRED
      `;
      console.log('✅ Correct constraint created');
      
      // Step 4: Verify the fix
      console.log('🔍 Verifying the fix...');
      const finalConstraints = await prisma.$queryRaw`
        SELECT 
          tc.constraint_name, 
          tc.table_name, 
          kcu.column_name, 
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name 
        FROM 
          information_schema.table_constraints AS tc 
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND tc.table_name = 'user_preferences'
          AND tc.table_schema = 'accountability'
      `;
      
      console.log('Final constraints:', finalConstraints);
      console.log('🎉 Comprehensive foreign key constraint fix completed!');
      
      return NextResponse.json({
        success: true,
        message: "Foreign key constraints fixed comprehensively!",
        before: allConstraints,
        after: finalConstraints
      });
      
    } catch (error: any) {
      console.error('❌ Error in comprehensive fix:', error);
      return NextResponse.json({
        error: "Failed to fix foreign key constraints",
        details: error?.message || 'Unknown error'
      }, { status: 500 });
    }
  }

  // Default database connectivity test
  try {
    console.log('🔍 Testing database connectivity...');
    
    // Test basic connection
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Basic connection works');
    
    // Test auth schema access
    try {
      const authTest = await prisma.$queryRaw`SELECT COUNT(*) as count FROM auth.users`;
      console.log('✅ Auth schema access works:', authTest);
    } catch (authError) {
      console.log('❌ Auth schema error:', authError);
      return NextResponse.json({
        error: "Auth schema access failed",
        details: String(authError)
      });
    }
    
    // Test accountability schema access
    try {
      const accountabilityTest = await prisma.$queryRaw`SELECT COUNT(*) as count FROM accountability.user`;
      console.log('✅ Accountability schema access works:', accountabilityTest);
    } catch (accountabilityError) {
      console.log('❌ Accountability schema error:', accountabilityError);
      return NextResponse.json({
        error: "Accountability schema access failed", 
        details: String(accountabilityError)
      });
    }
    
    // Test foreign key constraint
    try {
      const fkTest = await prisma.$queryRaw`
        SELECT 
          tc.constraint_name, 
          tc.table_name, 
          kcu.column_name, 
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name 
        FROM 
          information_schema.table_constraints AS tc 
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND tc.constraint_name = 'user_preferences_user_id_fkey'
      `;
      console.log('✅ Foreign key constraint info:', fkTest);
    } catch (fkError) {
      console.log('❌ Foreign key query error:', fkError);
    }
    
    return NextResponse.json({
      success: true,
      message: "Database connectivity test passed",
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    return NextResponse.json({
      error: "Database test failed",
      details: String(error)
    }, { status: 500 });
  }
}

export async function POST() {
  try {
    console.log('🧪 Testing manual user creation with raw SQL...');
    
    // Use crypto.randomUUID() for proper UUID format
    const { randomUUID } = await import('crypto');
    const userId = randomUUID();
    const email = `test-${Date.now()}@example.com`;
    
    console.log('📝 Creating test user:', { userId, email });
    
    // Use a transaction to ensure everything is created together
    const result = await prisma.$transaction(async (tx) => {
      // Step 1: Create auth user
      console.log('🔍 Step 1: Creating auth user...');
      await tx.$executeRaw`
        INSERT INTO auth.users (
          id, aud, role, email, encrypted_password, 
          is_super_admin, created_at, updated_at, 
          is_sso_user, is_anonymous
        ) VALUES (
          ${userId}::uuid,
          'authenticated',
          'authenticated', 
          ${email},
          'test-password-hash',
          false,
          NOW(),
          NOW(),
          false,
          false
        )
      `;
      console.log('✅ Auth user created');
      
      // Step 2: Create accountability user with raw SQL
      console.log('🔍 Step 2: Creating accountability user with raw SQL...');
      await tx.$executeRaw`
        INSERT INTO accountability."user" (
          id, email, first_name, last_name, role, subscription_status, timezone, created_at, updated_at
        ) VALUES (
          ${userId}::uuid,
          ${email},
          'Test',
          'User',
          'USER',
          'TRIAL',
          'America/New_York',
          NOW(),
          NOW()
        )
      `;
      console.log('✅ Accountability user created with raw SQL');
      
      // Step 3: Create user preferences with raw SQL
      console.log('🔍 Step 3: Creating user preferences with raw SQL...');
      await tx.$executeRaw`
        INSERT INTO accountability.user_preferences (
          user_id, theme_preferences, blocked_themes, message_length_preference, created_at, updated_at
        ) VALUES (
          ${userId}::uuid,
          ARRAY['faith']::text[],
          ARRAY[]::text[],
          'MEDIUM',
          NOW(),
          NOW()
        )
      `;
      console.log('✅ User preferences created with raw SQL');
      
      return { userId };
    });
    
    // Verify everything was created
    const verification = await prisma.$queryRaw`
      SELECT 
        u.id, u.email, u.first_name, u.last_name,
        up.theme_preferences, up.message_length_preference
      FROM accountability."user" u
      LEFT JOIN accountability.user_preferences up ON u.id = up.user_id
      WHERE u.id = ${result.userId}::uuid
    `;
    
    console.log('🎉 Verification result:', verification);
    
    return NextResponse.json({
      success: true,
      message: "Manual user creation with raw SQL successful!",
      userId: result.userId,
      verification: verification
    });
    
  } catch (error: any) {
    console.error('❌ Manual creation error:', error);
    return NextResponse.json({
      error: "Manual user creation failed",
      details: error?.message || 'Unknown error',
      code: error?.code || 'Unknown'
    }, { status: 500 });
  }
} 