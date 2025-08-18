-- Final optimization for routines system performance
-- This migration adds comprehensive indexing and query optimizations

-- Drop existing indexes that might be redundant
DROP INDEX IF EXISTS idx_routine_completions_user_id;
DROP INDEX IF EXISTS idx_routine_completions_routine_id;
DROP INDEX IF EXISTS idx_routine_completions_date;

-- Create optimized composite indexes for routine_completions
CREATE INDEX IF NOT EXISTS idx_routine_completions_user_date 
ON public.routine_completions(user_id, date) 
INCLUDE (routine_id, count, goal, skipped, paused);

CREATE INDEX IF NOT EXISTS idx_routine_completions_user_routine_date 
ON public.routine_completions(user_id, routine_id, date) 
INCLUDE (count, goal, skipped, paused, specific_time, completed_at);

-- Create partial indexes for active routines only
CREATE INDEX IF NOT EXISTS idx_routines_active_only 
ON public.routines(user_id, active_from, active_to) 
WHERE deleted_at IS NULL;

-- Create index for routine exceptions
CREATE INDEX IF NOT EXISTS idx_routine_exceptions_user_routine_date 
ON public.routine_exceptions(user_id, routine_id, date);

-- Optimize the routine_completions table structure
ALTER TABLE public.routine_completions 
ALTER COLUMN count SET DEFAULT 0,
ALTER COLUMN goal SET DEFAULT 1,
ALTER COLUMN skipped SET DEFAULT false,
ALTER COLUMN paused SET DEFAULT false;

-- Add constraint to ensure count doesn't exceed goal
ALTER TABLE public.routine_completions 
ADD CONSTRAINT check_count_not_exceed_goal 
CHECK (count <= goal);

-- Create a function to efficiently get routine progress
CREATE OR REPLACE FUNCTION get_routine_progress(
  p_user_id UUID,
  p_routine_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  count INTEGER,
  goal INTEGER,
  skipped BOOLEAN,
  paused BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(rc.count, 0) as count,
    COALESCE(rc.goal, r.times_per_day) as goal,
    COALESCE(rc.skipped, false) as skipped,
    COALESCE(rc.paused, false) as paused
  FROM public.routines r
  LEFT JOIN public.routine_completions rc 
    ON rc.routine_id = r.id 
    AND rc.user_id = p_user_id 
    AND rc.date = p_date
  WHERE r.id = p_routine_id 
    AND r.user_id = p_user_id
    AND r.deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to efficiently complete a routine
CREATE OR REPLACE FUNCTION complete_routine_once(
  p_user_id UUID,
  p_routine_id UUID,
  p_date DATE DEFAULT CURRENT_DATE,
  p_specific_time TEXT DEFAULT NULL
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  new_count INTEGER
) AS $$
DECLARE
  v_routine RECORD;
  v_completion RECORD;
  v_goal INTEGER;
  v_current_count INTEGER;
BEGIN
  -- Get routine information
  SELECT * INTO v_routine
  FROM public.routines
  WHERE id = p_routine_id 
    AND user_id = p_user_id 
    AND deleted_at IS NULL;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Routine not found'::TEXT, 0;
    RETURN;
  END IF;
  
  -- Check if routine is paused
  IF v_routine.paused_until IS NOT NULL AND v_routine.paused_until >= p_date THEN
    RETURN QUERY SELECT false, 'Routine is paused on this date'::TEXT, 0;
    RETURN;
  END IF;
  
  -- Check exceptions for skip
  IF v_routine.exceptions IS NOT NULL AND v_routine.exceptions ? p_date::TEXT THEN
    IF (v_routine.exceptions->p_date::TEXT->>'skip')::BOOLEAN THEN
      RETURN QUERY SELECT false, 'Routine is skipped on this date'::TEXT, 0;
      RETURN;
    END IF;
  END IF;
  
  -- Get goal for this date
  IF v_routine.exceptions IS NOT NULL AND v_routine.exceptions ? p_date::TEXT THEN
    v_goal := COALESCE((v_routine.exceptions->p_date::TEXT->>'overrideTimesPerDay')::INTEGER, v_routine.times_per_day);
  ELSE
    v_goal := v_routine.times_per_day;
  END IF;
  
  -- Get current completion
  SELECT * INTO v_completion
  FROM public.routine_completions
  WHERE user_id = p_user_id 
    AND routine_id = p_routine_id 
    AND date = p_date;
  
  v_current_count := COALESCE(v_completion.count, 0);
  
  -- Check if already completed
  IF v_current_count >= v_goal THEN
    RETURN QUERY SELECT false, 'Routine already completed for this date'::TEXT, v_current_count;
    RETURN;
  END IF;
  
  -- Insert or update completion
  INSERT INTO public.routine_completions (
    user_id, routine_id, date, count, goal, skipped, paused, 
    specific_time, completed_at, updated_at
  ) VALUES (
    p_user_id, p_routine_id, p_date, v_current_count + 1, v_goal, 
    false, false, p_specific_time, NOW(), NOW()
  )
  ON CONFLICT (user_id, routine_id, date)
  DO UPDATE SET
    count = EXCLUDED.count,
    goal = EXCLUDED.goal,
    specific_time = COALESCE(EXCLUDED.specific_time, routine_completions.specific_time),
    completed_at = EXCLUDED.completed_at,
    updated_at = EXCLUDED.updated_at;
  
  RETURN QUERY SELECT true, 'Routine completed successfully'::TEXT, v_current_count + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_routine_progress(UUID, UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_routine_once(UUID, UUID, DATE, TEXT) TO authenticated;

-- Create a materialized view for routine statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS routine_stats AS
SELECT 
  user_id,
  routine_id,
  COUNT(*) as total_completions,
  COUNT(DISTINCT date) as days_with_completions,
  AVG(count) as avg_completions_per_day,
  MAX(count) as max_completions_in_day,
  MIN(date) as first_completion_date,
  MAX(date) as last_completion_date
FROM public.routine_completions
WHERE skipped = false AND paused = false
GROUP BY user_id, routine_id;

-- Create index on the materialized view
CREATE INDEX IF NOT EXISTS idx_routine_stats_user_routine 
ON routine_stats(user_id, routine_id);

-- Create a function to refresh routine stats
CREATE OR REPLACE FUNCTION refresh_routine_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW routine_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT ON routine_stats TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_routine_stats() TO authenticated;

-- Create a trigger to automatically refresh stats when completions change
CREATE OR REPLACE FUNCTION trigger_refresh_routine_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Schedule a refresh (in a real implementation, you might want to use a job queue)
  PERFORM pg_notify('refresh_routine_stats', '');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_routine_completions_stats
  AFTER INSERT OR UPDATE OR DELETE ON public.routine_completions
  FOR EACH ROW EXECUTE FUNCTION trigger_refresh_routine_stats();

-- Add comments for documentation
COMMENT ON FUNCTION get_routine_progress(UUID, UUID, DATE) IS 'Get routine progress for a specific date';
COMMENT ON FUNCTION complete_routine_once(UUID, UUID, DATE, TEXT) IS 'Complete a routine once for a specific date';
COMMENT ON MATERIALIZED VIEW routine_stats IS 'Materialized view for routine completion statistics';
COMMENT ON FUNCTION refresh_routine_stats() IS 'Refresh the routine statistics materialized view';
