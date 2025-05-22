#!/bin/bash
# Import timezones from CSV to Supabase
# chmod +x scripts/import_timezones.sh
# command to run: ./scripts/import_timezones.sh

# Source the environment variables from .env file
set -a
source /teamspace/studios/this_studio/god-messages/.env
set +a

# Check if DATABASE_URL is set
if [ -z "$DIRECT_URL" ]; then
    echo "Error: DIRECT_URL environment variable is not set"
    exit 1
fi

# Create the table first
echo "Creating table structure..."
psql "$DIRECT_URL" -f scripts/create_tz_table.sql

# Import the CSV data
echo "Importing timezone data..."
psql "$DIRECT_URL" -c "\COPY agents.tz(timezone, utc_offset, name) FROM 'scripts/timezone_list.csv' WITH (FORMAT csv, HEADER true);"

echo "Timezone data imported successfully!" 