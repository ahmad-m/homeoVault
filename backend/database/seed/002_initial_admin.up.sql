-- Phase 3 UP Seed
-- Seeds the default Administrator account

INSERT INTO users (role_id, email, password_hash, first_name, last_name, is_active)
SELECT id, 'admin@homeovault.local', '$2b$10$LIDF0ggrggSsKxcfGt0MIe1302Cjgqnvi5cMyaXZ.qCVkZCk5wV.K', 'System', 'Administrator', true
FROM roles
WHERE name = 'Administrator'
ON CONFLICT (email) DO NOTHING;
