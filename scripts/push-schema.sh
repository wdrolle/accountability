#!/bin/bash
# chmod +x scripts/push-schema.sh
# ./scripts/push-schema.sh

# Load environment variables
source .env

# Drop schema first
psql "${DIRECT_URL}?sslmode=require" -c "DROP SCHEMA IF EXISTS god CASCADE;"

# Create schema
psql "${DIRECT_URL}?sslmode=require" -c "CREATE SCHEMA IF NOT EXISTS god;"

# Push schema changes
npx prisma db push --accept-data-loss --force-reset

# Verify schema
npx prisma validate 