-- Phase 3 UP Migration
-- Alters users table, creates user_sessions and password_reset_tokens tables

-- 1. Ensure Administrator role exists
INSERT INTO roles (name, description)
VALUES ('Administrator', 'System administrator with full access privileges.')
ON CONFLICT (name) DO NOTHING;

-- 2. Modify Users Table
ALTER TABLE users RENAME COLUMN active TO is_active;
ALTER TABLE users ADD COLUMN IF NOT EXISTS mobile VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS login_attempts INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP WITH TIME ZONE;

-- 3. Create User Sessions Table
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jwt_id VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    login_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    logout_time TIMESTAMP WITH TIME ZONE,
    ip_address VARCHAR(45),
    browser VARCHAR(255),
    operating_system VARCHAR(255),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_jwt_id ON user_sessions(jwt_id);

-- 4. Create Password Reset Tokens Table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_used BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pwd_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_pwd_reset_tokens_user_id ON password_reset_tokens(user_id);
