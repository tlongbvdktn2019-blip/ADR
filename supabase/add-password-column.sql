-- Add password column to users table for password management
-- This migration adds hashed password support to replace hardcoded passwords

-- Add password column to users table
ALTER TABLE users ADD COLUMN password_hash VARCHAR(255);

-- Add password reset token column for reset functionality
ALTER TABLE users ADD COLUMN reset_token VARCHAR(255);
ALTER TABLE users ADD COLUMN reset_token_expires TIMESTAMP WITH TIME ZONE;

-- Add password updated timestamp
ALTER TABLE users ADD COLUMN password_updated_at TIMESTAMP WITH TIME ZONE;

-- Create index for reset token lookups
CREATE INDEX idx_users_reset_token ON users(reset_token) WHERE reset_token IS NOT NULL;

-- Update existing users with default hashed passwords
-- Default password for admin: admin123
-- Default password for user: user123
-- These are bcrypt hashed versions of the passwords

-- For admin users (password: admin123)
UPDATE users 
SET password_hash = '$2b$10$4wRtKbpPSlem3neTeZVJGuM.lpMQxCQfwgpaDbb5NmqeEakJQsx02',
    password_updated_at = timezone('utc', now())
WHERE role = 'admin';

-- For regular users (password: user123)  
UPDATE users 
SET password_hash = '$2b$10$mlXP/7so99h3sMVixInOR.VBoq5neNEEarmQs.0teNE/kVjwu8q2S',
    password_updated_at = timezone('utc', now())
WHERE role = 'user';

-- Add RLS policies for password management
-- Users can update their own password
CREATE POLICY "Users can update their own password" ON users
    FOR UPDATE USING (auth.uid()::text = id::text)
    WITH CHECK (auth.uid()::text = id::text);

-- Admins can reset passwords for any user
CREATE POLICY "Admins can reset user passwords" ON users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id::text = auth.uid()::text AND role = 'admin'
        )
    );

-- Add trigger to update password_updated_at when password changes
CREATE OR REPLACE FUNCTION update_password_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.password_hash IS DISTINCT FROM NEW.password_hash THEN
        NEW.password_updated_at = timezone('utc', now());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_password_timestamp
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_password_timestamp();

-- Add comments for documentation
COMMENT ON COLUMN users.password_hash IS 'Bcrypt hashed password';
COMMENT ON COLUMN users.reset_token IS 'Token for password reset functionality';
COMMENT ON COLUMN users.reset_token_expires IS 'Expiration time for reset token';
COMMENT ON COLUMN users.password_updated_at IS 'Timestamp when password was last updated';
