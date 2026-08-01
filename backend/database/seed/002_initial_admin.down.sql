-- Phase 3 DOWN Seed
-- Rollback: Removes default Administrator account

DELETE FROM users WHERE email = 'admin@homeovault.local';
