-- =====================================================
-- Section 1: Schema Setup & Types
-- =====================================================

-- Create custom types
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'meeting_status' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'agents')) THEN
    CREATE TYPE "agents"."meeting_status" AS ENUM (
      'SCHEDULED',
      'LIVE',
      'ENDED',
      'FAILED',
      'CANCELLED'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'participant_role' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'agents')) THEN
    CREATE TYPE "agents"."participant_role" AS ENUM (
      'HOST',
      'CO_HOST',
      'PRESENTER',
      'ATTENDEE'
    );
  END IF;
END $$;

-- =====================================================
-- Section 2: Table Drops & Cleanup
-- =====================================================

-- Drop all related tables in the correct order
DROP TABLE IF EXISTS "agents"."zoom_meeting_app" CASCADE;
DROP TABLE IF EXISTS "agents"."zoom_meeting_recording" CASCADE;
DROP TABLE IF EXISTS "agents"."zoom_meeting_whiteboard" CASCADE;
DROP TABLE IF EXISTS "agents"."zoom_meeting_chat" CASCADE;
DROP TABLE IF EXISTS "agents"."zoom_meeting_participant" CASCADE;
DROP TABLE IF EXISTS "agents"."zoom_meeting" CASCADE;
DROP TABLE IF EXISTS "agents"."agents_group" CASCADE;

-- Create agents_group table first
CREATE TABLE IF NOT EXISTS agents.agents_group (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                    TEXT NOT NULL UNIQUE,
    description             TEXT,
    leader_id               UUID NOT NULL,
    created_at              TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'America/New_York'),
    last_active_at          TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'America/New_York'),
    meeting_schedule        TEXT, -- e.g., "Weekly on Wednesdays at 7 PM"
    location                TEXT, -- Physical address or virtual meeting link
    current_topic           TEXT,
    past_topics             TEXT[] DEFAULT ARRAY[]::TEXT[],
    image_url               TEXT,
    resource_links          TEXT[] DEFAULT ARRAY[]::TEXT[],
    visibility              VARCHAR(20) DEFAULT 'PUBLIC', -- Options: PUBLIC, PRIVATE, INVITE_ONLY
    language                VARCHAR(50) DEFAULT 'English',
    accessibility_features  TEXT[] DEFAULT ARRAY[]::TEXT[],
    tags                    TEXT[] DEFAULT ARRAY[]::TEXT[],
    rules                   TEXT,
    favorite_count          INT DEFAULT 0,
    created_by             UUID NOT NULL,
    zoom_meeting_id        TEXT,
    zoom_session_id        TEXT,
    zoom_meeting_name      TEXT,
    zoom_start_time        TIMESTAMPTZ,
    zoom_duration          INTEGER,
    zoom_recurrence        JSONB,
    updated_at             TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'utc+4'),
    FOREIGN KEY (created_by) REFERENCES agents.user(id) ON DELETE CASCADE,
    FOREIGN KEY (leader_id) REFERENCES agents.user(id) ON DELETE CASCADE
);

-- Drop existing functions
DO $$
BEGIN
  DROP FUNCTION IF EXISTS "agents".create_zoom_meeting(UUID, VARCHAR, TIMESTAMPTZ, INTEGER, JSONB);
  DROP FUNCTION IF EXISTS "agents".join_zoom_meeting(UUID);
  DROP FUNCTION IF EXISTS "agents".leave_zoom_meeting(UUID);
  DROP FUNCTION IF EXISTS "agents".end_zoom_meeting(UUID);
  DROP FUNCTION IF EXISTS "agents".start_zoom_meeting(UUID);
  DROP FUNCTION IF EXISTS "agents".cancel_zoom_meeting(UUID);
END $$;

-- Drop the columns from agents_group table
ALTER TABLE agents.agents_group
DROP COLUMN IF EXISTS zoom_meeting_id,
DROP COLUMN IF EXISTS zoom_session_id,
DROP COLUMN IF EXISTS zoom_meeting_name,
DROP COLUMN IF EXISTS zoom_start_time,
DROP COLUMN IF EXISTS zoom_duration,
DROP COLUMN IF EXISTS zoom_recurrence;

-- Drop existing indexes
DROP INDEX IF EXISTS "agents"."idx_zoom_meeting_agents_group";
DROP INDEX IF EXISTS "agents"."idx_zoom_meeting_host";
DROP INDEX IF EXISTS "agents"."idx_zoom_meeting_status";
DROP INDEX IF EXISTS "agents"."idx_zoom_participant_meeting";
DROP INDEX IF EXISTS "agents"."idx_zoom_participant_user";
DROP INDEX IF EXISTS "agents"."idx_zoom_chat_meeting";
DROP INDEX IF EXISTS "agents"."idx_zoom_whiteboard_meeting";

-- =====================================================
-- Section 3: Core Tables
-- =====================================================

-- Add Zoom meeting fields to agents_group table
ALTER TABLE agents.agents_group
ADD COLUMN zoom_meeting_id TEXT,
ADD COLUMN zoom_session_id TEXT,
ADD COLUMN zoom_meeting_name TEXT,
ADD COLUMN zoom_start_time TIMESTAMPTZ,
ADD COLUMN zoom_duration INTEGER,
ADD COLUMN zoom_recurrence JSONB;

-- Create base zoom meeting table
CREATE TABLE IF NOT EXISTS "agents"."zoom_meeting" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "agents_group_id" UUID NOT NULL,
  "meeting_id" VARCHAR(255) NOT NULL UNIQUE,
  "topic" VARCHAR(255),
  "join_url" TEXT NOT NULL,
  "start_url" TEXT NOT NULL,
  "password" VARCHAR(50) NOT NULL,
  "start_time" TIMESTAMPTZ,
  "duration" INTEGER,
  "status" VARCHAR(20) DEFAULT 'not_started',
  "started_at" TIMESTAMP WITH TIME ZONE,
  "host_id" UUID NOT NULL,
  "settings" JSONB DEFAULT '{}',
  "recording_urls" TEXT[],
  "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY ("agents_group_id") REFERENCES "agents"."agents_group"("id") ON DELETE CASCADE,
  FOREIGN KEY ("host_id") REFERENCES "agents"."user"("id") ON DELETE CASCADE,
  
  CONSTRAINT zoom_meeting_status_check 
  CHECK (status IN ('not_started', 'started', 'ended', 'cancelled'))
);

-- Create participant table
CREATE TABLE IF NOT EXISTS "agents"."zoom_meeting_participant" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "meeting_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "role" "agents"."participant_role" DEFAULT 'ATTENDEE',
  "join_time" TIMESTAMPTZ,
  "leave_time" TIMESTAMPTZ,
  "duration" INTEGER,
  "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY ("meeting_id") REFERENCES "agents"."zoom_meeting"("id") ON DELETE CASCADE,
  FOREIGN KEY ("user_id") REFERENCES "agents"."user"("id") ON DELETE CASCADE,
  UNIQUE(meeting_id, user_id)
);

-- Create recording table
CREATE TABLE IF NOT EXISTS "agents"."zoom_meeting_recording" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "meeting_id" UUID NOT NULL,
  "recording_type" VARCHAR(50),
  "start_time" TIMESTAMPTZ,
  "end_time" TIMESTAMPTZ,
  "file_url" TEXT,
  "file_size" BIGINT,
  "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY ("meeting_id") REFERENCES "agents"."zoom_meeting"("id") ON DELETE CASCADE
);

-- 3. Create agents_group_member Table
DROP TABLE IF EXISTS agents.agents_group_member cascade;
CREATE TABLE IF NOT EXISTS agents.agents_group_member (
    group_id        UUID NOT NULL,
    user_id         UUID NOT NULL,
    visibility      VARCHAR(20) DEFAULT 'PUBLIC',
    joined_at       TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'America/New_York'),
    role            VARCHAR(20) DEFAULT 'MEMBER',
    invited_by      UUID,
    invited_at      TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'America/New_York'),
    status          VARCHAR(20) DEFAULT 'PENDING', -- Options: PENDING, ACCEPTED, REJECTED
    last_active_at  TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'America/New_York'),
    PRIMARY KEY (group_id, user_id),
    
    CONSTRAINT fk_agents_group_member_group
        FOREIGN KEY (group_id) REFERENCES agents.agents_group(id)
        ON DELETE CASCADE,
    
    CONSTRAINT fk_agents_group_member_user
        FOREIGN KEY (user_id) REFERENCES agents."user"(id)
        ON DELETE CASCADE,
        
    CONSTRAINT fk_agents_group_member_inviter
        FOREIGN KEY (invited_by) REFERENCES agents."user"(id)
        ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_agents_group_member_user_id 
    ON agents.agents_group_member(user_id);

CREATE INDEX IF NOT EXISTS idx_agents_group_member_status 
    ON agents.agents_group_member(status);

CREATE INDEX IF NOT EXISTS idx_agents_group_member_invited_by 
    ON agents.agents_group_member(invited_by);

-- 4. Create Indexes for agents_group and agents_group_member
CREATE INDEX IF NOT EXISTS idx_agents_group_leader_id 
    ON agents.agents_group(leader_id);

CREATE INDEX IF NOT EXISTS idx_agents_group_tags 
    ON agents.agents_group USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_agents_group_member_user_id 
    ON agents.agents_group_member(user_id);

-- =====================================================
-- Section 4: Core Functions
-- =====================================================

-- Create updated_at column trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create zoom meeting functions
CREATE OR REPLACE FUNCTION "agents".create_zoom_meeting(
  p_agents_group_id UUID,
  p_topic VARCHAR,
  p_start_time TIMESTAMPTZ,
  p_duration INTEGER,
  p_settings JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_meeting_id UUID;
BEGIN
  -- Verify user has permission
  IF NOT EXISTS (
    SELECT 1 FROM "agents"."agents_group_member"
    WHERE group_id = p_agents_group_id
    AND user_id = auth.uid()::UUID
    AND role IN ('LEADER','ADMIN', 'MEMBER')
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Create meeting
  INSERT INTO "agents"."zoom_meeting" (
    agents_group_id,
    meeting_id,
    topic,
    start_time,
    duration,
    host_id,
    settings,
    join_url,
    start_url,
    password,
    status
  )
  VALUES (
    p_agents_group_id,
    v_meeting_id::VARCHAR(255),
    p_topic,
    p_start_time,
    p_duration,
    auth.uid()::UUID,
    p_settings,
    '',
    '',
    encode(gen_random_bytes(6), 'hex'),
    'SCHEDULED'
  )
  RETURNING id INTO v_meeting_id;

  -- Add host as participant
  INSERT INTO "agents"."zoom_meeting_participant" (
    meeting_id,
    user_id,
    role
  )
  VALUES (
    v_meeting_id,
    auth.uid()::UUID,
    'HOST'
  );

  RETURN v_meeting_id;
END;
$$;

-- Function to start meeting
CREATE OR REPLACE FUNCTION "agents".start_zoom_meeting(
  p_meeting_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify user is host
  IF NOT EXISTS (
    SELECT 1 FROM "agents"."zoom_meeting"
    WHERE id = p_meeting_id
    AND host_id = auth.uid()::UUID
  ) THEN
    RAISE EXCEPTION 'Only host can start meeting';
  END IF;

  -- Update meeting status
  UPDATE "agents"."zoom_meeting"
  SET 
    status = 'started',
    started_at = CURRENT_TIMESTAMP
  WHERE id = p_meeting_id
  AND status = 'not_started';

  -- Ensure host is marked as participant
  INSERT INTO "agents"."zoom_meeting_participant" (
    meeting_id,
    user_id,
    role,
    join_time
  )
  VALUES (
    p_meeting_id,
    auth.uid()::UUID,
    'HOST',
    CURRENT_TIMESTAMP
  )
  ON CONFLICT (meeting_id, user_id) 
  DO UPDATE SET
    join_time = CURRENT_TIMESTAMP,
    leave_time = NULL;
END;
$$;

-- Function to join meeting
CREATE OR REPLACE FUNCTION "agents".join_zoom_meeting(
  p_meeting_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify meeting exists and user has access
  IF NOT EXISTS (
    SELECT 1 FROM "agents"."zoom_meeting" m
    JOIN "agents"."agents_group_member" bm
    ON m.agents_group_id = bm.group_id
    WHERE m.id = p_meeting_id
    AND bm.user_id = auth.uid()::UUID
  ) THEN
    RAISE EXCEPTION 'Unauthorized or meeting not found';
  END IF;

  -- Add participant record
  INSERT INTO "agents"."zoom_meeting_participant" (
    meeting_id,
    user_id,
    join_time
  )
  VALUES (
    p_meeting_id,
    auth.uid()::UUID,
    CURRENT_TIMESTAMP
  )
  ON CONFLICT (meeting_id, user_id) 
  DO UPDATE SET
    join_time = CURRENT_TIMESTAMP,
    leave_time = NULL;
END;
$$;

-- Function to leave meeting
CREATE OR REPLACE FUNCTION "agents".leave_zoom_meeting(
  p_meeting_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE "agents"."zoom_meeting_participant"
  SET 
    leave_time = CURRENT_TIMESTAMP,
    duration = EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - join_time))::INTEGER
  WHERE meeting_id = p_meeting_id
  AND user_id = auth.uid()::UUID
  AND leave_time IS NULL;
END;
$$;

-- Function to end meeting
CREATE OR REPLACE FUNCTION "agents".end_zoom_meeting(
  p_meeting_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify user is host
  IF NOT EXISTS (
    SELECT 1 FROM "agents"."zoom_meeting"
    WHERE id = p_meeting_id
    AND host_id = auth.uid()::UUID
  ) THEN
    RAISE EXCEPTION 'Only host can end meeting';
  END IF;

  -- Update meeting status
  UPDATE "agents"."zoom_meeting"
  SET status = 'ended'
  WHERE id = p_meeting_id
  AND status = 'started';

  -- Update all participants' leave time
  UPDATE "agents"."zoom_meeting_participant"
  SET 
    leave_time = CURRENT_TIMESTAMP,
    duration = EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - join_time))::INTEGER
  WHERE meeting_id = p_meeting_id
  AND leave_time IS NULL;
END;
$$;

-- Function to cancel meeting
CREATE OR REPLACE FUNCTION "agents".cancel_zoom_meeting(
  p_meeting_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify user is host
  IF NOT EXISTS (
    SELECT 1 FROM "agents"."zoom_meeting"
    WHERE id = p_meeting_id
    AND host_id = auth.uid()::UUID
  ) THEN
    RAISE EXCEPTION 'Only host can cancel meeting';
  END IF;

  -- Update meeting status
  UPDATE "agents"."zoom_meeting"
  SET status = 'cancelled'
  WHERE id = p_meeting_id
  AND status = 'not_started';
END;
$$;

-- =====================================================
-- Section 5: Triggers
-- =====================================================

-- Create triggers for updated_at
CREATE TRIGGER update_zoom_meeting_updated_at
    BEFORE UPDATE ON "agents"."zoom_meeting"
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- =====================================================
-- Section 6: Indexes
-- =====================================================

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_zoom_meeting_agents_group" ON "agents"."zoom_meeting"("agents_group_id");
CREATE INDEX IF NOT EXISTS "idx_zoom_meeting_host" ON "agents"."zoom_meeting"("host_id");
CREATE INDEX IF NOT EXISTS "idx_zoom_meeting_status" ON "agents"."zoom_meeting"("status");
CREATE INDEX IF NOT EXISTS "idx_zoom_participant_meeting" ON "agents"."zoom_meeting_participant"("meeting_id");
CREATE INDEX IF NOT EXISTS "idx_zoom_participant_user" ON "agents"."zoom_meeting_participant"("user_id");

-- Create indexes for agents_group zoom fields
CREATE INDEX IF NOT EXISTS idx_agents_group_zoom_meeting_id ON agents.agents_group(zoom_meeting_id);
CREATE INDEX IF NOT EXISTS idx_agents_group_zoom_session_id ON agents.agents_group(zoom_session_id);
CREATE INDEX IF NOT EXISTS idx_agents_group_zoom_start_time ON agents.agents_group(zoom_start_time);

-- =====================================================
-- Section 7: RLS Policies
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE "agents"."zoom_meeting" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "agents"."zoom_meeting_participant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "agents"."zoom_meeting_recording" ENABLE ROW LEVEL SECURITY;

-- Zoom Meeting Policies
CREATE POLICY "Group leaders can create meetings" ON "agents"."zoom_meeting"
    FOR INSERT WITH CHECK (
      EXISTS (
        SELECT 1 
        FROM "agents"."agents_group_member" bm
        WHERE bm.group_id = "agents"."zoom_meeting".agents_group_id
          AND bm.user_id = auth.uid()::uuid
          AND bm.role IN ('ADMIN', 'LEADER')
      )
    );

CREATE POLICY "Group members can view meetings" ON "agents"."zoom_meeting"
    FOR SELECT USING (
      EXISTS (
        SELECT 1 
        FROM "agents"."agents_group_member" bm
        WHERE bm.group_id = "agents"."zoom_meeting".agents_group_id
          AND bm.user_id = auth.uid()::uuid
      )
    );

CREATE POLICY "Hosts can update their meetings" ON "agents"."zoom_meeting"
    FOR UPDATE USING (
      "agents"."zoom_meeting".host_id = auth.uid()::uuid
    )
    WITH CHECK (
      "agents"."zoom_meeting".host_id = auth.uid()::uuid
    );

CREATE POLICY "Hosts can delete their meetings" ON "agents"."zoom_meeting"
    FOR DELETE USING (
      "agents"."zoom_meeting".host_id = auth.uid()::uuid
    );

-- Participant Policies
CREATE POLICY "Participants can update their status" ON "agents"."zoom_meeting_participant"
    FOR UPDATE USING (
      "agents"."zoom_meeting_participant".user_id = auth.uid()::uuid OR
      EXISTS (
        SELECT 1 
        FROM "agents"."zoom_meeting" zm
        WHERE zm.id = "agents"."zoom_meeting_participant".meeting_id
          AND zm.host_id = auth.uid()::uuid
      )
    );

-- Recording Policies
CREATE POLICY "Hosts can manage recordings" ON "agents"."zoom_meeting_recording"
    FOR ALL USING (
      EXISTS (
        SELECT 1 
        FROM "agents"."zoom_meeting" zm
        WHERE zm.id = "agents"."zoom_meeting_recording".meeting_id
          AND zm.host_id = auth.uid()::uuid
      )
    );

-- =====================================================
-- Section 8: Comments
-- =====================================================

COMMENT ON TABLE "agents"."zoom_meeting" IS 'Stores main Zoom meeting information';
COMMENT ON TABLE "agents"."zoom_meeting_participant" IS 'Tracks meeting participants and their roles';
COMMENT ON TABLE "agents"."zoom_meeting_recording" IS 'Stores meeting recording information';

COMMENT ON FUNCTION "agents".start_zoom_meeting IS 'Marks a scheduled meeting as started and ensures host is a participant';
COMMENT ON FUNCTION "agents".end_zoom_meeting IS 'Marks a started meeting as ended and records leave time for all participants';
COMMENT ON FUNCTION "agents".cancel_zoom_meeting IS 'Cancels a scheduled meeting that has not yet started';

-- Core zoom meeting tables
CREATE TABLE IF NOT EXISTS agents.zoom_meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id VARCHAR(255) NOT NULL UNIQUE,
    host_id UUID NOT NULL,
    topic VARCHAR(255),
    start_time TIMESTAMPTZ,
    duration INTEGER,
    timezone VARCHAR(50),
    password VARCHAR(50),
    join_url TEXT,
    status agents.meeting_status DEFAULT 'SCHEDULED',
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'utc+4'),
    updated_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'utc+4'),
    FOREIGN KEY (host_id) REFERENCES agents.user(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS agents.zoom_meeting_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL,
    user_id UUID NOT NULL,
    role agents.participant_role DEFAULT 'ATTENDEE',
    join_time TIMESTAMPTZ,
    leave_time TIMESTAMPTZ,
    duration INTEGER,
    created_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'utc+4'),
    updated_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'utc+4'),
    FOREIGN KEY (meeting_id) REFERENCES agents.zoom_meetings(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES agents.user(id) ON DELETE CASCADE,
    UNIQUE(meeting_id, user_id)
);

CREATE TABLE IF NOT EXISTS agents.zoom_meeting_recordings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL,
    recording_type VARCHAR(50),
    recording_url TEXT,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    file_size BIGINT,
    file_type VARCHAR(10),
    created_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'utc+4'),
    updated_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'utc+4'),
    FOREIGN KEY (meeting_id) REFERENCES agents.zoom_meetings(id) ON DELETE CASCADE
);

-- Core indexes
CREATE INDEX IF NOT EXISTS idx_zoom_meetings_host ON agents.zoom_meetings(host_id);
CREATE INDEX IF NOT EXISTS idx_zoom_meetings_status ON agents.zoom_meetings(status);
CREATE INDEX IF NOT EXISTS idx_zoom_participants_meeting ON agents.zoom_meeting_participants(meeting_id);
CREATE INDEX IF NOT EXISTS idx_zoom_participants_user ON agents.zoom_meeting_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_zoom_recordings_meeting ON agents.zoom_meeting_recordings(meeting_id);

-- Core RLS policies
ALTER TABLE agents.zoom_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents.zoom_meeting_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents.zoom_meeting_recordings ENABLE ROW LEVEL SECURITY;

-- Core policies
CREATE POLICY zoom_meetings_policy ON agents.zoom_meetings
    FOR ALL USING (
        auth.uid() = host_id OR
        auth.uid() IN (
            SELECT user_id FROM agents.zoom_meeting_participants 
            WHERE meeting_id = agents.zoom_meetings.id
        )
    );

CREATE POLICY zoom_participants_policy ON agents.zoom_meeting_participants
    FOR ALL USING (
        auth.uid() IN (
            SELECT host_id FROM agents.zoom_meetings 
            WHERE id = agents.zoom_meeting_participants.meeting_id
        ) OR
        auth.uid() = user_id
    );

CREATE POLICY zoom_recordings_policy ON agents.zoom_meeting_recordings
    FOR ALL USING (
        auth.uid() IN (
            SELECT host_id FROM agents.zoom_meetings 
            WHERE id = agents.zoom_meeting_recordings.meeting_id
        ) OR
        auth.uid() IN (
            SELECT user_id FROM agents.zoom_meeting_participants 
            WHERE meeting_id = agents.zoom_meeting_recordings.meeting_id
        )
    ); 

-- =====================================================
-- Section 1: Schema Setup & Types
-- =====================================================

-- Create message reaction type if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'message_reaction_type' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'agents')) THEN
    CREATE TYPE "agents"."message_reaction_type" AS ENUM (
      'LIKE',
      'HEART',
      'PRAY',
      'AMEN'
    );
  END IF;
END $$;

-- =====================================================
-- Section 2: Table Drops & Cleanup
-- =====================================================

-- Drop tables if they exist
DROP TABLE IF EXISTS "agents"."zoom_meeting_chat" CASCADE;
DROP TABLE IF EXISTS "agents"."zoom_meeting_whiteboard" CASCADE;
DROP TABLE IF EXISTS "agents"."agents_group_messages" CASCADE;
DROP TABLE IF EXISTS "agents"."agents_group_messages_reactions" CASCADE;

-- Drop existing functions
DO $$
BEGIN
  DROP FUNCTION IF EXISTS "agents".update_message_reaction_count();
  DROP FUNCTION IF EXISTS "agents".update_agents_group_messages_updated_at();
END $$;

-- =====================================================
-- Section 3: Chat & Message Tables
-- =====================================================

-- Create chat table
CREATE TABLE IF NOT EXISTS agents.zoom_meeting_chat (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL,
    sender_id UUID NOT NULL,
    message TEXT NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'utc+4'),
    created_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'utc+4'),
    updated_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'utc+4'),
    FOREIGN KEY (meeting_id) REFERENCES agents.zoom_meetings(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES agents.user(id) ON DELETE CASCADE
);

-- Create whiteboard table
CREATE TABLE IF NOT EXISTS "agents"."zoom_meeting_whiteboard" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "meeting_id" UUID NOT NULL,
  "creator_id" UUID NOT NULL,
  "content" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY ("meeting_id") REFERENCES "agents"."zoom_meeting"("id") ON DELETE CASCADE,
  FOREIGN KEY ("creator_id") REFERENCES "agents"."user"("id") ON DELETE CASCADE
);

-- Create Agents Group Messages Table
CREATE TABLE IF NOT EXISTS agents.agents_group_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    group_id UUID NOT NULL REFERENCES agents.agents_group(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES agents."user"(id) ON DELETE CASCADE,
    content JSONB NOT NULL DEFAULT '{
        "text": "",
        "mentions": [],
        "files": [],
        "reactions": {},
        "edited": false,
        "edited_at": null,
        "type": "text"
    }',
    metadata JSONB NOT NULL DEFAULT '{
        "client_generated_id": null,
        "reply_to": null,
        "thread_id": null,
        "is_thread_starter": false,
        "read_by": [],
        "delivered_to": []
    }',
    user_reactions TEXT[] DEFAULT '{}',
    reactions_count JSONB DEFAULT '{"SMILE": 0, "HEART": 0, "BLUE_HEART": 0, "CLAP": 0, "CRY": 0, "TEARS": 0, "MONOCLE": 0, "JOY": 0, "ASTONISHED": 0}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    whiteboard_title VARCHAR(255), 
    whiteboard_order INTEGER, 
    whiteboard_day DATE, 
    is_whiteboard BOOLEAN DEFAULT FALSE,

    CONSTRAINT valid_content CHECK (jsonb_typeof(content) = 'object'),
    CONSTRAINT valid_metadata CHECK (jsonb_typeof(metadata) = 'object')
);

-- Create Message Reactions Table
CREATE TABLE IF NOT EXISTS agents.agents_group_messages_reactions (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL,
    user_id UUID NOT NULL,
    reaction_type agents.message_reaction_type NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT agents_group_messages_reactions_pkey PRIMARY KEY (id),
    CONSTRAINT agents_group_messages_reactions_message_fkey 
        FOREIGN KEY (message_id) 
        REFERENCES agents.agents_group_messages(id) 
        ON DELETE CASCADE,
    CONSTRAINT agents_group_messages_reactions_user_fkey 
        FOREIGN KEY (user_id) 
        REFERENCES auth.users(id) 
        ON DELETE CASCADE,
    CONSTRAINT unique_user_message_reaction 
        UNIQUE (message_id, user_id, reaction_type)
);

-- =====================================================
-- Section 4: Functions
-- =====================================================

-- Create function to update message reaction count
CREATE OR REPLACE FUNCTION agents.update_message_reaction_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE agents.agents_group_messages
        SET reactions_count = jsonb_set(
            reactions_count,
            ARRAY[NEW.reaction_type],
            to_jsonb(COALESCE((reactions_count->>NEW.reaction_type)::int, 0) + 1)
        )
        WHERE id = NEW.message_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE agents.agents_group_messages
        SET reactions_count = jsonb_set(
            reactions_count,
            ARRAY[OLD.reaction_type],
            to_jsonb(GREATEST(COALESCE((reactions_count->>OLD.reaction_type)::int, 0) - 1, 0))
        )
        WHERE id = OLD.message_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION agents.update_agents_group_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Section 5: Triggers
-- =====================================================

-- Create triggers for updated_at
CREATE TRIGGER update_zoom_whiteboard_updated_at
    BEFORE UPDATE ON agents.zoom_meeting_whiteboard
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_agents_group_messages_updated_at
    BEFORE UPDATE ON agents.agents_group_messages
    FOR EACH ROW
    EXECUTE FUNCTION agents.update_agents_group_messages_updated_at();

-- Create triggers for reaction count updates
CREATE TRIGGER tr_message_reaction_insert
    AFTER INSERT ON agents.agents_group_messages_reactions
    FOR EACH ROW
    EXECUTE FUNCTION agents.update_message_reaction_count();

CREATE TRIGGER tr_message_reaction_delete
    AFTER DELETE ON agents.agents_group_messages_reactions
    FOR EACH ROW
    EXECUTE FUNCTION agents.update_message_reaction_count();

-- =====================================================
-- Section 6: Indexes
-- =====================================================

-- Create indexes for chat and messages
CREATE INDEX IF NOT EXISTS idx_zoom_chat_meeting ON agents.zoom_meeting_chat(meeting_id);
CREATE INDEX IF NOT EXISTS idx_zoom_whiteboard_meeting ON agents.zoom_meeting_whiteboard(meeting_id);
CREATE INDEX IF NOT EXISTS idx_agents_group_messages_group_id ON agents.agents_group_messages(group_id);
CREATE INDEX IF NOT EXISTS idx_agents_group_messages_user_id ON agents.agents_group_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_agents_group_messages_created_at ON agents.agents_group_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_agents_group_messages_content_gin ON agents.agents_group_messages USING gin (content);
CREATE INDEX IF NOT EXISTS idx_agents_group_messages_metadata_gin ON agents.agents_group_messages USING gin (metadata);
CREATE INDEX IF NOT EXISTS idx_whiteboard_messages ON agents.agents_group_messages(whiteboard_title, whiteboard_day, whiteboard_order) 
    WHERE is_whiteboard = TRUE;
CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON agents.agents_group_messages_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user_id ON agents.agents_group_messages_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_zoom_chat_sender ON agents.zoom_meeting_chat(sender_id);

-- =====================================================
-- Section 7: RLS Policies
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE agents.zoom_meeting_chat ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents.zoom_meeting_whiteboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents.agents_group_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents.agents_group_messages_reactions ENABLE ROW LEVEL SECURITY;

-- Chat Policies
CREATE POLICY zoom_chat_policy ON agents.zoom_meeting_chat
    FOR ALL USING (
        auth.uid() IN (
            SELECT user_id FROM agents.zoom_meeting_participants 
            WHERE meeting_id = agents.zoom_meeting_chat.meeting_id
        ) OR
        auth.uid() IN (
            SELECT host_id FROM agents.zoom_meetings 
            WHERE id = agents.zoom_meeting_chat.meeting_id
        )
    );

-- Whiteboard Policies
CREATE POLICY "Presenters can create whiteboards" ON agents.zoom_meeting_whiteboard
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 
            FROM agents.zoom_meeting_participant zp
            WHERE zp.meeting_id = agents.zoom_meeting_whiteboard.meeting_id
            AND zp.user_id = auth.uid()::uuid
            AND zp.role IN ('HOST', 'CO_HOST', 'PRESENTER')
        )
    );

CREATE POLICY "Participants can view whiteboards" ON agents.zoom_meeting_whiteboard
    FOR SELECT USING (
        EXISTS (
            SELECT 1 
            FROM agents.zoom_meeting_participant zp
            WHERE zp.meeting_id = agents.zoom_meeting_whiteboard.meeting_id
            AND zp.user_id = auth.uid()::uuid
        )
    );

-- Message Reactions Policies
CREATE POLICY "Users can view reactions from their groups" ON agents.agents_group_messages_reactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 
            FROM agents.agents_group_messages m
            JOIN agents.agents_group_member gm 
                ON m.group_id = gm.group_id
            WHERE m.id = agents_group_messages_reactions.message_id
            AND gm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can add reactions to messages in their groups" ON agents.agents_group_messages_reactions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 
            FROM agents.agents_group_messages m
            JOIN agents.agents_group_member gm 
                ON m.group_id = gm.group_id
            WHERE m.id = agents_group_messages_reactions.message_id
            AND gm.user_id = auth.uid()
        )
        AND user_id = auth.uid()
    );

CREATE POLICY "Users can remove their own reactions" ON agents.agents_group_messages_reactions
    FOR DELETE USING (user_id = auth.uid());

-- =====================================================
-- Section 8: Comments
-- =====================================================

COMMENT ON TABLE agents.zoom_meeting_chat IS 'Stores meeting chat messages';
COMMENT ON TABLE agents.zoom_meeting_whiteboard IS 'Stores whiteboard content for meetings';
COMMENT ON TABLE agents.agents_group_messages IS 'Stores group chat messages and whiteboard content';
COMMENT ON TABLE agents.agents_group_messages_reactions IS 'Stores reactions to group messages'; 
