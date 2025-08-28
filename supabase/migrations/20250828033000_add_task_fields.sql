-- Add missing fields to tasks table
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'in_review', 'done', 'blocked')),
ADD COLUMN IF NOT EXISTS labels JSONB DEFAULT '[]'::jsonb;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_labels ON tasks USING GIN(labels);

-- Update existing tasks to have default values
UPDATE tasks SET 
  priority = 'medium' WHERE priority IS NULL,
  status = 'todo' WHERE status IS NULL,
  labels = '[]'::jsonb WHERE labels IS NULL;
