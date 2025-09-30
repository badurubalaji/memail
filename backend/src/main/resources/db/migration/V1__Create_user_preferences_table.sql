-- Initial database schema for Memail application - Milestone 1

-- User preferences table
CREATE TABLE user_preferences (
    id BIGSERIAL PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL UNIQUE,
    emails_per_page INTEGER DEFAULT 50,
    theme VARCHAR(20) DEFAULT 'light',
    conversation_view BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_user_preferences_email ON user_preferences(user_email);

-- Insert some default preferences for testing
INSERT INTO user_preferences (user_email, emails_per_page, theme, conversation_view) VALUES
('test@localhost', 50, 'light', true),
('admin@localhost', 25, 'dark', true);