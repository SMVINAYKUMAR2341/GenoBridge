-- GENOBRIDGE PostgreSQL Initialization Script
-- This script runs once when the database is first created

-- Create required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create application user (if not already created by Docker)
DO
\$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'genobridge_app') THEN
    CREATE ROLE genobridge_app WITH LOGIN PASSWORD 'dev-password';
  END IF;
END
\$\$;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE genobridge TO genobridge_app;
GRANT ALL PRIVILEGES ON SCHEMA public TO genobridge_app;

-- Create read-only user for reporting
DO
\$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'genobridge_readonly') THEN
    CREATE ROLE genobridge_readonly WITH LOGIN PASSWORD 'readonly-password';
  END IF;
END
\$\$;

GRANT CONNECT ON DATABASE genobridge TO genobridge_readonly;
GRANT USAGE ON SCHEMA public TO genobridge_readonly;

-- Note: Tables will be created by Payload CMS migrations
-- This script only sets up users and extensions

-- Enable row-level security for future use
-- (Payload will create the actual tables)

COMMENT ON DATABASE genobridge IS 'GENOBRIDGE Clinical Genetics Referral Decision Support System';
