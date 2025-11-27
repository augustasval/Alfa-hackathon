-- Create custom_exercises table for storing user-uploaded exercises
CREATE TABLE public.custom_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  topic text NOT NULL,
  question text NOT NULL,
  difficulty text DEFAULT 'medium',
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.custom_exercises ENABLE ROW LEVEL SECURITY;

-- Users can view their own custom exercises
CREATE POLICY "Users can view their own custom exercises"
ON public.custom_exercises
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own custom exercises
CREATE POLICY "Users can insert their own custom exercises"
ON public.custom_exercises
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own custom exercises
CREATE POLICY "Users can delete their own custom exercises"
ON public.custom_exercises
FOR DELETE
USING (auth.uid() = user_id);

-- Users can update their own custom exercises
CREATE POLICY "Users can update their own custom exercises"
ON public.custom_exercises
FOR UPDATE
USING (auth.uid() = user_id);