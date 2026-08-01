-- Phase 3 DOWN Migration
-- Reverts Phase 3 changes, drops user_sessions and password_reset_tokens

DROP TABLE IF EXISTS password_reset_tokens CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;

-- Revert User modifications
ALTER TABLE users DROP COLUMN IF EXISTS locked_until;
ALTER TABLE users DROP COLUMN IF EXISTS login_attempts;
ALTER TABLE users DROP COLUMN IF EXISTS last_login;
ALTER TABLE users DROP COLUMN IF EXISTS profile_image;
ALTER TABLE users DROP COLUMN IF EXISTS mobile;
ALTER TABLE users RENAME COLUMN is_active TO active;

-- Remove Administrator role if not referenced elsewhere (safe cleanup)
DELETE FROM roles WHERE name = 'Administrator';
