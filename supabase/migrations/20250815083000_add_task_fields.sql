-- Add priority, status, and labels columns to tasks table
ALTER TABLE public.tasks
ADD COLUMN priority TEXT CHECK (priority IN ('low', 'medium', 'high')),
ADD COLUMN status TEXT CHECK (status IN ('todo', 'in_progress', 'in_review', 'done', 'blocked')),
ADD COLUMN labels TEXT[] DEFAULT '{}';

-- Update the updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update the updated_at column
CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update RLS policies if needed
-- Note: No need to update RLS policies as we're just adding columns to an existing table

-- Add comments for the new columns
COMMENT ON COLUMN public.tasks.priority IS 'Priority level of the task: low, medium, or high';
COMMENT ON COLUMN public.tasks.status IS 'Current status of the task: todo, in_progress, in_review, done, or blocked';
COMMENT ON COLUMN public.tasks.labels IS 'Array of labels/tags for the task';

-- Update the search index if you have one for tasks
-- This is just an example, adjust according to your actual search implementation
-- DROP INDEX IF EXISTS public.idx_tasks_search;
-- CREATE INDEX idx_tasks_search ON public.tasks USING gin(
--   to_tsvector('english', 
--     COALESCE(title, '') || ' ' || 
--     COALESCE(description, '') || ' ' ||
--     COALESCE(priority, '') || ' ' ||
--     COALESCE(status, '') || ' ' ||
--     array_to_string(COALESCE(labels, '{}'), ' ')
--   )
-- );
