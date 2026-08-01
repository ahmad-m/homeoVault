-- Phase 2 Initial Schema Migration (DOWN)
-- Rollback: Drops activity_logs, settings, users, and roles tables

DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE;
