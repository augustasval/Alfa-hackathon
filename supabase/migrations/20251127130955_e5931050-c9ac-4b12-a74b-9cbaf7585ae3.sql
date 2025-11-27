-- Create profiles table extending auth.users
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('parent', 'student')),
  invite_code TEXT UNIQUE,
  invite_code_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create students table for parent-student linking
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  linked_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  grade_level INTEGER,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create pending OAuth registrations table
CREATE TABLE public.pending_oauth_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('parent', 'student')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create mistakes table for database-backed mistake tracking
CREATE TABLE public.mistakes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  problem TEXT NOT NULL,
  topic TEXT NOT NULL,
  attempts INTEGER DEFAULT 1,
  user_answer TEXT,
  correct_answer TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create learning plans table
CREATE TABLE public.learning_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id TEXT,
  grade TEXT NOT NULL,
  topic_name TEXT NOT NULL,
  test_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create learning tasks table
CREATE TABLE public.learning_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES public.learning_plans(id) ON DELETE CASCADE NOT NULL,
  day_number INTEGER NOT NULL,
  scheduled_date DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  task_type TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create task progress table
CREATE TABLE public.task_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.learning_tasks(id) ON DELETE CASCADE NOT NULL,
  session_id TEXT NOT NULL,
  quiz_passed BOOLEAN DEFAULT false,
  exercises_completed INTEGER DEFAULT 0,
  current_phase TEXT DEFAULT 'theory',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create scheduled sessions table
CREATE TABLE public.scheduled_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create tutoring sessions table
CREATE TABLE public.tutoring_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  topic TEXT NOT NULL,
  duration_minutes INTEGER,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create session reports table
CREATE TABLE public.session_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.scheduled_sessions(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  report_content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_oauth_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mistakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutoring_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can view profiles by invite code"
  ON public.profiles FOR SELECT
  USING (invite_code IS NOT NULL);

-- RLS Policies for students
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

-- RLS Policies for pending_oauth_registrations
CREATE POLICY "Users can view their own pending registration"
  ON public.pending_oauth_registrations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pending registration"
  ON public.pending_oauth_registrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pending registration"
  ON public.pending_oauth_registrations FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for mistakes
CREATE POLICY "Users can view their own mistakes"
  ON public.mistakes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own mistakes"
  ON public.mistakes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mistakes"
  ON public.mistakes FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Parents can view linked students mistakes"
  ON public.mistakes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.linked_profile_id = mistakes.user_id
      AND students.parent_id = auth.uid()
    )
  );

-- RLS Policies for learning_plans
CREATE POLICY "Users can view their own learning plans"
  ON public.learning_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own learning plans"
  ON public.learning_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own learning plans"
  ON public.learning_plans FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for learning_tasks
CREATE POLICY "Users can view tasks for their plans"
  ON public.learning_tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.learning_plans
      WHERE learning_plans.id = learning_tasks.plan_id
      AND learning_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update tasks for their plans"
  ON public.learning_tasks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.learning_plans
      WHERE learning_plans.id = learning_tasks.plan_id
      AND learning_plans.user_id = auth.uid()
    )
  );

-- RLS Policies for task_progress
CREATE POLICY "Users can view their own task progress"
  ON public.task_progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.learning_tasks
      JOIN public.learning_plans ON learning_plans.id = learning_tasks.plan_id
      WHERE learning_tasks.id = task_progress.task_id
      AND learning_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own task progress"
  ON public.task_progress FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.learning_tasks
      JOIN public.learning_plans ON learning_plans.id = learning_tasks.plan_id
      WHERE learning_tasks.id = task_progress.task_id
      AND learning_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own task progress"
  ON public.task_progress FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.learning_tasks
      JOIN public.learning_plans ON learning_plans.id = learning_tasks.plan_id
      WHERE learning_tasks.id = task_progress.task_id
      AND learning_plans.user_id = auth.uid()
    )
  );

-- RLS Policies for scheduled_sessions
CREATE POLICY "Parents can manage their scheduled sessions"
  ON public.scheduled_sessions FOR ALL
  USING (auth.uid() = parent_id);

CREATE POLICY "Students can view their scheduled sessions"
  ON public.scheduled_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.students
      WHERE students.id = scheduled_sessions.student_id
      AND students.linked_profile_id = auth.uid()
    )
  );

-- RLS Policies for tutoring_sessions
CREATE POLICY "Users can manage their own tutoring sessions"
  ON public.tutoring_sessions FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for session_reports
CREATE POLICY "Parents can view their session reports"
  ON public.session_reports FOR SELECT
  USING (auth.uid() = parent_id);

CREATE POLICY "Parents can insert session reports"
  ON public.session_reports FOR INSERT
  WITH CHECK (auth.uid() = parent_id);

-- Create function to auto-generate invite codes for students
CREATE OR REPLACE FUNCTION public.generate_student_invite_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'student' AND NEW.invite_code IS NULL THEN
    NEW.invite_code := upper(substring(md5(random()::text) from 1 for 8));
    NEW.invite_code_expires_at := now() + interval '30 days';
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to generate invite code on profile creation
CREATE TRIGGER generate_invite_code_on_insert
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_student_invite_code();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Trigger to auto-create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger to update updated_at on profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to update updated_at on task_progress
CREATE TRIGGER update_task_progress_updated_at
  BEFORE UPDATE ON public.task_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();