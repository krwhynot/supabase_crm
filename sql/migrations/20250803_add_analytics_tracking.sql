-- Test Database Migration
-- Add analytics tracking to contacts table

ALTER TABLE public.contacts
ADD COLUMN analytics_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN last_analytics_update TIMESTAMPTZ DEFAULT NOW();

-- Create index for analytics queries
CREATE INDEX idx_contacts_analytics
ON public.contacts(analytics_enabled, last_analytics_update)
WHERE analytics_enabled = TRUE;

-- Update RLS policies for analytics access
CREATE POLICY "Users can view analytics data" ON public.contacts
FOR SELECT TO authenticated
USING (analytics_enabled = TRUE AND user_has_contact_access(id));
