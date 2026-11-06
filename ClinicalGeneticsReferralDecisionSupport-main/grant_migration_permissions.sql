-- Grant migration permissions to genobridge_app for initial schema creation
-- In production, migrations should run with genobridge_migrator role

\c genobridge_staging

-- Temporarily grant CREATE privilege for migration
GRANT CREATE ON SCHEMA public TO genobridge_app;

-- Grant ALL on all tables and sequences (needed for migration)
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO genobridge_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO genobridge_app;
