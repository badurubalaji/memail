-- Add user profile fields to user_credentials table
-- These fields allow users to maintain personal information

ALTER TABLE user_credentials
ADD COLUMN first_name VARCHAR(100),
ADD COLUMN last_name VARCHAR(100),
ADD COLUMN date_of_birth DATE,
ADD COLUMN gender VARCHAR(20),
ADD COLUMN phone VARCHAR(20),
ADD COLUMN backup_email VARCHAR(255);

-- Add index on backup_email for quick lookups
CREATE INDEX idx_user_credentials_backup_email ON user_credentials(backup_email);

-- Add comments for documentation
COMMENT ON COLUMN user_credentials.first_name IS 'User first name';
COMMENT ON COLUMN user_credentials.last_name IS 'User last name';
COMMENT ON COLUMN user_credentials.date_of_birth IS 'User date of birth';
COMMENT ON COLUMN user_credentials.gender IS 'User gender (Male/Female/Other/Prefer not to say)';
COMMENT ON COLUMN user_credentials.phone IS 'User primary contact number';
COMMENT ON COLUMN user_credentials.backup_email IS 'User backup email address for account recovery';
