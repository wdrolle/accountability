-- ================================================================
-- COMPREHENSIVE REGISTRATION FIX
-- This script addresses all issues preventing new user registration
-- ================================================================

BEGIN;

-- ================================================================
-- STEP 1: Fix Foreign Key Constraints
-- ================================================================

-- Check current foreign key constraints on user_preferences
SELECT 'Current foreign key constraints:' as step;
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
  AND tc.table_schema = 'accountability';

-- Drop ALL foreign key constraints on user_preferences table
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    FOR constraint_record IN 
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'user_preferences' 
          AND table_schema = 'accountability'
          AND constraint_type = 'FOREIGN KEY'
    LOOP
        EXECUTE format('ALTER TABLE accountability.user_preferences DROP CONSTRAINT IF EXISTS %I', 
                      constraint_record.constraint_name);
        RAISE NOTICE 'Dropped constraint: %', constraint_record.constraint_name;
    END LOOP;
END $$;

-- Create the correct foreign key constraint
ALTER TABLE accountability.user_preferences 
ADD CONSTRAINT user_preferences_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES accountability."user"(id) 
  ON DELETE CASCADE
  DEFERRABLE INITIALLY DEFERRED;

SELECT 'Foreign key constraint recreated successfully' as step;

-- ================================================================
-- STEP 2: Fix Row-Level Security Policies
-- ================================================================

-- Add INSERT policies for service operations
SELECT 'Adding INSERT policies for service operations...' as step;

-- Policy for accountability.user table
DROP POLICY IF EXISTS user_insert_service ON accountability."user";
CREATE POLICY user_insert_service ON accountability."user"
    FOR INSERT
    TO service_role, postgres, authenticated, anon
    WITH CHECK (true);

-- Policy for user_preferences table  
DROP POLICY IF EXISTS user_preferences_insert_service ON accountability.user_preferences;
CREATE POLICY user_preferences_insert_service ON accountability.user_preferences
    FOR INSERT
    TO service_role, postgres, authenticated, anon
    WITH CHECK (true);

-- Policy for subscriptions table
DROP POLICY IF EXISTS subscriptions_insert_service ON accountability.subscriptions;
CREATE POLICY subscriptions_insert_service ON accountability.subscriptions
    FOR INSERT
    TO service_role, postgres, authenticated, anon
    WITH CHECK (true);

SELECT 'RLS policies updated successfully' as step;

-- ================================================================
-- STEP 3: Grant Necessary Permissions
-- ================================================================

SELECT 'Granting permissions...' as step;

-- Grant schema usage
GRANT USAGE ON SCHEMA accountability TO service_role, postgres, authenticated, anon;

-- Grant table permissions
GRANT INSERT, SELECT, UPDATE, DELETE ON accountability."user" TO service_role, postgres, authenticated;
GRANT INSERT, SELECT, UPDATE, DELETE ON accountability.user_preferences TO service_role, postgres, authenticated;
GRANT INSERT, SELECT, UPDATE, DELETE ON accountability.subscriptions TO service_role, postgres, authenticated;

SELECT 'Permissions granted successfully' as step;

-- ================================================================
-- STEP 4: Test the Fix
-- ================================================================

SELECT 'Testing the fix...' as step;

-- Create a test user to verify everything works
DO $$
DECLARE
    test_user_id UUID;
    test_email TEXT;
BEGIN
    test_user_id := gen_random_uuid();
    test_email := 'test-fix-' || extract(epoch from now()) || '@example.com';
    
    -- Test creating accountability user
    INSERT INTO accountability."user" (
        id, email, first_name, last_name, role, subscription_status, timezone
    ) VALUES (
        test_user_id,
        test_email,
        'Test',
        'User',
        'USER',
        'TRIAL',
        'America/New_York'
    );
    
    -- Test creating user preferences
    INSERT INTO accountability.user_preferences (
        user_id, theme_preferences, blocked_themes, message_length_preference
    ) VALUES (
        test_user_id,
        ARRAY['faith']::text[],
        ARRAY[]::text[],
        'MEDIUM'
    );
    
    -- Clean up test data
    DELETE FROM accountability.user_preferences WHERE user_id = test_user_id;
    DELETE FROM accountability."user" WHERE id = test_user_id;
    
    RAISE NOTICE 'Test completed successfully - user creation works!';
END $$;

-- ================================================================
-- STEP 5: Verify Final State
-- ================================================================

SELECT 'Final verification...' as step;

-- Check final constraint state
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
  AND tc.table_schema = 'accountability';

SELECT 'COMPREHENSIVE FIX COMPLETED SUCCESSFULLY!' as result;

COMMIT; 