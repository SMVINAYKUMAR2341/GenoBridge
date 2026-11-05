-- Grant migration permissions to helix_app for initial schema creation
-- In production, migrations should run with helix_migrator role

\c helix_staging

-- Temporarily grant CREATE privilege for migration
GRANT CREATE ON SCHEMA public TO helix_app;

-- Grant ALL on all tables and sequences (needed for migration)
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO helix_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO helix_app;
