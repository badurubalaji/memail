-- Performance Optimization: Add indexes for faster queries
-- Note: refresh_tokens indexes already created in V4__Create_refresh_tokens_table.sql
-- Note: labels and message_labels indexes already created in V3__Create_labels_tables.sql

-- Index on user_credentials email for faster lookups during auth
CREATE INDEX IF NOT EXISTS idx_user_credentials_email ON user_credentials(email);

-- Comment on indexes
COMMENT ON INDEX idx_user_credentials_email IS 'Fast email lookup during authentication';
