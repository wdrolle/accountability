#!/bin/bash
# chmod +x scripts/reset-auth-schema.sh
# ./scripts/reset-auth-schema.sh

# Load environment variables
source .env

# Drop auth schema
psql "${DIRECT_URL}?sslmode=require" -c "DROP SCHEMA IF EXISTS auth CASCADE;"

# Apply new schema
psql "${DIRECT_URL}?sslmode=require" -f prisma/migrations/auth_schema.sql