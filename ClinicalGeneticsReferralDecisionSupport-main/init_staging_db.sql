-- GENOBRIDGE Staging Database Initialization
-- PostgreSQL 16 with UUID support and proper roles

-- Create the staging database
DROP DATABASE IF EXISTS genobridge_staging;
CREATE DATABASE genobridge_staging;

\c genobridge_staging

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Schema Owner / Migration Role (Runs DDL only)
DROP USER IF EXISTS genobridge_migrator;
CREATE USER genobridge_migrator WITH PASSWORD 'genobridge_migrator_pass_2026';
GRANT CONNECT ON DATABASE genobridge_staging TO genobridge_migrator;
GRANT ALL ON SCHEMA public TO genobridge_migrator;

-- 2. Runtime Application User (Runs DML, NO DDL)
DROP USER IF EXISTS genobridge_app;
CREATE USER genobridge_app WITH PASSWORD 'genobridge_dev_password_2026';
GRANT CONNECT ON DATABASE genobridge_staging TO genobridge_app;
GRANT USAGE ON SCHEMA public TO genobridge_app;

-- 3. Backup User (Read-only for dumps)
DROP USER IF EXISTS genobridge_backup;
CREATE USER genobridge_backup WITH PASSWORD 'genobridge_backup_pass_2026';
GRANT CONNECT ON DATABASE genobridge_staging TO genobridge_backup;
GRANT USAGE ON SCHEMA public TO genobridge_backup;

-- 4. Reporting User (De-identified views only)
DROP USER IF EXISTS genobridge_readonly;
CREATE USER genobridge_readonly WITH PASSWORD 'genobridge_readonly_pass_2026';
GRANT CONNECT ON DATABASE genobridge_staging TO genobridge_readonly;
GRANT USAGE ON SCHEMA public TO genobridge_readonly;

-- Revoke dangerous permissions
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
