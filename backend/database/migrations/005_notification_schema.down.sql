-- 005_notification_schema.down.sql

DROP TRIGGER IF EXISTS trigger_user_preferences_signup ON users;
DROP FUNCTION IF EXISTS create_user_preferences();

DROP TABLE IF EXISTS system_logs;
DROP TABLE IF EXISTS scheduled_jobs;
DROP TABLE IF EXISTS notification_preferences;
DROP TABLE IF EXISTS notifications;
