-- TaskFlow Dark - Database Schema
-- APP_SLUG: app_bb61

-- Users table (for future authentication)
CREATE TABLE IF NOT EXISTS app_bb61_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    username TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks table
CREATE TABLE IF NOT EXISTS app_bb61_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    due_date TIMESTAMPTZ,
    priority INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_app_bb61_tasks_user_id ON app_bb61_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_app_bb61_tasks_is_completed ON app_bb61_tasks(is_completed);
CREATE INDEX IF NOT EXISTS idx_app_bb61_tasks_created_at ON app_bb61_tasks(created_at);

-- Enable Row Level Security
ALTER TABLE app_bb61_tasks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own tasks" ON app_bb61_tasks;
DROP POLICY IF EXISTS "Users can insert their own tasks" ON app_bb61_tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON app_bb61_tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON app_bb61_tasks;

-- Create RLS policies
CREATE POLICY "Users can view their own tasks"
    ON app_bb61_tasks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tasks"
    ON app_bb61_tasks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks"
    ON app_bb61_tasks FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks"
    ON app_bb61_tasks FOR DELETE
    USING (auth.uid() = user_id);

-- Add to realtime publication for live updates
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'app_bb61_tasks'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.app_bb61_tasks;
    END IF;
END $$;

-- Create storage bucket for task attachments (future feature)
INSERT INTO storage.buckets (id, name, public)
VALUES ('app_bb61_attachments', 'app_bb61_attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for task attachments
DROP POLICY IF EXISTS "Users can upload their own attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own attachments" ON storage.objects;

CREATE POLICY "Users can upload their own attachments"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'app_bb61_attachments' 
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can view their own attachments"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'app_bb61_attachments' 
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can update their own attachments"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'app_bb61_attachments' 
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Users can delete their own attachments"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'app_bb61_attachments' 
        AND (storage.foldername(name))[1] = auth.uid()::text
    );