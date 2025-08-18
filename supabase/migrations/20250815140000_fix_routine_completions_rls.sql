-- Fix RLS policies for routine_completions table
-- This migration ensures proper access to routine_completions

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own routine completions" ON public.routine_completions;
DROP POLICY IF EXISTS "Users can create their own routine completions" ON public.routine_completions;
DROP POLICY IF EXISTS "Users can update their own routine completions" ON public.routine_completions;
DROP POLICY IF EXISTS "Users can delete their own routine completions" ON public.routine_completions;

-- Recreate policies with more permissive SELECT policy
CREATE POLICY "Users can view their own routine completions" ON public.routine_completions 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own routine completions" ON public.routine_completions 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own routine completions" ON public.routine_completions 
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own routine completions" ON public.routine_completions 
FOR DELETE USING (auth.uid() = user_id);

-- Ensure proper permissions
GRANT ALL ON public.routine_completions TO authenticated;
GRANT ALL ON public.routine_completions TO service_role;

-- Verify table structure
DO $$
BEGIN
    -- Check if the table exists and has the correct structure
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'routine_completions'
    ) THEN
        RAISE EXCEPTION 'routine_completions table does not exist';
    END IF;
    
    -- Check if the count column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'routine_completions' 
        AND column_name = 'count'
    ) THEN
        RAISE EXCEPTION 'count column does not exist in routine_completions table';
    END IF;
    
    RAISE NOTICE 'routine_completions table structure verified successfully';
END $$;
