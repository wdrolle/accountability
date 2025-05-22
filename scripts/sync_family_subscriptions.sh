#!/bin/bash

# Load environment variables
source .env

# Remove pgbouncer from DATABASE_URL if present
DB_URL=$(echo $DATABASE_URL | sed 's/?pgbouncer=true//')

# Connect to database and run the sync function
psql "$DB_URL" << EOSQL
SELECT agents.copy_subscription_to_family_member(f.family_id, f.member_id)
FROM agents.family_members f
JOIN agents.user u ON f.family_id = u.id
WHERE u.subscription_status = 'ACTIVE';
EOSQL 