-- User Preferences Enhancement Migration
-- Add enhanced preference tracking and notification settings

-- Create user_preference_categories table for better organization
CREATE TABLE user_preference_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create enhanced user_preferences table
CREATE TABLE user_preferences_enhanced (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES user_preference_categories(id),
    preference_key TEXT NOT NULL,
    preference_value JSONB,
    data_type TEXT CHECK (data_type IN ('string', 'number', 'boolean', 'object', 'array')),
    is_encrypted BOOLEAN DEFAULT FALSE,
    is_user_configurable BOOLEAN DEFAULT TRUE,
    validation_schema JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, category_id, preference_key)
);

-- Create notification preferences table
CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL,
    channel TEXT NOT NULL CHECK (channel IN ('email', 'push', 'sms', 'in_app')),
    is_enabled BOOLEAN DEFAULT TRUE,
    frequency TEXT DEFAULT 'immediate' CHECK (frequency IN ('immediate', 'hourly', 'daily', 'weekly', 'monthly')),
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    timezone TEXT DEFAULT 'UTC',
    custom_settings JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, notification_type, channel)
);

-- Insert default preference categories
INSERT INTO user_preference_categories (name, description, icon, display_order) VALUES
('appearance', 'Theme, layout, and visual preferences', 'palette', 1),
('notifications', 'Notification and communication settings', 'bell', 2),
('privacy', 'Privacy and data sharing preferences', 'shield', 3),
('accessibility', 'Accessibility and usability options', 'accessibility', 4),
('performance', 'Performance and efficiency settings', 'lightning', 5);

-- Create indexes for performance
CREATE INDEX idx_user_preferences_enhanced_user_id ON user_preferences_enhanced(user_id);
CREATE INDEX idx_user_preferences_enhanced_category ON user_preferences_enhanced(category_id);
CREATE INDEX idx_user_preferences_enhanced_key ON user_preferences_enhanced(preference_key);
CREATE INDEX idx_notification_preferences_user_id ON notification_preferences(user_id);
CREATE INDEX idx_notification_preferences_type ON notification_preferences(notification_type);
CREATE INDEX idx_notification_preferences_enabled ON notification_preferences(is_enabled) WHERE is_enabled = TRUE;

-- Add RLS policies
ALTER TABLE user_preference_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences_enhanced ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Categories are readable by all authenticated users
CREATE POLICY "Categories are readable by authenticated users" ON user_preference_categories
    FOR SELECT TO authenticated USING (is_active = TRUE);

-- Users can manage their own preferences
CREATE POLICY "Users can view their own preferences" ON user_preferences_enhanced
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" ON user_preferences_enhanced
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON user_preferences_enhanced
    FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own preferences" ON user_preferences_enhanced
    FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Users can manage their own notification preferences
CREATE POLICY "Users can view their own notification preferences" ON notification_preferences
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification preferences" ON notification_preferences
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification preferences" ON notification_preferences
    FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notification preferences" ON notification_preferences
    FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at columns
CREATE TRIGGER update_user_preference_categories_updated_at 
    BEFORE UPDATE ON user_preference_categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_enhanced_updated_at 
    BEFORE UPDATE ON user_preferences_enhanced 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at 
    BEFORE UPDATE ON notification_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Migration verification queries
DO $$
BEGIN
    -- Verify tables were created
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_preference_categories') THEN
        RAISE EXCEPTION 'Migration failed: user_preference_categories table not created';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_preferences_enhanced') THEN
        RAISE EXCEPTION 'Migration failed: user_preferences_enhanced table not created';
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notification_preferences') THEN
        RAISE EXCEPTION 'Migration failed: notification_preferences table not created';
    END IF;
    
    -- Verify default data was inserted
    IF (SELECT COUNT(*) FROM user_preference_categories) = 0 THEN
        RAISE EXCEPTION 'Migration failed: no default preference categories inserted';
    END IF;
    
    RAISE NOTICE 'Migration completed successfully: Enhanced user preferences system created';
END $$;