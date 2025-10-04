-- Create user_credentials table for storing encrypted IMAP passwords
-- This allows server restarts without losing user sessions

CREATE TABLE user_credentials (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    encrypted_password VARCHAR(500) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_connection_at TIMESTAMP
);

-- Create index on email for faster lookups
CREATE INDEX idx_user_credentials_email ON user_credentials(email);

-- Add comment to table
COMMENT ON TABLE user_credentials IS 'Stores encrypted IMAP credentials for persistent user sessions across server restarts';
COMMENT ON COLUMN user_credentials.encrypted_password IS 'AES-256 encrypted IMAP password for secure storage';
