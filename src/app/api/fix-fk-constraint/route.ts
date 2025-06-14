import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST() {
  try {
    console.log('🔧 Starting foreign key constraint fix...');
    
    // Step 1: Check current constraint
    console.log('🔍 Checking current constraint...');
    const currentConstraint = await prisma.$queryRaw`
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
    
    console.log('Current constraint:', currentConstraint);
    
    // Step 2: Drop the incorrect foreign key constraint
    console.log('🗑️ Dropping incorrect constraint...');
    await prisma.$executeRaw`
      ALTER TABLE accountability.user_preferences 
      DROP CONSTRAINT IF EXISTS user_preferences_user_id_fkey
    `;
    console.log('✅ Constraint dropped');
    
    // Step 3: Create the correct foreign key constraint
    console.log('🔗 Creating correct constraint...');
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
    const newConstraint = await prisma.$queryRaw`
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
    
    console.log('New constraint:', newConstraint);
    console.log('🎉 Foreign key constraint fix completed!');
    
    return NextResponse.json({
      success: true,
      message: "Foreign key constraint fixed successfully!",
      before: currentConstraint,
      after: newConstraint
    });
    
  } catch (error: any) {
    console.error('❌ Error fixing foreign key constraint:', error);
    return NextResponse.json({
      error: "Failed to fix foreign key constraint",
      details: error?.message || 'Unknown error'
    }, { status: 500 });
  }
} 