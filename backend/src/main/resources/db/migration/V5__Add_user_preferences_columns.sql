-- Add new columns to user_preferences table for enhanced preferences support

ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS auto_mark_read BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notification_sound BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS desktop_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS compact_view BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS preview_pane BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'en',
ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'UTC';

-- Update existing rows to have default values
UPDATE user_preferences
SET
    auto_mark_read = COALESCE(auto_mark_read, true),
    notification_sound = COALESCE(notification_sound, true),
    desktop_notifications = COALESCE(desktop_notifications, true),
    compact_view = COALESCE(compact_view, false),
    preview_pane = COALESCE(preview_pane, true),
    language = COALESCE(language, 'en'),
    timezone = COALESCE(timezone, 'UTC')
WHERE auto_mark_read IS NULL
   OR notification_sound IS NULL
   OR desktop_notifications IS NULL
   OR compact_view IS NULL
   OR preview_pane IS NULL
   OR language IS NULL
   OR timezone IS NULL;