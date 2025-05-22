#!/bin/bash
# chmod +x scripts/restore-auth-schema.sh
# ./scripts/restore-auth-schema.sh

# Load environment variables
source .env

# Extract connection details
DB_HOST=$(echo $DIRECT_URL | sed -n 's/.*@\(.*\):.*/\1/p')
DB_PORT=$(echo $DIRECT_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DIRECT_URL | sed -n 's/.*\/\(.*\)?sslmode.*/\1/p')
DB_USER=$(echo $DIRECT_URL | sed -n 's/.*:\/\/\(.*\):.*/\1/p')
DB_PASSWORD=$(echo $DIRECT_URL | sed -n 's/.*:\/\/.*:\(.*\)@.*/\1/p')

# Apply the schema
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f prisma/migrations/auth_schema.sql 