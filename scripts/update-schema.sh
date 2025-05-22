#!/bin/bash
# chmod +x scripts/update-schema.sh
# ./scripts/update-schema.sh

# Load environment variables
source .env

# Pull current schema
npx prisma db pull

# Format schema
npx prisma format

# Generate client
npx prisma generate

# Create baseline for god schema only if needed
if [ ! -f "prisma/migrations/migration_lock.toml" ]; then
  npx prisma migrate diff \
    --from-empty \
    --to-schema-datamodel prisma/schema.prisma \
    --script > prisma/migrations/$(date +%Y%m%d%H%M%S)_baseline.sql
fi 