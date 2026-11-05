-- Helix Staging Database Initialization
-- PostgreSQL 16 with UUID support and proper roles

-- Create the staging database
DROP DATABASE IF EXISTS helix_staging;
CREATE DATABASE helix_staging;

\c helix_staging

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Schema Owner / Migration Role (Runs DDL only)
DROP USER IF EXISTS helix_migrator;
CREATE USER helix_migrator WITH PASSWORD 'helix_migrator_pass_2026';
GRANT CONNECT ON DATABASE helix_staging TO helix_migrator;
GRANT ALL ON SCHEMA public TO helix_migrator;

-- 2. Runtime Application User (Runs DML, NO DDL)
DROP USER IF EXISTS helix_app;
CREATE USER helix_app WITH PASSWORD 'helix_dev_password_2026';
GRANT CONNECT ON DATABASE helix_staging TO helix_app;
GRANT USAGE ON SCHEMA public TO helix_app;

-- 3. Backup User (Read-only for dumps)
DROP USER IF EXISTS helix_backup;
CREATE USER helix_backup WITH PASSWORD 'helix_backup_pass_2026';
GRANT CONNECT ON DATABASE helix_staging TO helix_backup;
GRANT USAGE ON SCHEMA public TO helix_backup;

-- 4. Reporting User (De-identified views only)
DROP USER IF EXISTS helix_readonly;
CREATE USER helix_readonly WITH PASSWORD 'helix_readonly_pass_2026';
GRANT CONNECT ON DATABASE helix_staging TO helix_readonly;
GRANT USAGE ON SCHEMA public TO helix_readonly;

-- Revoke dangerous permissions
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
