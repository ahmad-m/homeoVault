-- Phase 2 Initial Seed Script (UP)
-- Seeds Admin Role, Family Member Role, and Application Settings

-- 1. Insert Default Roles
INSERT INTO roles (name, description) VALUES
('Admin', 'System administrator with full database write, edit, and deletion privileges.'),
('Family Member', 'Family user with permissions to view inventory and register stock in/out consumption logs.')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;

-- 2. Insert Default Application Settings
INSERT INTO settings (key, value, description) VALUES
('app_name', 'HomeoVault', 'The branding name of the application.'),
('expiration_warning_days', '60', 'Standard warning buffer window in days to alert on nearing remedy expiration dates.'),
('low_stock_threshold', '2', 'Threshold quantity level below which remedies trigger low stock warning indicators.')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, description = EXCLUDED.description;
