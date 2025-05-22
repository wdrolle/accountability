-- Create timezone table in agents schema
CREATE TABLE IF NOT EXISTS agents.tz (
    id SERIAL PRIMARY KEY,
    zone_name VARCHAR(100) NOT NULL UNIQUE,
    country_code CHAR(2),
    coordinates VARCHAR(50),
    comments TEXT,
    utc_offset INTERVAL,
    dst_offset INTERVAL,
    raw_offset INTERVAL,
    created_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'America/New_York'),
    updated_at TIMESTAMPTZ DEFAULT (now() AT TIME ZONE 'America/New_York')
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tz_zone_name ON agents.tz(zone_name);
CREATE INDEX IF NOT EXISTS idx_tz_country_code ON agents.tz(country_code);

-- Create function to get UTC offset for a timezone
CREATE OR REPLACE FUNCTION agents.get_timezone_offset(zone_name VARCHAR)
RETURNS INTERVAL AS $$
BEGIN
    RETURN (SELECT utc_offset FROM agents.tz WHERE zone_name = $1);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION agents.update_tz_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = (now() AT TIME ZONE 'America/New_York');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_tz_timestamp
    BEFORE UPDATE ON agents.tz
    FOR EACH ROW
    EXECUTE FUNCTION agents.update_tz_timestamp();

-- Create temporary table for CSV import
CREATE TEMP TABLE temp_tz (
    zone_name VARCHAR(100),
    country_code CHAR(2),
    coordinates VARCHAR(50),
    comments TEXT
);

-- Copy data from CSV file
\COPY temp_tz(zone_name, country_code, coordinates, comments) FROM 'scripts/tz_data.csv' WITH (FORMAT csv, HEADER true, DELIMITER ',');

-- Insert data from temp table to main table
INSERT INTO agents.tz (zone_name, country_code, coordinates, comments)
SELECT zone_name, country_code, coordinates, comments
FROM temp_tz
ON CONFLICT (zone_name) DO NOTHING;

-- Drop temporary table
DROP TABLE temp_tz;
