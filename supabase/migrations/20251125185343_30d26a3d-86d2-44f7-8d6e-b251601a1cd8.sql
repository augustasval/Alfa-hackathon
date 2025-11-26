-- Create task_progress table to track user progress through learning tasks
CREATE TABLE IF NOT EXISTS public.task_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.learning_tasks(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  quiz_passed BOOLEAN DEFAULT FALSE,
  exercises_completed INTEGER DEFAULT 0,
  current_phase TEXT DEFAULT 'theory',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(task_id, session_id)
);

-- Enable RLS
ALTER TABLE public.task_progress ENABLE ROW LEVEL SECURITY;

-- Allow all access (public anonymous access)
CREATE POLICY "Allow all access to task_progress"
ON public.task_progress
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_task_progress_session ON public.task_progress(session_id);
CREATE INDEX idx_task_progress_task ON public.task_progress(task_id);