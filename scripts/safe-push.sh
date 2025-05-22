#!/bin/bash
# chmod +x scripts/safe-push.sh
# ./scripts/safe-push.sh

# Load environment variables
source .env

# Push schema changes
npx prisma db push --accept-data-loss

# Verify schema
npx prisma validate