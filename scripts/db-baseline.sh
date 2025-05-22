#!/bin/bash
# chmod +x scripts/db-baseline.sh
# ./scripts/db-baseline.sh

# Load environment variables
source .env

# Create migrations directory
mkdir -p prisma/migrations

# Generate timestamp
TIMESTAMP=$(date +%Y%m%d%H%M%S)

# Create baseline migration
npx prisma migrate diff \
  --from-empty \
  --to-schema-datamodel prisma/schema.prisma \
  --script > prisma/migrations/${TIMESTAMP}_baseline.sql

# Mark migration as applied
npx prisma migrate resolve --applied "${TIMESTAMP}_baseline"

# Generate Prisma client
npx prisma generate 