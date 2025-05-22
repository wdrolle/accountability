#!/bin/bash

# Check if .env file exists and source it
if [ -f .env ]; then
    source .env
else
    echo "Error: .env file not found"
    echo "Please create a .env file with DEV_DATABASE_URL"
    exit 1
fi

# The Current User ID you want to change
v_old_id = "cdd0ed58-cd0e-aabf-d201-ca1808e9c7eb"
# The New User ID you want to change to
v_new_id = "3509c6b9-c8d9-b406-b61d-4fed23d2fcbe"

# SQL to update user IDs
SQL_SCRIPT=$(cat << EOF
BEGIN;

DO \$\$
DECLARE
    v_old_id UUID := '$v_old_id';
    v_new_id UUID := '$v_new_id';
    affected_rows INTEGER;
    record_exists BOOLEAN;
BEGIN
    -- First verify old ID exists and new ID doesn't
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_old_id) THEN
        RAISE EXCEPTION 'Old user ID % does not exist in auth.users', v_old_id;
    END IF;

    IF EXISTS (SELECT 1 FROM auth.users WHERE id = v_new_id) THEN
        RAISE EXCEPTION 'New user ID % already exists in auth.users', v_new_id;
    END IF;

    -- STEP 1: Disable foreign key checks and triggers
    SET session_replication_role = 'replica';

    -- STEP 2: Update auth.users first (this is the main reference table)
    UPDATE auth.users
    SET id = v_new_id
    WHERE id = v_old_id
    RETURNING 1 INTO affected_rows;
    RAISE NOTICE 'Updated auth.users: % rows', affected_rows;

    -- STEP 3: Update agents.user next
    UPDATE agents.user
    SET id = v_new_id
    WHERE id = v_old_id
    RETURNING 1 INTO affected_rows;
    RAISE NOTICE 'Updated agents.user: % rows', affected_rows;

    -- STEP 4: Update usage table while triggers are still disabled
    IF EXISTS (SELECT 1 FROM agents.usage WHERE user_id = v_old_id) THEN
        UPDATE agents.usage
        SET user_id = v_new_id
        WHERE user_id = v_old_id;
        GET DIAGNOSTICS affected_rows = ROW_COUNT;
        RAISE NOTICE 'Updated % rows in usage', affected_rows;
    END IF;

    -- Re-enable foreign key checks after main tables are updated
    SET session_replication_role = 'origin';

    -- STEP 5: Update all dependent tables (only if records exist)
    -- Update discussions
    IF EXISTS (SELECT 1 FROM agents.discussion WHERE authorid = v_old_id) THEN
        UPDATE agents.discussion
        SET authorid = v_new_id
        WHERE authorid = v_old_id;
        GET DIAGNOSTICS affected_rows = ROW_COUNT;
        RAISE NOTICE 'Updated % rows in discussion', affected_rows;
    END IF;

    -- Update replies
    IF EXISTS (SELECT 1 FROM agents.reply WHERE authorid = v_old_id) THEN
        UPDATE agents.reply
        SET authorid = v_new_id
        WHERE authorid = v_old_id;
        GET DIAGNOSTICS affected_rows = ROW_COUNT;
        RAISE NOTICE 'Updated % rows in reply', affected_rows;
    END IF;

    -- Update family members
    IF EXISTS (SELECT 1 FROM agents.family_members WHERE family_id = v_old_id OR member_id = v_old_id) THEN
        UPDATE agents.family_members
        SET family_id = v_new_id
        WHERE family_id = v_old_id;
        UPDATE agents.family_members
        SET member_id = v_new_id
        WHERE member_id = v_old_id;
        GET DIAGNOSTICS affected_rows = ROW_COUNT;
        RAISE NOTICE 'Updated % rows in family_members', affected_rows;
    END IF;

    -- Update family subscriptions
    IF EXISTS (SELECT 1 FROM agents.family_subscriptions WHERE owner_id = v_old_id OR member_id = v_old_id) THEN
        UPDATE agents.family_subscriptions
        SET owner_id = v_new_id
        WHERE owner_id = v_old_id;
        UPDATE agents.family_subscriptions
        SET member_id = v_new_id
        WHERE member_id = v_old_id;
        GET DIAGNOSTICS affected_rows = ROW_COUNT;
        RAISE NOTICE 'Updated % rows in family_subscriptions', affected_rows;
    END IF;

    -- Update user subscriptions
    IF EXISTS (SELECT 1 FROM agents.user_subscriptions WHERE user_id = v_old_id) THEN
        UPDATE agents.user_subscriptions
        SET user_id = v_new_id
        WHERE user_id = v_old_id;
        GET DIAGNOSTICS affected_rows = ROW_COUNT;
        RAISE NOTICE 'Updated % rows in user_subscriptions', affected_rows;
    END IF;

    -- Update subscriptions
    IF EXISTS (SELECT 1 FROM agents.subscriptions WHERE user_id = v_old_id OR v_old_id::text = ANY(family_plan)) THEN
        UPDATE agents.subscriptions
        SET user_id = v_new_id
        WHERE user_id = v_old_id;
        UPDATE agents.subscriptions
        SET family_plan = array_replace(family_plan, v_old_id::text, v_new_id::text)
        WHERE v_old_id::text = ANY(family_plan);
        GET DIAGNOSTICS affected_rows = ROW_COUNT;
        RAISE NOTICE 'Updated % rows in subscriptions', affected_rows;
    END IF;

    -- Update user preferences
    IF EXISTS (SELECT 1 FROM agents.user_preferences WHERE user_id = v_old_id) THEN
        UPDATE agents.user_preferences
        SET user_id = v_new_id
        WHERE user_id = v_old_id;
        GET DIAGNOSTICS affected_rows = ROW_COUNT;
        RAISE NOTICE 'Updated % rows in user_preferences', affected_rows;
    END IF;

    -- Update chat conversations
    IF EXISTS (SELECT 1 FROM agents.chat_conversations WHERE user_id = v_old_id) THEN
        UPDATE agents.chat_conversations
        SET user_id = v_new_id
        WHERE user_id = v_old_id;
        GET DIAGNOSTICS affected_rows = ROW_COUNT;
        RAISE NOTICE 'Updated % rows in chat_conversations', affected_rows;
    END IF;

    -- Update sent messages
    IF EXISTS (SELECT 1 FROM agents.sent_messages WHERE user_id = v_old_id) THEN
        UPDATE agents.sent_messages
        SET user_id = v_new_id
        WHERE user_id = v_old_id;
        GET DIAGNOSTICS affected_rows = ROW_COUNT;
        RAISE NOTICE 'Updated % rows in sent_messages', affected_rows;
    END IF;

    -- Update invitations
    IF EXISTS (SELECT 1 FROM agents.invitations WHERE sent_by_id = v_old_id) THEN
        UPDATE agents.invitations
        SET sent_by_id = v_new_id
        WHERE sent_by_id = v_old_id;
        GET DIAGNOSTICS affected_rows = ROW_COUNT;
        RAISE NOTICE 'Updated % rows in invitations', affected_rows;
    END IF;

    -- Update session
    IF EXISTS (SELECT 1 FROM agents.session WHERE user_id = v_old_id) THEN
        UPDATE agents.session
        SET user_id = v_new_id
        WHERE user_id = v_old_id;
        GET DIAGNOSTICS affected_rows = ROW_COUNT;
        RAISE NOTICE 'Updated % rows in session', affected_rows;
    END IF;

    -- Update account
    IF EXISTS (SELECT 1 FROM agents.account WHERE user_id = v_old_id) THEN
        UPDATE agents.account
        SET user_id = v_new_id
        WHERE user_id = v_old_id;
        GET DIAGNOSTICS affected_rows = ROW_COUNT;
        RAISE NOTICE 'Updated % rows in account', affected_rows;
    END IF;

    -- Update auth-related records
    IF EXISTS (SELECT 1 FROM auth.identities WHERE user_id = v_old_id) THEN
        UPDATE auth.identities
        SET user_id = v_new_id
        WHERE user_id = v_old_id;
        GET DIAGNOSTICS affected_rows = ROW_COUNT;
        RAISE NOTICE 'Updated % rows in auth.identities', affected_rows;
    END IF;

    IF EXISTS (SELECT 1 FROM auth.mfa_factors WHERE user_id = v_old_id) THEN
        UPDATE auth.mfa_factors
        SET user_id = v_new_id
        WHERE user_id = v_old_id;
        GET DIAGNOSTICS affected_rows = ROW_COUNT;
        RAISE NOTICE 'Updated % rows in auth.mfa_factors', affected_rows;
    END IF;

    IF EXISTS (SELECT 1 FROM auth.sessions WHERE user_id = v_old_id) THEN
        UPDATE auth.sessions
        SET user_id = v_new_id
        WHERE user_id = v_old_id;
        GET DIAGNOSTICS affected_rows = ROW_COUNT;
        RAISE NOTICE 'Updated % rows in auth.sessions', affected_rows;
    END IF;

    IF EXISTS (SELECT 1 FROM auth.one_time_tokens WHERE user_id = v_old_id) THEN
        UPDATE auth.one_time_tokens
        SET user_id = v_new_id
        WHERE user_id = v_old_id;
        GET DIAGNOSTICS affected_rows = ROW_COUNT;
        RAISE NOTICE 'Updated % rows in auth.one_time_tokens', affected_rows;
    END IF;

    RAISE NOTICE 'Successfully updated user ID from % to %', v_old_id, v_new_id;
EXCEPTION
    WHEN OTHERS THEN
        -- Make sure to re-enable foreign key checks
        SET session_replication_role = 'origin';
        
        RAISE NOTICE 'Error updating user ID: %', SQLERRM;
        RAISE;
END;
\$\$;

COMMIT;
EOF
)

# Execute the SQL script using the development database URL
echo "Updating user ID in development database..."
output=$(psql "$DEV_DATABASE_URL" -c "$SQL_SCRIPT" 2>&1)
exit_code=$?

echo "$output"

if [ $exit_code -eq 0 ]; then
    if [[ $output == *"Successfully updated"* ]]; then
        echo "User ID successfully updated."
        exit 0
    else
        echo "User ID update completed but success message not found."
        exit 1
    fi
else
    echo "An error occurred during user ID update."
    exit 1
fi 