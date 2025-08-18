-- Optimize routines table performance
-- This migration adds performance improvements to the routines system

-- Add composite indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_routines_user_active ON public.routines(user_id, active_from, active_to) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_routines_user_priority ON public.routines(user_id, priority) 
WHERE deleted_at IS NULL;

-- Add partial index for active routines only
CREATE INDEX IF NOT EXISTS idx_routines_active_only ON public.routines(user_id, active_from) 
WHERE deleted_at IS NULL AND active_to IS NULL;

-- Optimize the schedule column with GIN index for JSON queries
CREATE INDEX IF NOT EXISTS idx_routines_schedule_gin ON public.routines USING GIN (schedule) 
WHERE deleted_at IS NULL;

-- Add index for exceptions column
CREATE INDEX IF NOT EXISTS idx_routines_exceptions_gin ON public.routines USING GIN (exceptions) 
WHERE deleted_at IS NULL;

-- Optimize routine_completions table
CREATE INDEX IF NOT EXISTS idx_routine_completions_user_date ON public.routine_completions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_routine_completions_routine_date ON public.routine_completions(routine_id, date);

-- Add composite index for routine completions queries
CREATE INDEX IF NOT EXISTS idx_routine_completions_user_routine_date ON public.routine_completions(user_id, routine_id, date);

-- Optimize the update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if the row actually changed
  IF OLD.* IS DISTINCT FROM NEW.* THEN
    NEW.updated_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add statistics for better query planning
ANALYZE public.routines;
ANALYZE public.routine_completions;
ANALYZE public.routine_exceptions;
ANALYZE public.routine_bulk_operations;

-- Create a materialized view for routine statistics (optional, for complex queries)
CREATE MATERIALIZED VIEW IF NOT EXISTS routine_stats AS
SELECT 
  r.id as routine_id,
  r.user_id,
  r.name,
  r.times_per_day,
  COUNT(rc.id) as total_completions,
  COUNT(DISTINCT rc.date) as days_with_completions,
  AVG(rc.count) as avg_completions_per_day
FROM public.routines r
LEFT JOIN public.routine_completions rc ON r.id = rc.routine_id
WHERE r.deleted_at IS NULL
GROUP BY r.id, r.user_id, r.name, r.times_per_day;

-- Create index on the materialized view
CREATE INDEX IF NOT EXISTS idx_routine_stats_user ON routine_stats(user_id);

-- Grant permissions
GRANT SELECT ON routine_stats TO authenticated;

-- Add comments for documentation
COMMENT ON INDEX idx_routines_user_active IS 'Optimized index for querying active routines by user';
COMMENT ON INDEX idx_routines_user_priority IS 'Index for filtering routines by priority';
COMMENT ON INDEX idx_routines_active_only IS 'Index for routines without end date';
COMMENT ON INDEX idx_routines_schedule_gin IS 'GIN index for JSON schedule queries';
COMMENT ON INDEX idx_routines_exceptions_gin IS 'GIN index for JSON exceptions queries';
