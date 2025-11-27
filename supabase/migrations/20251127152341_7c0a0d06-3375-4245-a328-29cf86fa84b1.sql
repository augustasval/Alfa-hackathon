-- Fix CRITICAL: Public User Data Exposure
-- Drop the insecure policy that exposes all user data
DROP POLICY IF EXISTS "Users can view profiles by invite code" ON public.profiles;

-- Add a policy for parents to view their linked students' profiles
CREATE POLICY "Parents can view linked students profiles"
ON public.profiles
FOR SELECT
USING (
  id IN (
    SELECT linked_profile_id 
    FROM public.students 
    WHERE parent_id = auth.uid()
  )
);

-- Fix missing RLS policies for learning_tasks
CREATE POLICY "Users can create tasks in their own plans"
ON public.learning_tasks
FOR INSERT
WITH CHECK (
  plan_id IN (
    SELECT id FROM public.learning_plans WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete tasks from their own plans"
ON public.learning_tasks
FOR DELETE
USING (
  plan_id IN (
    SELECT id FROM public.learning_plans WHERE user_id = auth.uid()
  )
);

-- Fix missing DELETE policy for learning_plans
CREATE POLICY "Users can delete their own learning plans"
ON public.learning_plans
FOR DELETE
USING (auth.uid() = user_id);

-- Fix missing DELETE policy for task_progress
CREATE POLICY "Users can delete their own task progress"
ON public.task_progress
FOR DELETE
USING (
  task_id IN (
    SELECT t.id FROM public.learning_tasks t
    JOIN public.learning_plans p ON t.plan_id = p.id
    WHERE p.user_id = auth.uid()
  )
);

-- Fix missing UPDATE policy for mistakes
CREATE POLICY "Users can update their own mistakes"
ON public.mistakes
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add UPDATE policy for students on scheduled_sessions
CREATE POLICY "Students can update their scheduled session status"
ON public.scheduled_sessions
FOR UPDATE
USING (
  student_id IN (
    SELECT id FROM public.students WHERE linked_profile_id = auth.uid()
  )
)
WITH CHECK (
  student_id IN (
    SELECT id FROM public.students WHERE linked_profile_id = auth.uid()
  )
);

-- Add SELECT policy for students to view their own session reports
CREATE POLICY "Students can view their own session reports"
ON public.session_reports
FOR SELECT
USING (
  student_id IN (
    SELECT id FROM public.students WHERE linked_profile_id = auth.uid()
  )
);

-- Fix function search_path for all functions
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_student_invite_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.role = 'student' AND NEW.invite_code IS NULL THEN
    NEW.invite_code := upper(substring(md5(random()::text) from 1 for 8));
    NEW.invite_code_expires_at := now() + interval '30 days';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_fresh_invite_code(user_id uuid)
RETURNS TABLE(invite_code text, expires_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.profiles
  SET 
    invite_code = upper(substring(md5(random()::text) from 1 for 8)),
    invite_code_expires_at = now() + interval '30 days'
  WHERE 
    id = user_id 
    AND role = 'student'
    AND (invite_code_expires_at IS NULL OR invite_code_expires_at < now());
  
  RETURN QUERY
  SELECT 
    p.invite_code,
    p.invite_code_expires_at
  FROM public.profiles p
  WHERE p.id = user_id AND p.role = 'student';
END;
$$;