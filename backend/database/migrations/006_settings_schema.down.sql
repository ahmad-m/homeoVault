-- 006_settings_schema.down.sql

DROP TRIGGER IF EXISTS trigger_user_system_preferences_signup ON users;
DROP FUNCTION IF EXISTS create_user_system_preferences();

DROP TABLE IF EXISTS backup_history;
DROP TABLE IF EXISTS system_preferences;
DROP TABLE IF EXISTS application_settings;
