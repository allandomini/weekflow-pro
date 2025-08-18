-- Add activities and routines tables
-- This migration adds the missing tables that are referenced in the code

-- Activities table for tracking user actions
CREATE TABLE public.activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity JSONB,
  meta JSONB,
  at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Routines table for managing daily routines
CREATE TABLE public.routines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  times_per_day INTEGER NOT NULL DEFAULT 1,
  schedule JSONB NOT NULL DEFAULT '{}',
  active_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  active_to TIMESTAMP WITH TIME ZONE,
  paused_until TIMESTAMP WITH TIME ZONE,
  exceptions JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;

-- Routine completions table for tracking daily completions
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

ALTER TABLE public.routine_completions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for activities
CREATE POLICY "Users can view their own activities" ON public.activities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own activities" ON public.activities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own activities" ON public.activities FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for routines
CREATE POLICY "Users can view their own routines" ON public.routines FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own routines" ON public.routines FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own routines" ON public.routines FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own routines" ON public.routines FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for routine completions
CREATE POLICY "Users can view their own routine completions" ON public.routine_completions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own routine completions" ON public.routine_completions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own routine completions" ON public.routine_completions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own routine completions" ON public.routine_completions FOR DELETE USING (auth.uid() = user_id);

-- Add triggers for updated_at columns
CREATE TRIGGER update_routines_updated_at
  BEFORE UPDATE ON public.routines
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_routine_completions_updated_at
  BEFORE UPDATE ON public.routine_completions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX idx_activities_user_id ON public.activities(user_id);
CREATE INDEX idx_activities_at ON public.activities(at);
CREATE INDEX idx_routines_user_id ON public.routines(user_id);
CREATE INDEX idx_routines_active_from ON public.routines(active_from);
CREATE INDEX idx_routine_completions_user_routine_date ON public.routine_completions(user_id, routine_id, date);
