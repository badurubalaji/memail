-- Add role and enabled status to user_credentials table for admin functionality

ALTER TABLE user_credentials
ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'USER',
ADD COLUMN enabled BOOLEAN NOT NULL DEFAULT true;

-- Create index on role for faster queries
CREATE INDEX idx_user_credentials_role ON user_credentials(role);

-- Add comments
COMMENT ON COLUMN user_credentials.role IS 'User role: USER or ADMIN';
COMMENT ON COLUMN user_credentials.enabled IS 'Whether the user account is enabled or disabled';

-- Set default admin user (admin@ashulabs.com) if exists
UPDATE user_credentials
SET role = 'ADMIN'
WHERE email = 'admin@ashulabs.com';
