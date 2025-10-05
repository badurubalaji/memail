-- Create password_reset_token table for password reset functionality
CREATE TABLE IF NOT EXISTS password_reset_token (
    id BIGSERIAL PRIMARY KEY,
    token VARCHAR(255) NOT NULL UNIQUE,
    user_email VARCHAR(255) NOT NULL,
    expiry_date TIMESTAMP NOT NULL,
    used BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index on token for fast lookups
CREATE INDEX IF NOT EXISTS idx_password_reset_token_token ON password_reset_token(token);

-- Index on user_email for fast user lookups
CREATE INDEX IF NOT EXISTS idx_password_reset_token_user_email ON password_reset_token(user_email);

-- Index on expiry_date for cleanup queries
CREATE INDEX IF NOT EXISTS idx_password_reset_token_expiry ON password_reset_token(expiry_date);

-- Comment on table
COMMENT ON TABLE password_reset_token IS 'Stores temporary tokens for password reset functionality';
COMMENT ON COLUMN password_reset_token.token IS 'Unique reset token sent to user email';
COMMENT ON COLUMN password_reset_token.expiry_date IS 'When the token expires (typically 30 minutes)';
COMMENT ON COLUMN password_reset_token.used IS 'Whether the token has been used';
