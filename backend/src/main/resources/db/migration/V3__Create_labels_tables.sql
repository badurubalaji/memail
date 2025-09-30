-- Create labels table
CREATE TABLE labels (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Unique constraint: each user can only have one label with a given name
    CONSTRAINT uk_labels_user_name UNIQUE (user_id, name)
);

-- Create message_labels table (junction table for many-to-many relationship)
CREATE TABLE message_labels (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    message_uid VARCHAR(255) NOT NULL,  -- IMAP message UID
    folder VARCHAR(255) NOT NULL,       -- IMAP folder name (INBOX, SENT, etc.)
    label_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Foreign key constraint
    CONSTRAINT fk_message_labels_label FOREIGN KEY (label_id) REFERENCES labels(id) ON DELETE CASCADE,

    -- Unique constraint: prevent duplicate label assignments to the same message
    CONSTRAINT uk_message_labels_unique UNIQUE (user_id, message_uid, folder, label_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_labels_user_id ON labels(user_id);
CREATE INDEX idx_labels_name ON labels(name);
CREATE INDEX idx_message_labels_user_id ON message_labels(user_id);
CREATE INDEX idx_message_labels_label_id ON message_labels(label_id);
CREATE INDEX idx_message_labels_message_uid ON message_labels(message_uid);
CREATE INDEX idx_message_labels_folder ON message_labels(folder);