#!/bin/bash
# Drop all tables in agents schema
# chmod +x scripts/backup_drop_agents_tables.sh
# ./scripts/backup_drop_agents_tables.sh

# Load DEV_DATABASE_URL from .env file
if [ -f .env ]; then
    DATABASE_URL=$(grep "^DATABASE_URL=" .env | cut -d '=' -f2- | tr -d '"')
    # Remove pgbouncer parameter if present
    DATABASE_URL=$(echo "$DATABASE_URL" | sed 's/?pgbouncer=true//')
else
    echo "Error: .env file not found"
    exit 1
fi

# Check if we got DEV_DATABASE_URL
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

# Confirm before proceeding
read -p "Are you sure you want to drop all tables in agents schema? This cannot be undone. (y/N) " confirm
if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
    echo "Operation cancelled"
    exit 1
fi

# Drop each table
for table in "${TABLES[@]}"; do
    echo "Dropping table agents.\"$table\" ..."
    execute_psql -c "DROP TABLE IF EXISTS agents.\"$table\" CASCADE;"
done

echo "All listed tables dropped from schema agents." 