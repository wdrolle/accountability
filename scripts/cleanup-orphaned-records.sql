-- Cleanup script for orphaned records that might cause foreign key constraint violations
-- Run this script to fix database consistency issues

BEGIN;

-- Check for orphaned user_preferences records
SELECT 'Orphaned user_preferences records:' as check_type, 
       up.user_id, up.id 
FROM accountability.user_preferences up 
LEFT JOIN accountability.user u ON up.user_id = u.id 
WHERE u.id IS NULL;

-- Check for orphaned subscriptions records
SELECT 'Orphaned subscriptions records:' as check_type,
       s.user_id, s.id 
FROM accountability.subscriptions s 
LEFT JOIN accountability.user u ON s.user_id = u.id 
WHERE u.id IS NULL;

-- Check for orphaned usage records
SELECT 'Orphaned usage records:' as check_type,
       us.user_id, COUNT(*) as count
FROM accountability.usage us 
LEFT JOIN accountability.user u ON us.user_id = u.id 
WHERE u.id IS NULL
GROUP BY us.user_id;

-- Check for orphaned usage_monthly records
SELECT 'Orphaned usage_monthly records:' as check_type,
       um.user_id, COUNT(*) as count
FROM accountability.usage_monthly um 
LEFT JOIN accountability.user u ON um.user_id = u.id 
WHERE u.id IS NULL
GROUP BY um.user_id;

-- Clean up orphaned records (uncomment the following lines to execute cleanup)

-- Delete orphaned user_preferences records
-- DELETE FROM accountability.user_preferences 
-- WHERE user_id NOT IN (SELECT id FROM accountability.user);

-- Delete orphaned subscriptions records
-- DELETE FROM accountability.subscriptions 
-- WHERE user_id NOT IN (SELECT id FROM accountability.user);

-- Delete orphaned usage records
-- DELETE FROM accountability.usage 
-- WHERE user_id NOT IN (SELECT id FROM accountability.user);

-- Delete orphaned usage_monthly records
-- DELETE FROM accountability.usage_monthly 
-- WHERE user_id NOT IN (SELECT id FROM accountability.user);

-- Show counts after cleanup would be applied
SELECT 'After cleanup - user_preferences count:' as info, COUNT(*) as count 
FROM accountability.user_preferences up 
INNER JOIN accountability.user u ON up.user_id = u.id;

SELECT 'After cleanup - subscriptions count:' as info, COUNT(*) as count 
FROM accountability.subscriptions s 
INNER JOIN accountability.user u ON s.user_id = u.id;

-- Check foreign key constraint status
SELECT conname, contype, confrelid::regclass as referenced_table, 
       conrelid::regclass as referencing_table
FROM pg_constraint 
WHERE conname LIKE '%user_preferences_user_id%' 
   OR conname LIKE '%subscriptions_user%' 
   OR conname LIKE '%usage_user%';

ROLLBACK; -- Remove this line when you want to actually execute the cleanup 