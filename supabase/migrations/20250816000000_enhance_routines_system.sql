-- Enhance routines system with advanced scheduling capabilities
-- This migration adds support for specific times, weekdays, and bulk operations

-- Add new columns to routines table
ALTER TABLE public.routines 
ADD COLUMN IF NOT EXISTS specific_times TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS weekdays INTEGER[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS duration_days INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high'));

-- Add new columns to routine_completions table
ALTER TABLE public.routine_completions 
ADD COLUMN IF NOT EXISTS specific_time TEXT,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Create a new table for routine exceptions (specific date overrides)
CREATE TABLE IF NOT EXISTS public.routine_exceptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  routine_id UUID NOT NULL REFERENCES public.routines(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('skip', 'override_times', 'override_count')),
  value JSONB, -- For override_times: ["08:00", "12:00"], for override_count: 5
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, routine_id, date)
);

-- Create a new table for routine bulk operations (for mass deletion)
CREATE TABLE IF NOT EXISTS public.routine_bulk_operations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  routine_id UUID NOT NULL REFERENCES public.routines(id) ON DELETE CASCADE,
  operation_type TEXT NOT NULL CHECK (operation_type IN ('delete_occurrences', 'skip_period')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  affected_dates DATE[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.routine_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_bulk_operations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for routine_exceptions
CREATE POLICY "Users can view their own routine exceptions" ON public.routine_exceptions 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own routine exceptions" ON public.routine_exceptions 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own routine exceptions" ON public.routine_exceptions 
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own routine exceptions" ON public.routine_exceptions 
FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for routine_bulk_operations
CREATE POLICY "Users can view their own routine bulk operations" ON public.routine_bulk_operations 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own routine bulk operations" ON public.routine_bulk_operations 
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add triggers for updated_at columns
CREATE TRIGGER update_routine_exceptions_updated_at
  BEFORE UPDATE ON public.routine_exceptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_routines_weekdays ON public.routines USING GIN (weekdays);
CREATE INDEX IF NOT EXISTS idx_routines_specific_times ON public.routines USING GIN (specific_times);
CREATE INDEX IF NOT EXISTS idx_routine_exceptions_routine_date ON public.routine_exceptions(routine_id, date);
CREATE INDEX IF NOT EXISTS idx_routine_bulk_operations_routine ON public.routine_bulk_operations(routine_id);

-- Create a function to get routine occurrences for a date range
CREATE OR REPLACE FUNCTION get_routine_occurrences(
  p_routine_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE(
  date DATE,
  times TEXT[],
  count INTEGER
) AS $$
DECLARE
  v_routine RECORD;
  v_current_date DATE;
  v_weekday INTEGER;
  v_times TEXT[];
BEGIN
  -- Get routine details
  SELECT * INTO v_routine FROM public.routines WHERE id = p_routine_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  v_current_date := p_start_date;
  
  WHILE v_current_date <= p_end_date LOOP
    -- Check if routine is active on this date
    IF v_routine.active_from::DATE <= v_current_date 
       AND (v_routine.active_to IS NULL OR v_routine.active_to::DATE >= v_current_date)
       AND (v_routine.paused_until IS NULL OR v_routine.paused_until::DATE < v_current_date) THEN
      
      -- Check weekday filter
      v_weekday := EXTRACT(DOW FROM v_current_date);
      IF array_length(v_routine.weekdays, 1) IS NULL OR v_weekday = ANY(v_routine.weekdays) THEN
        -- Check for exceptions
        IF NOT EXISTS (
          SELECT 1 FROM public.routine_exceptions 
          WHERE routine_id = p_routine_id AND date = v_current_date AND action = 'skip'
        ) THEN
          -- Get times for this day (check for overrides)
          SELECT COALESCE(
            (SELECT value FROM public.routine_exceptions 
             WHERE routine_id = p_routine_id AND date = v_current_date AND action = 'override_times'),
            v_routine.specific_times
          ) INTO v_times;
          
          -- If no specific times, use default
          IF array_length(v_times, 1) IS NULL THEN
            v_times := ARRAY['09:00']; -- Default time
          END IF;
          
          RETURN QUERY SELECT v_current_date, v_times, v_routine.times_per_day;
        END IF;
      END IF;
    END IF;
    
    v_current_date := v_current_date + INTERVAL '1 day';
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_routine_occurrences(UUID, DATE, DATE) TO authenticated;
GRANT ALL ON public.routine_exceptions TO authenticated;
GRANT ALL ON public.routine_bulk_operations TO authenticated;
