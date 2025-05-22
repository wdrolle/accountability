#!/bin/bash
# permissions: chmod +x scripts/delete_user.sh
# usage: ./scripts/delete_user.sh

# Check if .env file exists and source it
if [ -f .env ]; then
    source .env
else
    echo "Error: .env file not found"
    echo "Please create a .env file with the following variables:"
    echo "DATABASE_URL_DELETE_USER=your_database_url"
    exit 1
fi

# Extract connection details from DATABASE_URL_DELETE_USER
if [ -z "$DATABASE_URL_DELETE_USER" ]; then
    echo "Error: DATABASE_URL_DELETE_USER not found in .env file"
    echo "Please add DATABASE_URL_DELETE_USER=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
    echo "Note: Use the direct database connection URL without pgbouncer"
    echo "Note: The database URL should be the same as the one used in the supabase.config.ts file"
    exit 1
fi

# Parse the DATABASE_URL to get individual components
# Expected format: postgresql://postgres.[project-ref]:[password]@db.[project-ref].supabase.co:5432/postgres
parse_url() {
    local url=$1
    # Remove postgresql:// prefix
    url=${url#postgresql://}
    # Extract user and password
    PGUSER=${url%%:*}
    url=${url#*:}
    PGPASSWORD=${url%%@*}
    url=${url#*@}
    # Extract host and port
    PGHOST=${url%%:*}
    url=${url#*:}
    PGPORT=${url%%/*}
    # Extract database name
    PGDATABASE=${url#*/}
    # Remove any query parameters
    PGDATABASE=${PGDATABASE%%\?*}
}

# Parse the URL
parse_url "$DATABASE_URL_DELETE_USER"

# Function to validate email format
validate_email() {
    if [[ "$1" =~ ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]]; then
        return 0
    else
        return 1
    fi
}

# Prompt for email with validation
while true; do
    echo -n "Enter the email of the user to delete: "
    read email

    if validate_email "$email"; then
        break
    else
        echo "Invalid email format. Please try again."
    fi
done

# Confirm deletion
echo -n "Are you sure you want to delete user with email '$email'? (y/N): "
read confirmation

if [ "${confirmation,,}" != "y" ]; then
    echo "Operation cancelled."
    exit 0
fi

# SQL to delete user with cascading deletes
SQL_SCRIPT=$(cat << EOF
BEGIN;

DO \$\$
DECLARE
    v_user_id UUID;
    v_auth_user_id UUID;
BEGIN
    -- First check auth.users table
    SELECT au.id
    INTO v_auth_user_id
    FROM auth.users au
    WHERE au.email = '${email}';

    -- If no auth user found, raise exception
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User with email % does not exist in auth.users', '${email}';
    END IF;

    -- Get user ID from agents.user
    SELECT u.id
    INTO v_user_id
    FROM agents.user u
    WHERE u.id = v_auth_user_id;

    -- If user exists in agents.user, delete all related records
    IF FOUND THEN
        -- Disable triggers temporarily
        SET session_replication_role = 'replica';

        -- Delete from agents schema with cascading
        DELETE FROM agents.user WHERE id = v_user_id;

        -- Delete from auth schema
        DELETE FROM auth.identities WHERE user_id = v_auth_user_id;
        DELETE FROM auth.mfa_factors WHERE user_id = v_auth_user_id;
        DELETE FROM auth.sessions WHERE user_id = v_auth_user_id;
        DELETE FROM auth.one_time_tokens WHERE user_id = v_auth_user_id;
        DELETE FROM auth.users WHERE id = v_auth_user_id;

        -- Re-enable triggers
        SET session_replication_role = 'origin';

        RAISE NOTICE 'Successfully deleted user with email: %', '${email}';
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        -- Re-enable triggers if error occurs
        SET session_replication_role = 'origin';
        RAISE NOTICE 'Error deleting user %: %', '${email}', SQLERRM;
        RAISE;
END;
\$\$;

COMMIT;
EOF
)

# Export PostgreSQL environment variables
export PGHOST
export PGPORT
export PGDATABASE
export PGUSER
export PGPASSWORD
export PGSSLMODE=require

# Execute the SQL script using environment variables
echo "Deleting user..."
output=$(psql -v "ON_ERROR_STOP=1" -c "$SQL_SCRIPT" 2>&1)
exit_code=$?

echo "$output"

if [ $exit_code -eq 0 ]; then
    if [[ $output == *"Successfully deleted"* ]]; then
        echo "User successfully deleted."
        exit 0
    else
        echo "User deletion completed but success message not found."
        exit 1
    fi
else
    echo "An error occurred during user deletion."
    exit 1
fi 