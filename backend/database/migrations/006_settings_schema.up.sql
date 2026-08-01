-- 006_settings_schema.up.sql

-- 1. Create application_settings table
CREATE TABLE IF NOT EXISTS application_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'general',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_app_settings_key ON application_settings(setting_key);

-- 2. Create system_preferences table (user overrides)
CREATE TABLE IF NOT EXISTS system_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  theme VARCHAR(20) NOT NULL DEFAULT 'dark',
  language VARCHAR(10) NOT NULL DEFAULT 'en',
  landing_page VARCHAR(50) NOT NULL DEFAULT '/dashboard',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 3. Create backup_history table
CREATE TABLE IF NOT EXISTS backup_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename VARCHAR(255) NOT NULL UNIQUE,
  file_size BIGINT NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'SUCCESS', -- SUCCESS, FAILED
  error_details TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_backup_history_created ON backup_history(created_at DESC);

-- Trigger to automatically create preferences profile on user signup
CREATE OR REPLACE FUNCTION create_user_system_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO system_preferences (user_id) VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trigger_user_system_preferences_signup
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION create_user_system_preferences();

-- Seed user preferences for existing users
INSERT INTO system_preferences (user_id)
SELECT id FROM users
ON CONFLICT (user_id) DO NOTHING;

-- Seed default application settings
INSERT INTO application_settings (setting_key, setting_value, category) VALUES
  ('appName', 'HomeoVault', 'general'),
  ('appLogo', '/assets/logo.png', 'general'),
  ('appIcon', '/favicon.ico', 'general'),
  ('familyName', 'Hahnemann Homeopathic Family', 'general'),
  ('defaultTheme', 'dark', 'general'),
  ('language', 'en', 'general'),
  ('timeZone', 'UTC', 'general'),
  ('dateFormat', 'YYYY-MM-DD', 'general'),
  ('currency', 'USD', 'general'),
  ('defaultLocation', 'Home Cabinet', 'inventory'),
  ('defaultLowStockThreshold', '5', 'inventory'),
  ('dashboardShowCharts', 'true', 'dashboard'),
  ('dashboardQuickActions', 'true', 'dashboard')
ON CONFLICT (setting_key) DO NOTHING;
