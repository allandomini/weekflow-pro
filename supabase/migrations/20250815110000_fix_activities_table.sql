-- Fix activities table structure
-- This migration ensures the activities table has the correct structure

-- Check if activities table exists and has the correct structure
DO $$ 
BEGIN
    -- Check if the 'at' column exists, if not add it
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'activities' 
        AND column_name = 'at'
    ) THEN
        -- Add the missing 'at' column
        ALTER TABLE public.activities 
        ADD COLUMN at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();
        
        -- Update existing rows to have a timestamp
        UPDATE public.activities 
        SET at = COALESCE(created_at, now()) 
        WHERE at IS NULL;
        
        -- Add index for the at column
        CREATE INDEX IF NOT EXISTS idx_activities_at ON public.activities(at);
    END IF;
    
    -- Check if other required columns exist, add them if missing
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'activities' 
        AND column_name = 'entity'
    ) THEN
        ALTER TABLE public.activities ADD COLUMN entity JSONB;
    END IF;
    
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'activities' 
        AND column_name = 'meta'
    ) THEN
        ALTER TABLE public.activities ADD COLUMN meta JSONB;
    END IF;
    
    -- Ensure RLS is enabled
    ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
    
    -- Add RLS policies if they don't exist
    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'activities' 
        AND policyname = 'Users can view their own activities'
    ) THEN
        CREATE POLICY "Users can view their own activities" ON public.activities FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'activities' 
        AND policyname = 'Users can create their own activities'
    ) THEN
        CREATE POLICY "Users can create their own activities" ON public.activities FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (
        SELECT FROM pg_policies 
        WHERE tablename = 'activities' 
        AND policyname = 'Users can delete their own activities'
    ) THEN
        CREATE POLICY "Users can delete their own activities" ON public.activities FOR DELETE USING (auth.uid() = user_id);
    END IF;
    
    -- Add index for user_id if it doesn't exist
    CREATE INDEX IF NOT EXISTS idx_activities_user_id ON public.activities(user_id);
    
END $$;
