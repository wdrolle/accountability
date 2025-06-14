/* ────────────────────────────────────────────────────────────────
   0️⃣  Fresh start     – drop & recreate schema, drop old triggers
   ────────────────────────────────────────────────────────────────*/
DROP SCHEMA IF EXISTS accountability CASCADE;
CREATE SCHEMA accountability;
SET search_path TO accountability, public;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

/* 🔥  Remove any old auth.users AFTER/BEFORE triggers that call
        functions in other schemas (e.g. myvideobrowser.sync_auth_user)
        to avoid cross-schema FK errors during signup            */
DO $$
DECLARE
    trg RECORD;
BEGIN
    FOR trg IN
        SELECT tgname
        FROM   pg_trigger
        WHERE  tgrelid = 'auth.users'::regclass
        AND    NOT tgisinternal
        AND    tgname ILIKE '%sync_auth_user%'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON auth.users', trg.tgname);
        RAISE NOTICE 'Dropped legacy trigger on auth.users → %', trg.tgname;
    END LOOP;
END $$;

/* ────────────────────────────────────────────────────────────────
   1️⃣  ENUM TYPES
   ────────────────────────────────────────────────────────────────*/
CREATE TYPE user_role_accountability_enum           AS ENUM ('USER','ADMIN','MODERATOR');
CREATE TYPE subscription_status_accountability_enum AS ENUM ('TRIAL','ACTIVE','CANCELLED','EXPIRED');
CREATE TYPE user_plan_accountability_enum           AS ENUM ('STARTER','PREMIUM','FAMILY');
CREATE TYPE gender_accountability_enum              AS ENUM ('MALE','FEMALE','NON_BINARY','TRANS_MALE','TRANS_FEMALE','OTHER');
CREATE TYPE dating_preference_accountability_enum   AS ENUM ('MEN','WOMEN','BOTH','NON_BINARY','ALL');
CREATE TYPE relationship_type_accountability_enum   AS ENUM ('CASUAL','SERIOUS','MARRIAGE','FRIENDSHIP');

/* ────────────────────────────────────────────────────────────────
   2️⃣  PARENT TABLE  ▸ accountability."user"
   ────────────────────────────────────────────────────────────────*/
CREATE TABLE IF NOT EXISTS accountability."user" (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email               TEXT UNIQUE NOT NULL,
    first_name          TEXT,
    last_name           TEXT,
    phone               TEXT,
    role                user_role_accountability_enum           DEFAULT 'USER',
    subscription_status subscription_status_accountability_enum DEFAULT 'TRIAL',
    timezone            VARCHAR(50)              DEFAULT 'America/New_York',
    text_message_time   VARCHAR(8),
    created_at          TIMESTAMPTZ              DEFAULT now(),
    updated_at          TIMESTAMPTZ              DEFAULT now(),
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT phone_format CHECK (phone ~* '^\+?[1-9]\d{1,14}$')
);

/* ────────────────────────────────────────────────────────────────
   3️⃣  CHILD TABLE  ▸ accountability.user_preferences
   ────────────────────────────────────────────────────────────────*/
CREATE TABLE IF NOT EXISTS accountability.user_preferences (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                  UUID UNIQUE NOT NULL,
    theme_preferences        TEXT[]  DEFAULT ARRAY['light']::TEXT[],
    blocked_themes           TEXT[]  DEFAULT '{}',
    message_length_preference VARCHAR(20) DEFAULT 'MEDIUM',
    gender                   gender_accountability_enum,
    dating_preference        dating_preference_accountability_enum,
    relationship_type        relationship_type_accountability_enum,
    age_preference_min       INT CHECK (age_preference_min >= 18),
    age_preference_max       INT CHECK (age_preference_max <= 100),
    location_preference      JSONB   DEFAULT '{"radius":50,"unit":"miles","coordinates":null}',
    deal_breakers            TEXT[]  DEFAULT '{}',
    interests                TEXT[]  DEFAULT '{}',
    notification_preferences JSONB   DEFAULT '{"new_matches":true,"messages":true,"profile_views":true,"likes":true}',
    privacy_settings         JSONB   DEFAULT '{"show_online_status":true,"show_last_active":true,"show_distance":true,"show_age":true}',
    created_at               TIMESTAMPTZ DEFAULT now(),
    updated_at               TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT fk_accountability_user_preferences_user
        FOREIGN KEY (user_id)
        REFERENCES accountability."user"(id)
        ON DELETE CASCADE
        DEFERRABLE INITIALLY DEFERRED,
    CONSTRAINT age_range CHECK (age_preference_min <= age_preference_max)
);

/* ────────────────────────────────────────────────────────────────
   4️⃣  OTHER TABLES  (subscriptions, usage, etc.)
   ────────────────────────────────────────────────────────────────*/
CREATE TABLE IF NOT EXISTS accountability.subscriptions (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id              UUID UNIQUE NOT NULL,
    status               subscription_status_accountability_enum DEFAULT 'TRIAL',
    theme_ids            TEXT[]   DEFAULT ARRAY['dating']::TEXT[],
    preferred_time       TIME     DEFAULT '09:00:00',
    frequency            VARCHAR(20) DEFAULT 'DAILY',
    trial_ends_at        TIMESTAMPTZ DEFAULT (now() + interval '15 days'),
    last_message_at      TIMESTAMPTZ DEFAULT now(),
    next_message_at      TIMESTAMPTZ DEFAULT (now() + interval '1 day'),
    subscription_ends_at TIMESTAMPTZ DEFAULT (now() + interval '15 days'),
    payment_status       VARCHAR(20),
    stripe_customer_id   VARCHAR(50),
    stripe_subscription_id VARCHAR(50),
    subscription_plan    user_plan_accountability_enum DEFAULT 'STARTER',
    family_plan          TEXT[] DEFAULT '{}',
    family_count         INT GENERATED ALWAYS AS (array_length(family_plan,1)) STORED,
    congregation         TEXT[] DEFAULT '{}',
    created_at           TIMESTAMPTZ DEFAULT now(),
    updated_at           TIMESTAMPTZ DEFAULT now(),
    cancelled_at         TIMESTAMPTZ,
    CONSTRAINT fk_accountability_subscriptions_user
        FOREIGN KEY (user_id)
        REFERENCES accountability."user"(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS accountability.usage (
    user_id UUID NOT NULL,
    date    DATE NOT NULL,
    count   INT  DEFAULT 0,
    PRIMARY KEY (user_id,date),
    CONSTRAINT fk_accountability_usage_user
        FOREIGN KEY (user_id)
        REFERENCES accountability."user"(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS accountability.usage_monthly (
    user_id UUID NOT NULL,
    month   DATE NOT NULL,
    count   INT  DEFAULT 0,
    count_by_date JSONB DEFAULT '{}',
    PRIMARY KEY (user_id,month),
    CONSTRAINT fk_accountability_usage_monthly_user
        FOREIGN KEY (user_id)
        REFERENCES accountability."user"(id)
        ON DELETE CASCADE
);

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

CREATE TABLE IF NOT EXISTS accountability.files_in_storage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_url TEXT NOT NULL,
    filename TEXT NOT NULL,
    embedded_till INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'utc+4'),
    updated_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'utc+4'),
    user_id UUID,
    trained_models JSONB[] DEFAULT ARRAY[]::JSONB[],
    comments JSONB[] DEFAULT ARRAY[]::JSONB[],
    
    CONSTRAINT fk_files_in_storage_user
        FOREIGN KEY (user_id)
        REFERENCES accountability."user"(id)
        ON DELETE NO ACTION
        ON UPDATE NO ACTION
);

/* ────────────────────────────────────────────────────────────────
   5️⃣  “COPY AUTH → ACCOUNTABILITY” TRIGGER  (SCOPED)
   ────────────────────────────────────────────────────────────────*/
CREATE OR REPLACE FUNCTION accountability.copy_auth_accountability()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    /* Copy ONLY if the signup came from the Accountability app   */
    IF (NEW.raw_user_meta_data ->> 'app') = 'accountability' THEN
        INSERT INTO accountability."user"(id,email,first_name,last_name,created_at,updated_at)
        VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data ->> 'firstName',''),
            COALESCE(NEW.raw_user_meta_data ->> 'lastName',''),
            now(), now()
        )
        ON CONFLICT DO NOTHING;
    END IF;
    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_accountability_copy_auth_accountability ON auth.users;
CREATE TRIGGER trg_accountability_copy_auth_accountability
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION accountability.copy_auth_accountability();

/* ────────────────────────────────────────────────────────────────
   6️⃣  UPDATED_AT TRIGGERS  (unchanged helper)
   ────────────────────────────────────────────────────────────────*/
CREATE OR REPLACE FUNCTION accountability.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END $$;

-- Create functions for updating timestamps
CREATE OR REPLACE FUNCTION accountability.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW() AT TIME ZONE 'utc+4';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_accountability_user_u
    BEFORE UPDATE ON accountability."user"
    FOR EACH ROW EXECUTE FUNCTION accountability.set_updated_at();

CREATE TRIGGER trg_accountability_user_pref_u
    BEFORE UPDATE ON accountability.user_preferences
    FOR EACH ROW EXECUTE FUNCTION accountability.set_updated_at();

CREATE TRIGGER trg_accountability_subs_u
    BEFORE UPDATE ON accountability.subscriptions
    FOR EACH ROW EXECUTE FUNCTION accountability.set_updated_at();

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
        WHERE t.tgname = 'trg_update_accountability_dating_profiles_updated_at'
          AND n.nspname = 'accountability'
          AND c.relname = 'dating_profiles'
    ) THEN
        CREATE TRIGGER trg_update_accountability_dating_profiles_updated_at
            BEFORE UPDATE ON accountability.dating_profiles
            FOR EACH ROW
            EXECUTE FUNCTION accountability.update_dating_tables_updated_at();
    END IF;

    -- Trigger for dating_history
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger t
        JOIN pg_class c ON c.oid = t.tgrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE t.tgname = 'trg_update_accountability_dating_history_updated_at'
          AND n.nspname = 'accountability'
          AND c.relname = 'dating_history'
    ) THEN
        CREATE TRIGGER trg_update_accountability_dating_history_updated_at
            BEFORE UPDATE ON accountability.dating_history
            FOR EACH ROW
            EXECUTE FUNCTION accountability.update_dating_tables_updated_at();
    END IF;

    -- Trigger for date_ratings
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger t
        JOIN pg_class c ON c.oid = t.tgrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE t.tgname = 'trg_update_accountability_date_ratings_updated_at'
          AND n.nspname = 'accountability'
          AND c.relname = 'date_ratings'
    ) THEN
        CREATE TRIGGER trg_update_accountability_date_ratings_updated_at
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
    -- Trigger for messages
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger t
        JOIN pg_class c ON c.oid = t.tgrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE t.tgname = 'trg_update_accountability_messages_updated_at'
          AND n.nspname = 'accountability'
          AND c.relname = 'messages'
    ) THEN
        CREATE TRIGGER trg_update_accountability_messages_updated_at
            BEFORE UPDATE ON accountability.messages
            FOR EACH ROW
            EXECUTE FUNCTION accountability.update_updated_at_column();
    END IF;

    -- Trigger for user_matches
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger t
        JOIN pg_class c ON c.oid = t.tgrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE t.tgname = 'trg_update_accountability_user_matches_updated_at'
          AND n.nspname = 'accountability'
          AND c.relname = 'user_matches'
    ) THEN
        CREATE TRIGGER trg_update_accountability_user_matches_updated_at
            BEFORE UPDATE ON accountability.user_matches
            FOR EACH ROW
            EXECUTE FUNCTION accountability.update_updated_at_column();
    END IF;
    -- Create trigger for files_in_storage updated_at
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger t
        JOIN pg_class c ON c.oid = t.tgrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE t.tgname = 'trg_update_accountability_files_in_storage_updated_at'
          AND n.nspname = 'accountability'
          AND c.relname = 'files_in_storage'
    ) THEN
        CREATE TRIGGER trg_update_accountability_files_in_storage_updated_at
            BEFORE UPDATE ON accountability.files_in_storage
            FOR EACH ROW
            EXECUTE FUNCTION accountability.update_updated_at_column();
    END IF;
END;
$$;
/* ────────────────────────────────────────────────────────────────
   7️⃣  INDEXES  (same as before)
   ────────────────────────────────────────────────────────────────*/
CREATE INDEX IF NOT EXISTS idx_accountability_user_email                        ON accountability."user"(email);
CREATE INDEX IF NOT EXISTS idx_accountability_user_role                         ON accountability."user"(role);
CREATE INDEX IF NOT EXISTS idx_accountability_user_subscription_status          ON accountability."user"(subscription_status);
CREATE INDEX IF NOT EXISTS idx_accountability_user_timezone                     ON accountability."user"(timezone);

CREATE INDEX IF NOT EXISTS idx_accountability_user_pref_user_id                 ON accountability.user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_accountability_user_pref_theme                   ON accountability.user_preferences USING GIN(theme_preferences);
CREATE INDEX IF NOT EXISTS idx_accountability_user_pref_blocked                 ON accountability.user_preferences USING GIN(blocked_themes);

CREATE INDEX IF NOT EXISTS idx_accountability_subs_user_id                      ON accountability.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_accountability_subs_status                       ON accountability.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_accountability_subs_plan                         ON accountability.subscriptions(subscription_plan);

CREATE INDEX IF NOT EXISTS idx_accountability_usage_user_date                   ON accountability.usage(user_id,date);
CREATE INDEX IF NOT EXISTS idx_accountability_usage_monthly_user_month          ON accountability.usage_monthly(user_id,month);

CREATE INDEX IF NOT EXISTS idx_accountability_dating_profiles_user_id           ON accountability.dating_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_accountability_dating_history_user_id            ON accountability.dating_history(user_id);
CREATE INDEX IF NOT EXISTS idx_accountability_dating_history_date_person_id     ON accountability.dating_history(date_person_id);

CREATE INDEX IF NOT EXISTS idx_accountability_date_ratings_dating_history_id    ON accountability.date_ratings(dating_history_id);
CREATE INDEX IF NOT EXISTS idx_accountability_date_ratings_rater_id             ON accountability.date_ratings(rater_id);

CREATE INDEX IF NOT EXISTS idx_accountability_partners_user_id                  ON accountability.accountability_partners(user_id);
CREATE INDEX IF NOT EXISTS idx_accountability_partners_partner_id               ON accountability.accountability_partners(partner_id);

CREATE INDEX IF NOT EXISTS idx_accountability_messages_sender                   ON accountability.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_accountability_messages_receiver                 ON accountability.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_accountability_messages_created_at               ON accountability.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_accountability_messages_is_read                  ON accountability.messages(is_read);

CREATE INDEX IF NOT EXISTS idx_accountability_message_attachments_message       ON accountability.message_attachments(message_id);

CREATE INDEX IF NOT EXISTS idx_accountability_user_matches_user                 ON accountability.user_matches(user_id);
CREATE INDEX IF NOT EXISTS idx_accountability_user_matches_matched_user         ON accountability.user_matches(matched_user_id);
CREATE INDEX IF NOT EXISTS idx_accountability_user_matches_status               ON accountability.user_matches(match_status);

CREATE INDEX IF NOT EXISTS idx_files_in_storage_user_id                         ON accountability.files_in_storage(user_id);
/* ────────────────────────────────────────────────────────────────
   8️⃣  ROW-LEVEL SECURITY POLICIES  (insert-all so Prisma works)
   ────────────────────────────────────────────────────────────────*/
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS allow_service_role_read ON auth.users;
CREATE POLICY allow_service_role_read
    ON auth.users
    FOR SELECT
    TO  service_role, postgres, authenticated, anon  -- pick the role(s) your Prisma connection uses
    USING (true);   -- expose every row (read-only)

ALTER TABLE accountability."user"                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE accountability.user_preferences         ENABLE ROW LEVEL SECURITY;
ALTER TABLE accountability.subscriptions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE accountability.usage                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE accountability.usage_monthly            ENABLE ROW LEVEL SECURITY;
ALTER TABLE accountability.dating_profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE accountability.dating_history           ENABLE ROW LEVEL SECURITY;
ALTER TABLE accountability.date_ratings             ENABLE ROW LEVEL SECURITY;
ALTER TABLE accountability.accountability_partners  ENABLE ROW LEVEL SECURITY;
ALTER TABLE accountability.messages                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE accountability.message_attachments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE accountability.user_matches             ENABLE ROW LEVEL SECURITY;
ALTER TABLE accountability.files_in_storage ENABLE  ROW LEVEL SECURITY;

CREATE POLICY user_select_all ON accountability."user"
    FOR SELECT USING (true);

CREATE POLICY user_insert_all ON accountability."user"
    FOR INSERT TO authenticated, anon, service_role, postgres
    WITH CHECK (true);

CREATE POLICY user_pref_insert_all ON accountability.user_preferences
    FOR INSERT TO authenticated, anon, service_role, postgres
    WITH CHECK (true);

CREATE POLICY subs_insert_all ON accountability.subscriptions
    FOR INSERT TO authenticated, anon, service_role, postgres
    WITH CHECK (true);


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
-- Files in storage policies
DROP POLICY IF EXISTS files_in_storage_select ON accountability.files_in_storage;
CREATE POLICY files_in_storage_select ON accountability.files_in_storage
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS files_in_storage_insert ON accountability.files_in_storage;
CREATE POLICY files_in_storage_insert ON accountability.files_in_storage
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS files_in_storage_update ON accountability.files_in_storage;
CREATE POLICY files_in_storage_update ON accountability.files_in_storage
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

/* ────────────────────────────────────────────────────────────────
   9️⃣  GRANTS
   ────────────────────────────────────────────────────────────────*/
GRANT USAGE                         ON SCHEMA accountability                    TO authenticated, anon, service_role;
GRANT SELECT, UPDATE                ON accountability.dating_profiles           TO authenticated;
GRANT SELECT, INSERT, UPDATE        ON accountability.dating_history            TO authenticated;
GRANT SELECT, INSERT, UPDATE        ON accountability.date_ratings              TO authenticated;
GRANT SELECT, INSERT, UPDATE        ON accountability.accountability_partners   TO authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE   ON ALL TABLES IN SCHEMA accountability      TO authenticated, anon, service_role;
GRANT SELECT, INSERT, UPDATE        ON accountability.files_in_storage          TO authenticated;
GRANT INSERT, SELECT, UPDATE, DELETE ON accountability."user"                   TO service_role, postgres, authenticated;
GRANT INSERT, SELECT, UPDATE, DELETE ON accountability.user_preferences         TO service_role, postgres, authenticated;

-- SELECT id, email FROM auth.users WHERE email = ${email} LIMIT 1
-- DELETE FROM auth.users WHERE lower(email) = lower('w@w.com');
