#!/bin/bash
# chmod +x scripts/restore-auth.sh
# ./scripts/restore-auth.sh

# Load environment variables
source .env

# Drop existing schema
psql "${DIRECT_URL}?sslmode=require" -c "DROP SCHEMA IF EXISTS auth CASCADE;"

# Apply our local auth schema
psql "${DIRECT_URL}?sslmode=require" -f prisma/migrations/auth_schema.sql