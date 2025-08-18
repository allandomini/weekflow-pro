-- Verify and fix routine_completions table structure
-- This migration ensures the table is properly configured

-- First, let's check the current table structure
DO $$
DECLARE
    column_count INTEGER;
    has_specific_time BOOLEAN;
    has_completed_at BOOLEAN;
BEGIN
    -- Check if the table exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'routine_completions'
    ) THEN
        RAISE EXCEPTION 'routine_completions table does not exist';
    END IF;
    
    -- Count columns
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'routine_completions';
    
    RAISE NOTICE 'routine_completions table has % columns', column_count;
    
    -- Check for specific_time column
    SELECT EXISTS(
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'routine_completions' 
        AND column_name = 'specific_time'
    ) INTO has_specific_time;
    
    -- Check for completed_at column
    SELECT EXISTS(
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'routine_completions' 
        AND column_name = 'completed_at'
    ) INTO has_completed_at;
    
    RAISE NOTICE 'specific_time column exists: %', has_specific_time;
    RAISE NOTICE 'completed_at column exists: %', has_completed_at;
    
    -- If any column is missing, recreate the table
    IF NOT has_specific_time OR NOT has_completed_at THEN
        RAISE NOTICE 'Recreating routine_completions table with correct structure';
        
        -- Drop and recreate
        DROP TABLE IF EXISTS public.routine_completions CASCADE;
        
        CREATE TABLE public.routine_completions (
            id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            routine_id UUID NOT NULL REFERENCES public.routines(id) ON DELETE CASCADE,
            date DATE NOT NULL,
            count INTEGER NOT NULL DEFAULT 0,
            goal INTEGER NOT NULL DEFAULT 1,
            skipped BOOLEAN NOT NULL DEFAULT false,
            paused BOOLEAN NOT NULL DEFAULT false,
            specific_time TEXT,
            completed_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            UNIQUE(user_id, routine_id, date)
        );
        
        -- Enable RLS
        ALTER TABLE public.routine_completions ENABLE ROW LEVEL SECURITY;
        
        -- Create RLS policies
        CREATE POLICY "Users can view their own routine completions" ON public.routine_completions 
        FOR SELECT USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can create their own routine completions" ON public.routine_completions 
        FOR INSERT WITH CHECK (auth.uid() = user_id);
        
        CREATE POLICY "Users can update their own routine completions" ON public.routine_completions 
        FOR UPDATE USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can delete their own routine completions" ON public.routine_completions 
        FOR DELETE USING (auth.uid() = user_id);
        
        -- Create trigger for updated_at column
        CREATE TRIGGER update_routine_completions_updated_at
            BEFORE UPDATE ON public.routine_completions
            FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
        
        -- Create indexes
        CREATE INDEX idx_routine_completions_user_id ON public.routine_completions(user_id);
        CREATE INDEX idx_routine_completions_routine_id ON public.routine_completions(routine_id);
        CREATE INDEX idx_routine_completions_date ON public.routine_completions(date);
        CREATE INDEX idx_routine_completions_user_routine_date ON public.routine_completions(user_id, routine_id, date);
        
        -- Grant permissions
        GRANT ALL ON public.routine_completions TO authenticated;
        GRANT ALL ON public.routine_completions TO service_role;
        
        RAISE NOTICE 'routine_completions table recreated successfully';
    ELSE
        RAISE NOTICE 'routine_completions table structure is correct';
    END IF;
END $$;

-- Verify RLS policies are working
DO $$
BEGIN
    -- Check if policies exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'routine_completions' 
        AND schemaname = 'public'
    ) THEN
        RAISE EXCEPTION 'No RLS policies found for routine_completions table';
    END IF;
    
    RAISE NOTICE 'RLS policies verified successfully';
END $$;

-- Test a simple query to ensure the table is accessible
DO $$
BEGIN
    -- This should not throw an error if the table is properly configured
    PERFORM 1 FROM public.routine_completions LIMIT 1;
    RAISE NOTICE 'Table is accessible for queries';
END $$;
