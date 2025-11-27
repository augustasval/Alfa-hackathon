-- ============================================
-- COREPUS DATABASE MIGRATION SCRIPT
-- Complete schema for Solvita tutoring platform
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

-- Create app role enum
CREATE TYPE public.app_role AS ENUM ('parent', 'student');

-- ============================================
-- TABLES
-- ============================================

-- 1. Profiles table (user information)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    name TEXT,
    role TEXT NOT NULL,
    invite_code TEXT,
    invite_code_expires_at TIMESTAMP WITH TIME ZONE,
    subscription_status TEXT DEFAULT 'free',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. User roles table (separate table for role management)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role public.app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Students table (parent-student relationships)
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    grade_level INTEGER,
    linked_profile_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- 4. Mistakes table (student mistake tracking)
CREATE TABLE IF NOT EXISTS public.mistakes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('quiz', 'exercise', 'practice')),
    problem TEXT NOT NULL,
    topic TEXT NOT NULL,
    attempts INTEGER DEFAULT 1,
    user_answer TEXT,
    correct_answer TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.mistakes ENABLE ROW LEVEL SECURITY;

-- 5. Custom exercises table
CREATE TABLE IF NOT EXISTS public.custom_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    topic TEXT NOT NULL,
    question TEXT NOT NULL,
    difficulty TEXT DEFAULT 'medium',
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.custom_exercises ENABLE ROW LEVEL SECURITY;

-- 6. Learning plans table
CREATE TABLE IF NOT EXISTS public.learning_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    topic_name TEXT NOT NULL,
    grade TEXT NOT NULL,
    test_date DATE NOT NULL,
    session_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.learning_plans ENABLE ROW LEVEL SECURITY;

-- 7. Learning tasks table
CREATE TABLE IF NOT EXISTS public.learning_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES public.learning_plans(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    task_type TEXT NOT NULL,
    scheduled_date DATE NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.learning_tasks ENABLE ROW LEVEL SECURITY;

-- 8. Task progress table
CREATE TABLE IF NOT EXISTS public.task_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.learning_tasks(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL,
    current_phase TEXT DEFAULT 'theory',
    quiz_passed BOOLEAN DEFAULT FALSE,
    exercises_completed INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.task_progress ENABLE ROW LEVEL SECURITY;

-- 9. Scheduled sessions table
CREATE TABLE IF NOT EXISTS public.scheduled_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    topic TEXT,
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
    exercises_completed INTEGER DEFAULT 0,
    mistakes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.scheduled_sessions ENABLE ROW LEVEL SECURITY;

-- 10. Session reports table
CREATE TABLE IF NOT EXISTS public.session_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.scheduled_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    report_content TEXT NOT NULL,
    summary TEXT,
    key_insights TEXT[],
    recommendations TEXT[],
    accuracy_percentage INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.session_reports ENABLE ROW LEVEL SECURITY;

-- 11. Tutoring sessions table
CREATE TABLE IF NOT EXISTS public.tutoring_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    topic TEXT NOT NULL,
    duration_minutes INTEGER,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.tutoring_sessions ENABLE ROW LEVEL SECURITY;

-- 12. Pending OAuth registrations table
CREATE TABLE IF NOT EXISTS public.pending_oauth_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.pending_oauth_registrations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- DATABASE FUNCTIONS
-- ============================================

-- Function: update_updated_at_column (for automatic timestamp updates)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Function: has_role (security definer function for RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function: handle_new_user (auto-create profile on signup)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
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

-- Function: generate_student_invite_code (generate invite codes for students)
CREATE OR REPLACE FUNCTION public.generate_student_invite_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.role = 'student' AND NEW.invite_code IS NULL THEN
    NEW.invite_code := upper(substring(md5(random()::text) from 1 for 8));
    NEW.invite_code_expires_at := NOW() + INTERVAL '30 days';
  END IF;
  RETURN NEW;
END;
$$;

-- Function: get_fresh_invite_code (refresh expired invite codes)
CREATE OR REPLACE FUNCTION public.get_fresh_invite_code(user_id UUID)
RETURNS TABLE(invite_code TEXT, expires_at TIMESTAMP WITH TIME ZONE)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.profiles
  SET 
    invite_code = upper(substring(md5(random()::text) from 1 for 8)),
    invite_code_expires_at = NOW() + INTERVAL '30 days'
  WHERE 
    id = user_id 
    AND role = 'student'
    AND (invite_code_expires_at IS NULL OR invite_code_expires_at < NOW());
  
  RETURN QUERY
  SELECT 
    p.invite_code,
    p.invite_code_expires_at
  FROM public.profiles p
  WHERE p.id = user_id AND p.role = 'student';
END;
$$;

-- Function: create_user_role (auto-create user role on profile creation)
CREATE OR REPLACE FUNCTION public.create_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, NEW.role::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Function: prevent_role_update (prevent direct role modifications)
CREATE OR REPLACE FUNCTION public.prevent_role_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    RAISE EXCEPTION 'Direct role updates are not allowed. Roles must be managed through the user_roles table.';
  END IF;
  RETURN NEW;
END;
$$;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger: on_auth_user_created (creates profile when user signs up)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Trigger: on_profile_created (creates user role entry)
DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_user_role();

-- Trigger: on_profile_update (prevents role changes)
DROP TRIGGER IF EXISTS on_profile_update ON public.profiles;
CREATE TRIGGER on_profile_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_update();

-- Trigger: generate_invite_code_trigger (generates student invite codes)
DROP TRIGGER IF EXISTS generate_invite_code_trigger ON public.profiles;
CREATE TRIGGER generate_invite_code_trigger
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_student_invite_code();

-- Trigger: update_profiles_updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: update_learning_plans_updated_at
DROP TRIGGER IF EXISTS update_learning_plans_updated_at ON public.learning_plans;
CREATE TRIGGER update_learning_plans_updated_at
  BEFORE UPDATE ON public.learning_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: update_task_progress_updated_at
DROP TRIGGER IF EXISTS update_task_progress_updated_at ON public.task_progress;
CREATE TRIGGER update_task_progress_updated_at
  BEFORE UPDATE ON public.task_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- PROFILES TABLE POLICIES
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Parents can view linked students profiles"
  ON public.profiles FOR SELECT
  USING (id IN (
    SELECT linked_profile_id
    FROM public.students
    WHERE parent_id = auth.uid()
  ));

-- USER_ROLES TABLE POLICIES
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users cannot modify their own roles"
  ON public.user_roles FOR ALL
  USING (false);

-- STUDENTS TABLE POLICIES
CREATE POLICY "Parents can view their students"
  ON public.students FOR SELECT
  USING (auth.uid() = parent_id);

CREATE POLICY "Parents can insert their students"
  ON public.students FOR INSERT
  WITH CHECK (auth.uid() = parent_id);

CREATE POLICY "Parents can update their students"
  ON public.students FOR UPDATE
  USING (auth.uid() = parent_id);

CREATE POLICY "Parents can delete their students"
  ON public.students FOR DELETE
  USING (auth.uid() = parent_id);

CREATE POLICY "Students can view their own record"
  ON public.students FOR SELECT
  USING (auth.uid() = linked_profile_id);

-- MISTAKES TABLE POLICIES
CREATE POLICY "Users can view their own mistakes"
  ON public.mistakes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own mistakes"
  ON public.mistakes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mistakes"
  ON public.mistakes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mistakes"
  ON public.mistakes FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Parents can view linked students mistakes"
  ON public.mistakes FOR SELECT
  USING (EXISTS (
    SELECT 1
    FROM public.students
    WHERE students.linked_profile_id = mistakes.user_id
      AND students.parent_id = auth.uid()
  ));

-- CUSTOM_EXERCISES TABLE POLICIES
CREATE POLICY "Users can view their own custom exercises"
  ON public.custom_exercises FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own custom exercises"
  ON public.custom_exercises FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own custom exercises"
  ON public.custom_exercises FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own custom exercises"
  ON public.custom_exercises FOR DELETE
  USING (auth.uid() = user_id);

-- LEARNING_PLANS TABLE POLICIES
CREATE POLICY "Users can view their own learning plans"
  ON public.learning_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own learning plans"
  ON public.learning_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own learning plans"
  ON public.learning_plans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own learning plans"
  ON public.learning_plans FOR DELETE
  USING (auth.uid() = user_id);

-- LEARNING_TASKS TABLE POLICIES
CREATE POLICY "Users can view tasks for their plans"
  ON public.learning_tasks FOR SELECT
  USING (EXISTS (
    SELECT 1
    FROM public.learning_plans
    WHERE learning_plans.id = learning_tasks.plan_id
      AND learning_plans.user_id = auth.uid()
  ));

CREATE POLICY "Users can create tasks in their own plans"
  ON public.learning_tasks FOR INSERT
  WITH CHECK (plan_id IN (
    SELECT id
    FROM public.learning_plans
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update tasks for their plans"
  ON public.learning_tasks FOR UPDATE
  USING (EXISTS (
    SELECT 1
    FROM public.learning_plans
    WHERE learning_plans.id = learning_tasks.plan_id
      AND learning_plans.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete tasks from their own plans"
  ON public.learning_tasks FOR DELETE
  USING (plan_id IN (
    SELECT id
    FROM public.learning_plans
    WHERE user_id = auth.uid()
  ));

-- TASK_PROGRESS TABLE POLICIES
CREATE POLICY "Users can view their own task progress"
  ON public.task_progress FOR SELECT
  USING (EXISTS (
    SELECT 1
    FROM public.learning_tasks
    JOIN public.learning_plans ON learning_plans.id = learning_tasks.plan_id
    WHERE learning_tasks.id = task_progress.task_id
      AND learning_plans.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own task progress"
  ON public.task_progress FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1
    FROM public.learning_tasks
    JOIN public.learning_plans ON learning_plans.id = learning_tasks.plan_id
    WHERE learning_tasks.id = task_progress.task_id
      AND learning_plans.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own task progress"
  ON public.task_progress FOR UPDATE
  USING (EXISTS (
    SELECT 1
    FROM public.learning_tasks
    JOIN public.learning_plans ON learning_plans.id = learning_tasks.plan_id
    WHERE learning_tasks.id = task_progress.task_id
      AND learning_plans.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own task progress"
  ON public.task_progress FOR DELETE
  USING (task_id IN (
    SELECT t.id
    FROM public.learning_tasks t
    JOIN public.learning_plans p ON t.plan_id = p.id
    WHERE p.user_id = auth.uid()
  ));

-- SCHEDULED_SESSIONS TABLE POLICIES
CREATE POLICY "Parents can manage their scheduled sessions"
  ON public.scheduled_sessions FOR ALL
  USING (auth.uid() = parent_id);

CREATE POLICY "Students can view their scheduled sessions"
  ON public.scheduled_sessions FOR SELECT
  USING (EXISTS (
    SELECT 1
    FROM public.students
    WHERE students.id = scheduled_sessions.student_id
      AND students.linked_profile_id = auth.uid()
  ));

CREATE POLICY "Students can update their scheduled session status"
  ON public.scheduled_sessions FOR UPDATE
  USING (student_id IN (
    SELECT id
    FROM public.students
    WHERE linked_profile_id = auth.uid()
  ))
  WITH CHECK (student_id IN (
    SELECT id
    FROM public.students
    WHERE linked_profile_id = auth.uid()
  ));

-- SESSION_REPORTS TABLE POLICIES
CREATE POLICY "Parents can view their session reports"
  ON public.session_reports FOR SELECT
  USING (auth.uid() = parent_id);

CREATE POLICY "Parents can insert session reports"
  ON public.session_reports FOR INSERT
  WITH CHECK (auth.uid() = parent_id);

CREATE POLICY "Students can view their own session reports"
  ON public.session_reports FOR SELECT
  USING (student_id IN (
    SELECT id
    FROM public.students
    WHERE linked_profile_id = auth.uid()
  ));

-- TUTORING_SESSIONS TABLE POLICIES
CREATE POLICY "Users can manage their own tutoring sessions"
  ON public.tutoring_sessions FOR ALL
  USING (auth.uid() = user_id);

-- PENDING_OAUTH_REGISTRATIONS TABLE POLICIES
CREATE POLICY "Users can view their own pending registration"
  ON public.pending_oauth_registrations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pending registration"
  ON public.pending_oauth_registrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pending registration"
  ON public.pending_oauth_registrations FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- REALTIME CONFIGURATION (OPTIONAL)
-- ============================================

-- Enable realtime for tables that need live updates
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.scheduled_sessions;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.students;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.mistakes;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- All tables, functions, triggers, and RLS policies have been created
-- You can now connect your frontend to this Corepus database
