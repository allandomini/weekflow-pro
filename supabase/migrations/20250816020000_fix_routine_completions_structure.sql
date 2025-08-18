-- Fix routine_completions table structure
-- This migration ensures the table structure matches the expected schema

-- Drop and recreate the routine_completions table with the correct structure
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

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own routine completions" ON public.routine_completions;
DROP POLICY IF EXISTS "Users can create their own routine completions" ON public.routine_completions;
DROP POLICY IF EXISTS "Users can update their own routine completions" ON public.routine_completions;
DROP POLICY IF EXISTS "Users can delete their own routine completions" ON public.routine_completions;

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
DROP TRIGGER IF EXISTS update_routine_completions_updated_at ON public.routine_completions;
CREATE TRIGGER update_routine_completions_updated_at
    BEFORE UPDATE ON public.routine_completions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_routine_completions_user_id ON public.routine_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_routine_completions_routine_id ON public.routine_completions(routine_id);
CREATE INDEX IF NOT EXISTS idx_routine_completions_date ON public.routine_completions(date);
CREATE INDEX IF NOT EXISTS idx_routine_completions_user_routine_date ON public.routine_completions(user_id, routine_id, date);

-- Grant necessary permissions
GRANT ALL ON public.routine_completions TO authenticated;
GRANT ALL ON public.routine_completions TO service_role;

-- Verify the table structure
DO $$
BEGIN
    -- Check if all required columns exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'routine_completions' 
        AND column_name = 'specific_time'
    ) THEN
        RAISE EXCEPTION 'specific_time column does not exist in routine_completions table';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'routine_completions' 
        AND column_name = 'completed_at'
    ) THEN
        RAISE EXCEPTION 'completed_at column does not exist in routine_completions table';
    END IF;
    
    RAISE NOTICE 'routine_completions table structure verified successfully';
END $$;
