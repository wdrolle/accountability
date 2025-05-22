#!/bin/bash
# chmod +x scripts/backup_restore_agents.sh
# ./scripts/backup_restore_agents.sh

# Load DATABASE_URL from .env file
if [ -f .env ]; then
    DATABASE_URL=$(grep "^DATABASE_URL=" .env | cut -d '=' -f2- | tr -d '"')
    # Remove pgbouncer parameter if present
    DATABASE_URL=$(echo "$DATABASE_URL" | sed 's/?pgbouncer=true//')
else
    echo "Error: .env file not found"
    exit 1
fi

# Check if we got DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo "Error: DATABASE_URL not found in .env file"
    exit 1
fi

# Function to execute psql commands
function execute_psql() {
    PGPASSWORD=$(echo "$DATABASE_URL" | sed 's|.*://[^:]*:\([^@]*\)@.*|\1|') \
    psql -h "$(echo "$DATABASE_URL" | sed 's|.*@\([^:]*\):.*|\1|')" \
         -p "$(echo "$DATABASE_URL" | sed 's|.*:\([^/]*\)/.*|\1|')" \
         -U "$(echo "$DATABASE_URL" | sed 's|.*://\([^:]*\):.*|\1|')" \
         -d "$(echo "$DATABASE_URL" | sed 's|.*/\([^?]*\).*|\1|')" \
         -v ON_ERROR_STOP=1 \
         "$@"
}

echo "Starting database initialization..."

# Step 1: Initialize base schema
echo "Step 1: Initializing base schema..."
if ! execute_psql -f ./scripts/sql/create_agents_schema_initialize.sql; then
    echo "Error: Failed to initialize base schema"
    exit 1
fi

# Step 2: Create remaining tables in order
echo "Step 2: Creating remaining tables..."
for i in $(seq 1 8); do
    echo "Running create_agents_schema_pt_$i.sql..."
    if ! execute_psql -f "./scripts/sql/create_agents_schema_pt_$i.sql"; then
        echo "Error: Failed to execute part $i"
        exit 1
    fi
done

# Run part 100 last
echo "Running create_agents_schema_pt_100.sql..."
if ! execute_psql -f "./scripts/sql/create_agents_schema_pt_100.sql"; then
    echo "Error: Failed to execute part 100"
    exit 1
fi

# Step 3: Restore data from backup
echo "Step 3: Restoring data from backup..."

# Select backup folder
if [ ! -d "backups" ]; then
    echo "Error: backups directory does not exist"
    exit 1
fi

# Get list of backup folders
backup_folders=()
while IFS= read -r -d '' dir; do
    backup_folders+=("$dir")
done < <(find backups -maxdepth 1 -type d -name "agents_*" -print0 | sort -z)

if [ ${#backup_folders[@]} -eq 0 ]; then
    echo "Error: No backup folders found"
    exit 1
fi

# Print menu of available backup folders
echo "Available backup folders:"
for i in "${!backup_folders[@]}"; do
    echo "[$((i+1))] ${backup_folders[$i]}"
done

# Get user selection
while true; do
    read -p "Enter the number of the backup folder to use: " selection
    if [[ "$selection" =~ ^[0-9]+$ ]] && [ "$selection" -ge 1 ] && [ "$selection" -le "${#backup_folders[@]}" ]; then
        BACKUP_DIR="${backup_folders[$((selection-1))]}"
        break
    fi
    echo "Invalid selection. Please enter a number between 1 and ${#backup_folders[@]}"
done

echo "Selected backup directory: $BACKUP_DIR"

# Disable triggers and foreign key checks
echo "Disabling triggers and foreign key checks..."
execute_psql <<EOF
SET session_replication_role = replica;
SET client_min_messages TO WARNING;
EOF

# Process user table first
if [ -f "$BACKUP_DIR/user.csv" ]; then
    echo "Restoring agents.\"user\"..."
    if ! execute_psql -c "\COPY agents.\"user\" FROM '$BACKUP_DIR/user.csv' CSV HEADER"; then
        echo "Error: Failed to restore user table"
        exit 1
    fi
fi

# Restore remaining tables in order
for table in account bible_books bible_versions bible_verses agents_group agents_group_member agents_group_note agents_group_whiteboard chat_conversations chat_messages connections daily_devotionals discussion embeddings_folder family_invitations family_members family_subscriptions files_in_storage invitations meetings message_templates newsletter_subscriptions note_shares prayer_requests prayers reading_history reply saved_verses sent_messages session subscription_features subscription_limits subscription_plans subscriptions tz usage usage_monthly user_preferences user_subscriptions verificationtoken verse_highlights verse_notes zoom_meeting zoom_meeting_participant zoom_meeting_chat; do
    if [ -f "$BACKUP_DIR/$table.csv" ]; then
        echo "Restoring agents.\"$table\"..."
        if ! execute_psql -c "\COPY agents.\"$table\" FROM '$BACKUP_DIR/$table.csv' CSV HEADER"; then
            echo "Error: Failed to restore $table"
            exit 1
        fi
    fi
done

# Re-enable triggers and foreign key checks
echo "Re-enabling triggers and foreign key checks..."
execute_psql <<EOF
SET session_replication_role = default;
EOF

echo "Database initialization and data restoration completed successfully" 