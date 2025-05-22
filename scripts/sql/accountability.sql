/* ─────────────────────────────────────────────
   0️⃣  Fresh start: drop and recreate schema
   ───────────────────────────────────────────── */
DROP SCHEMA IF EXISTS accountability CASCADE;
CREATE SCHEMA IF NOT EXISTS accountability;
SET search_path TO accountability, public;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

/* ─────────────────────────────────────────────
   1️⃣  Enum types  (create once per schema)
   ───────────────────────────────────────────── */
CREATE TYPE user_role_enum            AS ENUM ('USER','ADMIN','MODERATOR');
CREATE TYPE subscription_status_enum  AS ENUM ('TRIAL','ACTIVE','CANCELLED','EXPIRED');
CREATE TYPE user_plan_enum            AS ENUM ('STARTER','PREMIUM','FAMILY');
CREATE TYPE gender_enum               AS ENUM ('MALE','FEMALE','NON_BINARY','TRANS_MALE','TRANS_FEMALE','OTHER');
CREATE TYPE dating_preference_enum    AS ENUM ('MEN','WOMEN','BOTH','NON_BINARY','ALL');
CREATE TYPE relationship_type_enum    AS ENUM ('CASUAL','SERIOUS','MARRIAGE','FRIENDSHIP');

/* ─────────────────────────────────────────────
   2️⃣  Parent table: "user"
   ───────────────────────────────────────────── */
-- 1. Create user table
CREATE TABLE IF NOT EXISTS accountability."user" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    role accountability.user_role_enum DEFAULT 'USER',
    subscription_status accountability.subscription_status_enum DEFAULT 'TRIAL',
    timezone VARCHAR(50) DEFAULT 'America/New_York',
    text_message_time VARCHAR(8),
    password TEXT,
    password_reset_token TEXT,
    password_reset_token_exp TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'utc+4'),
    updated_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'utc+4'),
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT phone_format CHECK (phone ~* '^\+?[1-9]\d{1,14}$')
);

/* ─────────────────────────────────────────────
   3️⃣  Child table: user_preferences
        – FK is DEFERRABLE INITIALLY DEFERRED
   ───────────────────────────────────────────── */
-- 2. Create user_preferences table
CREATE TABLE user_preferences (
  id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL,
  theme_preferences TEXT[] DEFAULT ARRAY['light']::TEXT[],
  blocked_themes    TEXT[] DEFAULT '{}',
  message_length_preference VARCHAR(20) DEFAULT 'MEDIUM',
  gender            gender_enum,
  dating_preference dating_preference_enum,
  relationship_type relationship_type_enum,
  age_preference_min INT CHECK (age_preference_min >= 18),
  age_preference_max INT CHECK (age_preference_max <= 100),
  location_preference JSONB DEFAULT '{"radius":50,"unit":"miles","coordinates":null}',
  deal_breakers           TEXT[] DEFAULT '{}',
  interests               TEXT[] DEFAULT '{}',
  notification_preferences JSONB DEFAULT '{"new_matches":true,"messages":true,"profile_views":true,"likes":true}',
  privacy_settings         JSONB DEFAULT '{"show_online_status":true,"show_last_active":true,"show_distance":true,"show_age":true}',
  created_at TIMESTAMPTZ   DEFAULT (now() AT TIME ZONE 'utc+4'),
  updated_at TIMESTAMPTZ   DEFAULT (now() AT TIME ZONE 'utc+4'),
  /* FK comes **after** column list so we keep commas right */
  CONSTRAINT fk_user_preferences_user
      FOREIGN KEY (user_id)
      REFERENCES "user"(id)
      ON DELETE CASCADE
      DEFERRABLE INITIALLY DEFERRED,
  CONSTRAINT age_range_check
      CHECK (age_preference_min <= age_preference_max)
);

/* ─────────────────────────────────────────────
   4️⃣  subscriptions table (FK can stay immediate)
   ───────────────────────────────────────────── */

-- 3. Create subscriptions table
CREATE TABLE IF NOT EXISTS accountability.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    status accountability.subscription_status_enum DEFAULT 'TRIAL',
    theme_ids TEXT[] DEFAULT ARRAY['dating']::TEXT[],
    preferred_time TIME DEFAULT '09:00:00',
    frequency VARCHAR(20) DEFAULT 'DAILY',
    trial_ends_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'utc+4' + interval '15 days'),
    last_message_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'utc+4'),
    next_message_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'utc+4' + interval '1 day'),
    subscription_ends_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'utc+4' + interval '15 days'),
    payment_status VARCHAR(20),
    stripe_customer_id VARCHAR(50),
    stripe_subscription_id VARCHAR(50),
    subscription_plan accountability.user_plan_enum DEFAULT 'STARTER',
    family_plan TEXT[] DEFAULT '{}',
    family_count INTEGER GENERATED ALWAYS AS (array_length(family_plan, 1)) STORED,
    congregation TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'utc+4'),
    updated_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'utc+4'),
    cancelled_at TIMESTAMPTZ,

    CONSTRAINT fk_subscriptions_user
        FOREIGN KEY (user_id)
        REFERENCES accountability."user"(id)
        ON DELETE CASCADE
);

-- 4. Create usage table
CREATE TABLE IF NOT EXISTS accountability.usage (
    user_id UUID NOT NULL,
    date DATE NOT NULL,
    count INT NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, date),
    
    CONSTRAINT fk_usage_user
        FOREIGN KEY (user_id) REFERENCES accountability."user"(id)
        ON DELETE CASCADE
);

-- 5. Create usage_monthly table
CREATE TABLE IF NOT EXISTS accountability.usage_monthly (
    user_id UUID NOT NULL,
    month DATE NOT NULL,  -- Will store first day of each month
    count INTEGER DEFAULT 0,
    count_by_date JSONB DEFAULT '{}',
    PRIMARY KEY (user_id, month),
    
    CONSTRAINT fk_usage_monthly_user
        FOREIGN KEY (user_id) REFERENCES accountability."user"(id)
        ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_email ON accountability."user"(email);
CREATE INDEX IF NOT EXISTS idx_user_role ON accountability."user"(role);
CREATE INDEX IF NOT EXISTS idx_user_subscription_status ON accountability."user"(subscription_status);
CREATE INDEX IF NOT EXISTS idx_user_timezone ON accountability."user"(timezone);
CREATE INDEX IF NOT EXISTS idx_user_text_message_time ON accountability."user"(text_message_time);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON accountability.user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_theme ON accountability.user_preferences USING GIN(theme_preferences);
CREATE INDEX IF NOT EXISTS idx_user_preferences_blocked_themes ON accountability.user_preferences USING GIN(blocked_themes);
CREATE INDEX IF NOT EXISTS idx_user_preferences_gender ON accountability.user_preferences(gender);
CREATE INDEX IF NOT EXISTS idx_user_preferences_dating_preference ON accountability.user_preferences(dating_preference);
CREATE INDEX IF NOT EXISTS idx_user_preferences_relationship_type ON accountability.user_preferences(relationship_type);
CREATE INDEX IF NOT EXISTS idx_user_preferences_interests ON accountability.user_preferences USING GIN(interests);
CREATE INDEX IF NOT EXISTS idx_user_preferences_deal_breakers ON accountability.user_preferences USING GIN(deal_breakers);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON accountability.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON accountability.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_subscription_plan ON accountability.subscriptions(subscription_plan);
CREATE INDEX IF NOT EXISTS idx_subscriptions_family_count ON accountability.subscriptions(family_count);
CREATE INDEX IF NOT EXISTS idx_subscriptions_theme_ids ON accountability.subscriptions USING GIN(theme_ids);

CREATE INDEX IF NOT EXISTS idx_usage_user_date ON accountability.usage(user_id, date);
CREATE INDEX IF NOT EXISTS idx_usage_monthly_user_month ON accountability.usage_monthly(user_id, month);

-- Create functions for updating timestamps
CREATE OR REPLACE FUNCTION accountability.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW() AT TIME ZONE 'utc+4';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
DO $$
BEGIN
    -- Trigger for user table
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger t
        JOIN pg_class c ON c.oid = t.tgrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE t.tgname = 'trg_update_user_updated_at'
          AND n.nspname = 'accountability'
          AND c.relname = 'user'
    ) THEN
        CREATE TRIGGER trg_update_user_updated_at
            BEFORE UPDATE ON accountability."user"
            FOR EACH ROW
            EXECUTE FUNCTION accountability.update_updated_at_column();
    END IF;

    -- Trigger for user_preferences table
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger t
        JOIN pg_class c ON c.oid = t.tgrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE t.tgname = 'trg_update_user_preferences_updated_at'
          AND n.nspname = 'accountability'
          AND c.relname = 'user_preferences'
    ) THEN
        CREATE TRIGGER trg_update_user_preferences_updated_at
            BEFORE UPDATE ON accountability.user_preferences
            FOR EACH ROW
            EXECUTE FUNCTION accountability.update_updated_at_column();
    END IF;

    -- Trigger for subscriptions table
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger t
        JOIN pg_class c ON c.oid = t.tgrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE t.tgname = 'trg_update_subscriptions_updated_at'
          AND n.nspname = 'accountability'
          AND c.relname = 'subscriptions'
    ) THEN
        CREATE TRIGGER trg_update_subscriptions_updated_at
            BEFORE UPDATE ON accountability.subscriptions
            FOR EACH ROW
            EXECUTE FUNCTION accountability.update_updated_at_column();
    END IF;
END$$;

-- Enable Row Level Security
ALTER TABLE accountability."user" ENABLE ROW LEVEL SECURITY;
ALTER TABLE accountability.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE accountability.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE accountability.usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE accountability.usage_monthly ENABLE ROW LEVEL SECURITY;

-- User table policies
DROP POLICY IF EXISTS user_select ON accountability."user";
CREATE POLICY user_select ON accountability."user"
    FOR SELECT
    USING (auth.uid() = id);

DROP POLICY IF EXISTS user_update ON accountability."user";
CREATE POLICY user_update ON accountability."user"
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

--─────────────────────────────────────────────────────────
-- 1️⃣  allow INSERT on accountability.user_preferences
--─────────────────────────────────────────────────────────
DROP POLICY IF EXISTS user_preferences_insert
    ON accountability.user_preferences;

CREATE POLICY user_preferences_insert
    ON  accountability.user_preferences
    FOR INSERT
    TO  service_role, postgres, authenticated, anon   -- add/adjust roles you actually use
    WITH CHECK (true);      -- no row restriction


-- ──────────────────────────────────────────────────────────────
-- "user"  ▸  service connection must be able to SELECT any row
--          so FK checks can succeed inside the transaction
-- ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS user_select_backend ON accountability."user";

CREATE POLICY user_select_backend
ON          accountability."user"
FOR SELECT
TO          authenticated, anon, postgres, service_role
USING       (true);      -- allow every row to be visible
DROP POLICY IF EXISTS subscriptions_insert ON accountability.subscriptions;

--─────────────────────────────────────────────────────────
-- 2️⃣  allow INSERT on accountability.subscriptions
--─────────────────────────────────────────────────────────
DROP POLICY IF EXISTS subscriptions_insert
    ON accountability.subscriptions;

CREATE POLICY subscriptions_insert
    ON  accountability.subscriptions
    FOR INSERT
    TO  service_role, postgres, authenticated, anon
    WITH CHECK (true);

-- User preferences table policies
DROP POLICY IF EXISTS user_preferences_select ON accountability.user_preferences;
CREATE POLICY user_preferences_select ON accountability.user_preferences
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS user_preferences_update ON accountability.user_preferences;
CREATE POLICY user_preferences_update ON accountability.user_preferences
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Subscriptions table policies
DROP POLICY IF EXISTS subscriptions_select ON accountability.subscriptions;
CREATE POLICY subscriptions_select ON accountability.subscriptions
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS subscriptions_update ON accountability.subscriptions;
CREATE POLICY subscriptions_update ON accountability.subscriptions
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Usage table policies
DROP POLICY IF EXISTS usage_select ON accountability.usage;
CREATE POLICY usage_select ON accountability.usage
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS usage_insert ON accountability.usage;
CREATE POLICY usage_insert ON accountability.usage
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Usage monthly table policies
DROP POLICY IF EXISTS usage_monthly_select ON accountability.usage_monthly;
CREATE POLICY usage_monthly_select ON accountability.usage_monthly
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS usage_monthly_insert ON accountability.usage_monthly;
CREATE POLICY usage_monthly_insert ON accountability.usage_monthly
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);


-- Grant necessary permissions
GRANT USAGE ON SCHEMA accountability TO authenticated;
GRANT SELECT, UPDATE ON accountability."user" TO authenticated;
GRANT SELECT, UPDATE ON accountability.user_preferences TO authenticated;
GRANT SELECT, UPDATE ON accountability.subscriptions TO authenticated;
GRANT SELECT, INSERT ON accountability.usage TO authenticated;
GRANT SELECT, INSERT ON accountability.usage_monthly TO authenticated;

-- Grant usage on schemas
GRANT USAGE ON SCHEMA accountability TO postgres;

-- Dating Accountability Tables

-- 1. Create dating_profiles table
CREATE TABLE IF NOT EXISTS accountability.dating_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    bio TEXT,
    relationship_goals TEXT[] DEFAULT ARRAY[]::TEXT[],
    deal_breakers TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'utc+4'),
    updated_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'utc+4'),
    
    CONSTRAINT fk_dating_profile_user
        FOREIGN KEY (user_id) REFERENCES accountability."user"(id)
        ON DELETE CASCADE
);

-- 2. Create dating_history table
CREATE TABLE IF NOT EXISTS accountability.dating_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    date_person_id UUID NOT NULL,
    date_started_at TIMESTAMPTZ NOT NULL,
    date_ended_at TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, ENDED, BLOCKED
    created_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'utc+4'),
    updated_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'utc+4'),
    
    CONSTRAINT fk_dating_history_user
        FOREIGN KEY (user_id) REFERENCES accountability."user"(id)
        ON DELETE CASCADE,
    
    CONSTRAINT fk_dating_history_date_person
        FOREIGN KEY (date_person_id) REFERENCES accountability."user"(id)
        ON DELETE CASCADE
);

-- 3. Create date_ratings table
CREATE TABLE IF NOT EXISTS accountability.date_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dating_history_id UUID NOT NULL,
    rater_id UUID NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    categories JSONB DEFAULT '{
        "communication": 0,
        "respect": 0,
        "compatibility": 0,
        "chemistry": 0,
        "overall": 0
    }'::jsonb,
    created_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'utc+4'),
    updated_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'utc+4'),
    
    CONSTRAINT fk_date_ratings_dating_history
        FOREIGN KEY (dating_history_id) REFERENCES accountability.dating_history(id)
        ON DELETE CASCADE,
    
    CONSTRAINT fk_date_ratings_rater
        FOREIGN KEY (rater_id) REFERENCES accountability."user"(id)
        ON DELETE CASCADE
);

-- 4. Create accountability_partners table
CREATE TABLE IF NOT EXISTS accountability.accountability_partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    partner_id UUID NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, ACTIVE, REJECTED
    created_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'utc+4'),
    updated_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'utc+4'),
    
    CONSTRAINT fk_accountability_partners_user
        FOREIGN KEY (user_id) REFERENCES accountability."user"(id)
        ON DELETE CASCADE,
    
    CONSTRAINT fk_accountability_partners_partner
        FOREIGN KEY (partner_id) REFERENCES accountability."user"(id)
        ON DELETE CASCADE,
    
    CONSTRAINT unique_partnership UNIQUE (user_id, partner_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_dating_profiles_user_id 
    ON accountability.dating_profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_dating_history_user_id 
    ON accountability.dating_history(user_id);

CREATE INDEX IF NOT EXISTS idx_dating_history_date_person_id 
    ON accountability.dating_history(date_person_id);

CREATE INDEX IF NOT EXISTS idx_date_ratings_dating_history_id 
    ON accountability.date_ratings(dating_history_id);

CREATE INDEX IF NOT EXISTS idx_date_ratings_rater_id 
    ON accountability.date_ratings(rater_id);

CREATE INDEX IF NOT EXISTS idx_accountability_partners_user_id 
    ON accountability.accountability_partners(user_id);

CREATE INDEX IF NOT EXISTS idx_accountability_partners_partner_id 
    ON accountability.accountability_partners(partner_id);

-- Create triggers for updated_at columns
CREATE OR REPLACE FUNCTION accountability.update_dating_tables_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW() AT TIME ZONE 'utc+4';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all dating-related tables
DO $$
BEGIN
    -- Trigger for dating_profiles
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger t
        JOIN pg_class c ON c.oid = t.tgrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE t.tgname = 'trg_update_dating_profiles_updated_at'
          AND n.nspname = 'accountability'
          AND c.relname = 'dating_profiles'
    ) THEN
        CREATE TRIGGER trg_update_dating_profiles_updated_at
            BEFORE UPDATE ON accountability.dating_profiles
            FOR EACH ROW
            EXECUTE FUNCTION accountability.update_dating_tables_updated_at();
    END IF;

    -- Trigger for dating_history
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger t
        JOIN pg_class c ON c.oid = t.tgrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE t.tgname = 'trg_update_dating_history_updated_at'
          AND n.nspname = 'accountability'
          AND c.relname = 'dating_history'
    ) THEN
        CREATE TRIGGER trg_update_dating_history_updated_at
            BEFORE UPDATE ON accountability.dating_history
            FOR EACH ROW
            EXECUTE FUNCTION accountability.update_dating_tables_updated_at();
    END IF;

    -- Trigger for date_ratings
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger t
        JOIN pg_class c ON c.oid = t.tgrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE t.tgname = 'trg_update_date_ratings_updated_at'
          AND n.nspname = 'accountability'
          AND c.relname = 'date_ratings'
    ) THEN
        CREATE TRIGGER trg_update_date_ratings_updated_at
            BEFORE UPDATE ON accountability.date_ratings
            FOR EACH ROW
            EXECUTE FUNCTION accountability.update_dating_tables_updated_at();
    END IF;

    -- Trigger for accountability_partners
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger t
        JOIN pg_class c ON c.oid = t.tgrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE t.tgname = 'trg_update_accountability_partners_updated_at'
          AND n.nspname = 'accountability'
          AND c.relname = 'accountability_partners'
    ) THEN
        CREATE TRIGGER trg_update_accountability_partners_updated_at
            BEFORE UPDATE ON accountability.accountability_partners
            FOR EACH ROW
            EXECUTE FUNCTION accountability.update_dating_tables_updated_at();
    END IF;
END;
$$;
-- Enable Row Level Security
ALTER TABLE accountability.dating_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE accountability.dating_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE accountability.date_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE accountability.accountability_partners ENABLE ROW LEVEL SECURITY;

-- Dating profiles policies
DROP POLICY IF EXISTS dating_profiles_select ON accountability.dating_profiles;
CREATE POLICY dating_profiles_select ON accountability.dating_profiles
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS dating_profiles_update ON accountability.dating_profiles;
CREATE POLICY dating_profiles_update ON accountability.dating_profiles
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Dating history policies
DROP POLICY IF EXISTS dating_history_select ON accountability.dating_history;
CREATE POLICY dating_history_select ON accountability.dating_history
    FOR SELECT
    USING (auth.uid() = user_id OR auth.uid() = date_person_id);

DROP POLICY IF EXISTS dating_history_insert ON accountability.dating_history;
CREATE POLICY dating_history_insert ON accountability.dating_history
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS dating_history_update ON accountability.dating_history;
CREATE POLICY dating_history_update ON accountability.dating_history
    FOR UPDATE
    USING (auth.uid() = user_id OR auth.uid() = date_person_id)
    WITH CHECK (auth.uid() = user_id OR auth.uid() = date_person_id);

-- Date ratings policies
DROP POLICY IF EXISTS date_ratings_select ON accountability.date_ratings;
CREATE POLICY date_ratings_select ON accountability.date_ratings
    FOR SELECT
    USING (
        auth.uid() = rater_id OR
        EXISTS (
            SELECT 1 FROM accountability.dating_history dh
            WHERE dh.id = dating_history_id
              AND (dh.user_id = auth.uid() OR dh.date_person_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS date_ratings_insert ON accountability.date_ratings;
CREATE POLICY date_ratings_insert ON accountability.date_ratings
    FOR INSERT
    WITH CHECK (auth.uid() = rater_id);

DROP POLICY IF EXISTS date_ratings_update ON accountability.date_ratings;
CREATE POLICY date_ratings_update ON accountability.date_ratings
    FOR UPDATE
    USING (auth.uid() = rater_id)
    WITH CHECK (auth.uid() = rater_id);

-- Accountability partners policies
DROP POLICY IF EXISTS accountability_partners_select ON accountability.accountability_partners;
CREATE POLICY accountability_partners_select ON accountability.accountability_partners
    FOR SELECT
    USING (auth.uid() = user_id OR auth.uid() = partner_id);

DROP POLICY IF EXISTS accountability_partners_insert ON accountability.accountability_partners;
CREATE POLICY accountability_partners_insert ON accountability.accountability_partners
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS accountability_partners_update ON accountability.accountability_partners;
CREATE POLICY accountability_partners_update ON accountability.accountability_partners
    FOR UPDATE
    USING (auth.uid() = user_id OR auth.uid() = partner_id)
    WITH CHECK (auth.uid() = user_id OR auth.uid() = partner_id);

-- Grant necessary permissions
GRANT SELECT, UPDATE ON accountability.dating_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON accountability.dating_history TO authenticated;
GRANT SELECT, INSERT, UPDATE ON accountability.date_ratings TO authenticated;
GRANT SELECT, INSERT, UPDATE ON accountability.accountability_partners TO authenticated;

-- Create messages table (replacing prayers)
CREATE TABLE IF NOT EXISTS accountability.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL,
    receiver_id UUID NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'utc+4'),
    updated_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'utc+4'),
    
    CONSTRAINT fk_messages_sender
        FOREIGN KEY (sender_id) REFERENCES accountability."user"(id)
        ON DELETE CASCADE,
    
    CONSTRAINT fk_messages_receiver
        FOREIGN KEY (receiver_id) REFERENCES accountability."user"(id)
        ON DELETE CASCADE
);

-- Create message_attachments table
CREATE TABLE IF NOT EXISTS accountability.message_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(50),
    file_size INTEGER,
    created_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'utc+4'),
    
    CONSTRAINT fk_message_attachments_message
        FOREIGN KEY (message_id) REFERENCES accountability.messages(id)
        ON DELETE CASCADE
);

-- Create user_matches table
CREATE TABLE IF NOT EXISTS accountability.user_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    matched_user_id UUID NOT NULL,
    match_status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, MATCHED, REJECTED
    match_score FLOAT, -- Compatibility score
    created_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'utc+4'),
    updated_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'utc+4'),
    
    CONSTRAINT fk_user_matches_user
        FOREIGN KEY (user_id) REFERENCES accountability."user"(id)
        ON DELETE CASCADE,
    
    CONSTRAINT fk_user_matches_matched_user
        FOREIGN KEY (matched_user_id) REFERENCES accountability."user"(id)
        ON DELETE CASCADE,
    
    CONSTRAINT unique_match UNIQUE (user_id, matched_user_id)
);

-- Create indexes for new tables
CREATE INDEX IF NOT EXISTS idx_messages_sender ON accountability.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON accountability.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON accountability.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON accountability.messages(is_read);

CREATE INDEX IF NOT EXISTS idx_message_attachments_message ON accountability.message_attachments(message_id);

CREATE INDEX IF NOT EXISTS idx_user_matches_user ON accountability.user_matches(user_id);
CREATE INDEX IF NOT EXISTS idx_user_matches_matched_user ON accountability.user_matches(matched_user_id);
CREATE INDEX IF NOT EXISTS idx_user_matches_status ON accountability.user_matches(match_status);

-- Create triggers for new tables
DO $$
BEGIN
    -- Trigger for messages
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger t
        JOIN pg_class c ON c.oid = t.tgrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE t.tgname = 'trg_update_messages_updated_at'
          AND n.nspname = 'accountability'
          AND c.relname = 'messages'
    ) THEN
        CREATE TRIGGER trg_update_messages_updated_at
            BEFORE UPDATE ON accountability.messages
            FOR EACH ROW
            EXECUTE FUNCTION accountability.update_updated_at_column();
    END IF;

    -- Trigger for user_matches
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger t
        JOIN pg_class c ON c.oid = t.tgrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE t.tgname = 'trg_update_user_matches_updated_at'
          AND n.nspname = 'accountability'
          AND c.relname = 'user_matches'
    ) THEN
        CREATE TRIGGER trg_update_user_matches_updated_at
            BEFORE UPDATE ON accountability.user_matches
            FOR EACH ROW
            EXECUTE FUNCTION accountability.update_updated_at_column();
    END IF;
END;
$$;
-- Enable Row Level Security for new tables
ALTER TABLE accountability.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE accountability.message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE accountability.user_matches ENABLE ROW LEVEL SECURITY;

-- Messages policies
DROP POLICY IF EXISTS messages_select ON accountability.messages;
CREATE POLICY messages_select ON accountability.messages
    FOR SELECT
    USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS messages_insert ON accountability.messages;
CREATE POLICY messages_insert ON accountability.messages
    FOR INSERT
    WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS messages_update ON accountability.messages;
CREATE POLICY messages_update ON accountability.messages
    FOR UPDATE
    USING (auth.uid() = sender_id OR auth.uid() = receiver_id)
    WITH CHECK (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Message attachments policies
DROP POLICY IF EXISTS message_attachments_select ON accountability.message_attachments;
CREATE POLICY message_attachments_select ON accountability.message_attachments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM accountability.messages m
            WHERE m.id = message_id
              AND (m.sender_id = auth.uid() OR m.receiver_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS message_attachments_insert ON accountability.message_attachments;
CREATE POLICY message_attachments_insert ON accountability.message_attachments
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM accountability.messages m
            WHERE m.id = message_id
              AND m.sender_id = auth.uid()
        )
    );

-- User matches policies
DROP POLICY IF EXISTS user_matches_select ON accountability.user_matches;
CREATE POLICY user_matches_select ON accountability.user_matches
    FOR SELECT
    USING (auth.uid() = user_id OR auth.uid() = matched_user_id);

DROP POLICY IF EXISTS user_matches_insert ON accountability.user_matches;
CREATE POLICY user_matches_insert ON accountability.user_matches
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS user_matches_update ON accountability.user_matches;
CREATE POLICY user_matches_update ON accountability.user_matches
    FOR UPDATE
    USING (auth.uid() = user_id OR auth.uid() = matched_user_id)
    WITH CHECK (auth.uid() = user_id OR auth.uid() = matched_user_id);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON accountability.messages TO authenticated;
GRANT SELECT, INSERT ON accountability.message_attachments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON accountability.user_matches TO authenticated;

