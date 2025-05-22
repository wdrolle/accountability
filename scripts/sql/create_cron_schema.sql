DROP SCHEMA IF EXISTS cron CASCADE;
DROP SCHEMA IF EXISTS scheduler CASCADE;

-- Create extension if it doesn't exist
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Drop existing extensions
DROP EXTENSION IF EXISTS pg_cron CASCADE;
DROP EXTENSION IF EXISTS cron CASCADE;

-- Create extension again
-- CREATE EXTENSION pg_cron;

-- Create cron schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS cron;

-- Create scheduler schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS scheduler;

-- Grant usage on cron schema
GRANT USAGE ON SCHEMA cron TO postgres;

-- Drop existing tables if they exist
DROP TABLE IF EXISTS cron.job_run_details CASCADE;
DROP TABLE IF EXISTS cron.job CASCADE;

-- Create cron tables
CREATE TABLE cron.job (
    jobid          bigserial   PRIMARY KEY,
    schedule       text        NOT NULL,
    command        text        NOT NULL,
    nodename       text        NOT NULL DEFAULT 'localhost',
    nodeport       int         NOT NULL DEFAULT 5432,
    database       text        NOT NULL,
    username       text        NOT NULL DEFAULT current_user,
    active         boolean     NOT NULL DEFAULT true,
    jobname        text        UNIQUE,
    next_run       timestamptz,
    created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE cron.job_run_details (
    jobid           bigint                  NOT NULL REFERENCES cron.job (jobid) ON DELETE CASCADE,
    runid           bigserial               PRIMARY KEY,
    job_pid         integer,
    database        text                    NOT NULL,
    username        text                    NOT NULL,
    command         text                    NOT NULL,
    status          text,
    return_message  text,
    start_time      timestamptz             NOT NULL DEFAULT now(),
    end_time        timestamptz
);

-- Verify table exists before creating indexes
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'cron' AND tablename = 'job') THEN
        -- Create indexes after tables are fully defined
        CREATE INDEX IF NOT EXISTS job_active_idx ON cron.job (active);
        CREATE INDEX IF NOT EXISTS job_next_run_idx ON cron.job (next_run);
        CREATE INDEX IF NOT EXISTS job_run_details_jobid_idx ON cron.job_run_details (jobid);
    ELSE
        RAISE EXCEPTION 'cron.job table does not exist';
    END IF;
END
$$;

-- Create cron functions
CREATE OR REPLACE FUNCTION cron.schedule(p_jobname text, p_schedule text, p_command text)
RETURNS bigint
LANGUAGE plpgsql
AS $$
DECLARE
    v_jobid bigint;
BEGIN
    SELECT jobid INTO v_jobid FROM cron.job WHERE jobname = p_jobname;
    
    IF FOUND THEN
        UPDATE cron.job
           SET schedule = p_schedule,
               command = p_command,
               active = true
         WHERE jobid = v_jobid;
        RETURN v_jobid;
    ELSE
        INSERT INTO cron.job (jobname, schedule, command, nodename, nodeport, database, username)
        VALUES (p_jobname, p_schedule, p_command, 'localhost', 5432, current_database(), current_user)
        RETURNING jobid INTO v_jobid;
        RETURN v_jobid;
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION cron.unschedule(p_jobname text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE cron.job SET active = false WHERE jobname = p_jobname;
END;
$$;

CREATE OR REPLACE FUNCTION cron.job_is_scheduled(p_jobname text)
RETURNS bool
LANGUAGE plpgsql
AS $$
DECLARE
    v_active bool;
BEGIN
    SELECT active INTO v_active FROM cron.job WHERE jobname = p_jobname;
    RETURN v_active;
END;
$$;

CREATE OR REPLACE FUNCTION cron.job_get_id(p_jobname text)
RETURNS bigint
LANGUAGE plpgsql
AS $$
DECLARE
    v_jobid bigint;
BEGIN
    SELECT jobid INTO v_jobid FROM cron.job WHERE jobname = p_jobname;
    RETURN v_jobid;
END;
$$;

CREATE OR REPLACE FUNCTION cron.job_get_next_run_time(p_jobid bigint)
RETURNS timestamptz
LANGUAGE plpgsql
AS $$
DECLARE
    v_next_run timestamptz;
BEGIN
    SELECT next_run INTO v_next_run FROM cron.job WHERE jobid = p_jobid;
    RETURN v_next_run;
END;
$$;

CREATE OR REPLACE FUNCTION cron.job_get_last_run_time(p_jobid bigint)
RETURNS timestamptz
LANGUAGE plpgsql
AS $$
DECLARE
    v_last_run timestamptz;
BEGIN
    SELECT start_time INTO v_last_run FROM cron.job_run_details WHERE jobid = p_jobid ORDER BY start_time DESC LIMIT 1;
    RETURN v_last_run;
END;
$$;

-- Initialize cron jobs
SELECT cron.schedule(
    'setup_jobs',
    '@reboot',
    $$
    SELECT cron.schedule('cleanup-expired-meetings', '0 * * * *', 'SELECT agents.cleanup_expired_meetings()');
    $$
);

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA cron TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA cron TO postgres;

-- Create function to check job status
CREATE OR REPLACE FUNCTION cron.job_get_status(p_jobname text)
RETURNS TABLE (
    jobid bigint,
    last_run timestamptz,
    next_run timestamptz,
    last_status text,
    last_message text
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT j.jobid,
           (SELECT start_time FROM cron.job_run_details WHERE jobid = j.jobid ORDER BY start_time DESC LIMIT 1) as last_run,
           j.next_run,
           (SELECT status FROM cron.job_run_details WHERE jobid = j.jobid ORDER BY start_time DESC LIMIT 1) as last_status,
           (SELECT return_message FROM cron.job_run_details WHERE jobid = j.jobid ORDER BY start_time DESC LIMIT 1) as last_message
    FROM cron.job j
    WHERE j.jobname = p_jobname;
END;
$$;

-- Grant execute permission on job_get_status function
GRANT EXECUTE ON FUNCTION cron.job_get_status(text) TO postgres;

-- =====================================================
-- PART 3: AUTOMATED JOB SCHEDULER
-- =====================================================

-- Create job scheduler schema
CREATE SCHEMA IF NOT EXISTS scheduler;
GRANT USAGE ON SCHEMA scheduler TO postgres;

-- Create job table with execution tracking
CREATE TABLE IF NOT EXISTS scheduler.job (
    jobid BIGSERIAL PRIMARY KEY,
    schedule TEXT NOT NULL,
    command TEXT NOT NULL,
    database TEXT NOT NULL DEFAULT current_database(),
    username TEXT NOT NULL DEFAULT CURRENT_USER,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    jobname TEXT UNIQUE,
    next_run TIMESTAMP WITH TIME ZONE,
    last_run TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create job_run_details table
CREATE TABLE IF NOT EXISTS scheduler.job_run_details (
    runid BIGSERIAL PRIMARY KEY,
    jobid BIGINT REFERENCES scheduler.job (jobid) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    status TEXT,
    return_message TEXT,
    error_message TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS job_active_idx ON scheduler.job (active);
CREATE INDEX IF NOT EXISTS job_next_run_idx ON scheduler.job (next_run);
CREATE INDEX IF NOT EXISTS job_run_details_jobid_idx ON scheduler.job_run_details (jobid);

-- Function to calculate next run time
CREATE OR REPLACE FUNCTION scheduler.calculate_next_run(p_schedule TEXT, p_last_run TIMESTAMP WITH TIME ZONE)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
DECLARE
    v_next_run TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Parse cron schedule (minute hour day month weekday)
    v_next_run := p_last_run + INTERVAL '1 minute';
    
    -- Basic cron schedule parsing (simplified for this implementation)
    -- For full cron support, consider using a more sophisticated parser
    RETURN v_next_run;
END;
$$ LANGUAGE plpgsql;

-- Function to execute a single job
CREATE OR REPLACE FUNCTION scheduler.execute_job(p_jobid BIGINT)
RETURNS void AS $$
DECLARE
    v_command TEXT;
    v_start_time TIMESTAMP WITH TIME ZONE := NOW();
    v_end_time TIMESTAMP WITH TIME ZONE;
    v_status TEXT := 'success';
    v_return_message TEXT;
    v_error_message TEXT;
BEGIN
    -- Get the job command
    SELECT command INTO v_command
    FROM scheduler.job
    WHERE jobid = p_jobid;

    BEGIN
        -- Execute the command
        EXECUTE v_command;
        
        -- Update job status
        UPDATE scheduler.job
        SET last_run = v_start_time,
            next_run = scheduler.calculate_next_run(schedule, v_start_time)
        WHERE jobid = p_jobid;
        
    EXCEPTION WHEN others THEN
        v_status := 'failed';
        v_error_message := SQLERRM;
    END;

    -- Record job execution details
    INSERT INTO scheduler.job_run_details (
        jobid,
        start_time,
        end_time,
        status,
        return_message,
        error_message
    ) VALUES (
        p_jobid,
        v_start_time,
        NOW(),
        v_status,
        v_return_message,
        v_error_message
    );
END;
$$ LANGUAGE plpgsql;

-- Function to process pending jobs
CREATE OR REPLACE FUNCTION scheduler.process_jobs()
RETURNS void AS $$
DECLARE
    v_job RECORD;
BEGIN
    -- Find jobs that are due to run
    FOR v_job IN
        SELECT jobid, command
        FROM scheduler.job
        WHERE active = true
          AND next_run <= NOW()
    LOOP
        -- Execute the job
        PERFORM scheduler.execute_job(v_job.jobid);
        
        -- Notify any listeners
        PERFORM pg_notify('job_completed', v_job.jobid::text);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to ensure a job exists
CREATE OR REPLACE FUNCTION scheduler.ensure_job(
    p_jobname TEXT,
    p_schedule TEXT,
    p_command TEXT
) RETURNS void AS $$
BEGIN
    -- Delete existing job if it exists
    DELETE FROM scheduler.job WHERE jobname = p_jobname;
    
    -- Insert new job
    INSERT INTO scheduler.job (
        jobname,
        schedule,
        command,
        next_run,
        last_run
    ) VALUES (
        p_jobname,
        p_schedule,
        p_command,
        NOW(),
        NULL
    );
END;
$$ LANGUAGE plpgsql;

-- Function to set up all required jobs
CREATE OR REPLACE FUNCTION scheduler.setup_jobs() RETURNS void AS $$
BEGIN
    -- Trial status management
    PERFORM scheduler.ensure_job(
        'check-trial-status',
        '0 0 * * *',  -- Daily at midnight
        'CALL agents.manage_trial_status();'
    );

    -- Daily message sending
    PERFORM scheduler.ensure_job(
        'daily-send-messages',
        '0 5 * * *',  -- Daily at 5 AM
        'SELECT agents.daily_send_messages();'
    );

    -- Usage reset
    PERFORM scheduler.ensure_job(
        'daily-reset-usage',
        '0 0 * * *',  -- Daily at midnight
        'SELECT agents.daily_reset_usage();'
    );

    -- Monthly usage reset
    PERFORM scheduler.ensure_job(
        'monthly-reset-usage',
        '0 0 1 * *',  -- First day of each month at midnight
        'SELECT agents.reset_monthly_usage();'
    );

    -- Backup logging
    PERFORM scheduler.ensure_job(
        'log-daily-backup',
        '0 2 * * *',  -- Daily at 2 AM
        'SELECT recovery.create_backup(''scheduled'');'
    );

    -- Cleanup jobs
    PERFORM scheduler.ensure_job(
        'cleanup-expired-invitations',
        '0 0 * * *',  -- Daily at midnight
        'SELECT agents.cleanup_expired_invitations(7);'
    );

    PERFORM scheduler.ensure_job(
        'cleanup-old-sent-messages',
        '0 3 * * *',  -- Daily at 3 AM
        'SELECT agents.cleanup_old_sent_messages(30);'
    );

    -- Prayer reminders
    PERFORM scheduler.ensure_job(
        'process-prayer-reminders',
        '* * * * *',  -- Every minute
        'SELECT agents.process_prayer_reminders();'
    );

    -- Stripe sync
    PERFORM scheduler.ensure_job(
        'sync-stripe-subscriptions',
        '*/10 * * * *',  -- Every 10 minutes
        'CALL agents.sync_stripe_subscriptions();'
    );

    -- Add Zoom meeting cleanup job
    PERFORM scheduler.ensure_job(
        'check-expired-zoom-meetings',
        '*/15 * * * *',  -- Every 15 minutes
        'SELECT agents.check_and_delete_expired_zoom_meetings();'
    );
END;
$$ LANGUAGE plpgsql;

-- Create a background worker to process jobs
CREATE OR REPLACE FUNCTION scheduler.start_worker()
RETURNS void AS $$
BEGIN
    -- This would be implemented as a separate background process
    -- that calls scheduler.process_jobs() on a regular interval
    RAISE NOTICE 'Background worker should be implemented as a separate process';
END;
$$ LANGUAGE plpgsql;

-- Run the setup immediately
SELECT scheduler.setup_jobs();

-- Grant necessary permissions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA scheduler TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA scheduler TO postgres;

-- Create a function to refresh jobs if needed
CREATE OR REPLACE FUNCTION scheduler.refresh_jobs()
RETURNS void AS $$
BEGIN
    -- Deactivate all existing jobs first
    UPDATE scheduler.job SET active = false;
    
    -- Set up jobs again
    PERFORM scheduler.setup_jobs();
    
    -- Log the refresh
    INSERT INTO auth.audit_log_entries (
        id,
        payload
    ) VALUES (
        gen_random_uuid(),
        jsonb_build_object(
            'action', 'refresh_jobs',
            'timestamp', now()
        )
    );
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission on refresh function
GRANT EXECUTE ON FUNCTION scheduler.refresh_jobs TO postgres;

-- Add unique constraint for agents_group name
ALTER TABLE agents.agents_group
  ADD CONSTRAINT agents_group_name_unique UNIQUE (name);

-- Create function to check if group name exists
CREATE OR REPLACE FUNCTION agents.check_group_name_exists(p_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM agents.agents_group 
        WHERE LOWER(name) = LOWER(p_name)
    );
END;
$$;

-- Grant execute permission on check_group_name_exists function
GRANT EXECUTE ON FUNCTION agents.check_group_name_exists(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION agents.check_group_name_exists(TEXT) TO service_role;
