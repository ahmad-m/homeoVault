-- Phase 2 Initial Seed Script (DOWN)
-- Rollback: Clears Admin Role, Family Member Role, and Application Settings

DELETE FROM settings WHERE key IN ('app_name', 'expiration_warning_days', 'low_stock_threshold');
DELETE FROM roles WHERE name IN ('Admin', 'Family Member');
