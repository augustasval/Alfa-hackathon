-- Create learning_plans table
CREATE TABLE public.learning_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  session_id TEXT,
  grade TEXT NOT NULL,
  topic_id TEXT NOT NULL,
  topic_name TEXT NOT NULL,
  test_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create learning_tasks table
CREATE TABLE public.learning_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.learning_plans(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  scheduled_date DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  task_type TEXT NOT NULL CHECK (task_type IN ('theory', 'practice', 'review', 'quiz')),
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.learning_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_tasks ENABLE ROW LEVEL SECURITY;

-- Create policies for learning_plans (allow all for MVP - anonymous users)
CREATE POLICY "Allow all access to learning_plans" 
ON public.learning_plans 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create policies for learning_tasks (allow all for MVP - anonymous users)
CREATE POLICY "Allow all access to learning_tasks" 
ON public.learning_tasks 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_learning_plans_session_id ON public.learning_plans(session_id);
CREATE INDEX idx_learning_tasks_plan_id ON public.learning_tasks(plan_id);
CREATE INDEX idx_learning_tasks_scheduled_date ON public.learning_tasks(scheduled_date);