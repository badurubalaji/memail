-- Create refresh_tokens table for storing refresh tokens
CREATE TABLE refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    token VARCHAR(512) NOT NULL UNIQUE,
    user_email VARCHAR(255) NOT NULL,
    expiry_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    device_info VARCHAR(255)
);

-- Create indexes for better performance
CREATE INDEX idx_refresh_tokens_user_email ON refresh_tokens(user_email);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_expiry_date ON refresh_tokens(expiry_date);
CREATE INDEX idx_refresh_tokens_user_email_revoked ON refresh_tokens(user_email, is_revoked);

-- Add comments for documentation
COMMENT ON TABLE refresh_tokens IS 'Table for storing refresh tokens for user authentication';
COMMENT ON COLUMN refresh_tokens.token IS 'The actual refresh token string';
COMMENT ON COLUMN refresh_tokens.user_email IS 'Email of the user this token belongs to';
COMMENT ON COLUMN refresh_tokens.expiry_date IS 'When this token expires';
COMMENT ON COLUMN refresh_tokens.created_at IS 'When this token was created';
COMMENT ON COLUMN refresh_tokens.is_revoked IS 'Whether this token has been revoked';
COMMENT ON COLUMN refresh_tokens.device_info IS 'Optional device information for this token';