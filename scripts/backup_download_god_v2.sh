#!/bin/bash
# permissions: chmod +x scripts/backup_download_agents.sh
# run: ./scripts/backup_download_agents.sh

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

# Create backup directory with timestamp
BACKUP_DIR="backups/agents_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# List of tables to backup
TABLES=(
    "account"
    "bible_books"
    "bible_notes"
    "agents_chat_message_reactions"
    "agents_chat_messages"
    "agents_group"
    "agents_group_file"
    "agents_group_member"
    "agents_group_note"
    "agents_group_whiteboard"
    "bible_versions"
    "bible_verses"
    "chat_conversations"
    "chat_messages"
    "connections"
    "daily_devotionals"
    "discussion"
    "embeddings_folder"
    "family_invitations"
    "family_members"
    "family_subscriptions"
    "files_in_storage"
    "invitations"
    "meetings"
    "message_templates"
    "newsletter_subscriptions"
    "note_shares"
    "payments_received"
    "prayer_requests"
    "prayers"
    "reading_history"
    "reply"
    "saved_verses"
    "sent_messages"
    "session"
    "stripe_webhook_events"
    "subscription_features"
    "subscription_limits"
    "subscription_plans"
    "subscriptions"
    "tz"
    "usage"
    "usage_monthly"
    "user"
    "user_preferences"
    "user_subscriptions"
    "verificationtoken"
    "verse_highlights"
    "verse_notes"
    "zoom_meeting"
    "zoom_meeting_app"
    "zoom_meeting_chat"
    "zoom_meeting_participant"
    "zoom_meeting_recording"
    "zoom_meeting_whiteboard"
)

# Export each table
for table in "${TABLES[@]}"; do
    echo "Backing up agents.\"$table\"..."
    PGPASSWORD=$(echo "$DATABASE_URL" | sed 's|.*://[^:]*:\([^@]*\)@.*|\1|') \
    psql -h "$(echo "$DATABASE_URL" | sed 's|.*@\([^:]*\):.*|\1|')" \
         -p "$(echo "$DATABASE_URL" | sed 's|.*:\([^/]*\)/.*|\1|')" \
         -U "$(echo "$DATABASE_URL" | sed 's|.*://\([^:]*\):.*|\1|')" \
         -d "$(echo "$DATABASE_URL" | sed 's|.*/\([^?]*\).*|\1|')" \
         -c "\COPY agents.\"$table\" TO '$BACKUP_DIR/$table.csv' WITH (FORMAT csv, HEADER true);"
done

echo "Backup completed in $BACKUP_DIR" 