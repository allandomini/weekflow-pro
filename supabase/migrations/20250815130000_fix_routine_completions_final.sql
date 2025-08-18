-- Final fix for routine_completions table
-- This migration ensures all dependencies are properly created

-- First, create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop and recreate the routine_completions table with proper structure
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
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, routine_id, date)
);

-- Enable RLS
ALTER TABLE public.routine_completions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view their own routine completions" ON public.routine_completions;
DROP POLICY IF EXISTS "Users can create their own routine completions" ON public.routine_completions;
DROP POLICY IF EXISTS "Users can update their own routine completions" ON public.routine_completions;
DROP POLICY IF EXISTS "Users can delete their own routine completions" ON public.routine_completions;

CREATE POLICY "Users can view their own routine completions" ON public.routine_completions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own routine completions" ON public.routine_completions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own routine completions" ON public.routine_completions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own routine completions" ON public.routine_completions FOR DELETE USING (auth.uid() = user_id);

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
