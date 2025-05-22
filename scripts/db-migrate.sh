#!/bin/bash
# This script is used to run the database migrations
# chmod +x scripts/db-migrate.sh
# ./scripts/db-migrate.sh

# Get the database URL from .env
DB_URL=$(grep DIRECT_URL .env | cut -d '=' -f2- | tr -d '"')

# Run the migration
psql "${DB_URL}" -f prisma/migrations/fix_preferred_time.sql 