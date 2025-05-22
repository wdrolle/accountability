#!/bin/bash
# chmod +x scripts/fix-migrations.sh
# ./scripts/fix-migrations.sh

# Load environment variables
source .env

# Create necessary directories
mkdir -p prisma/migrations/20241221012728_baseline

# Move the baseline SQL to the correct location
mv prisma/migrations/20241221012728_baseline.sql prisma/migrations/20241221012728_baseline/migration.sql

# Create migration lock file
cat > prisma/migrations/migration_lock.toml << EOL
# This is a necessary file for Prisma Migrate
provider = "postgresql"
EOL

# Mark migration as applied
npx prisma migrate resolve --applied 20241221012728_baseline

# Generate Prisma client
npx prisma generate 