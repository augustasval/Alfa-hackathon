/*
  # Parent Portal & Scheduling Schema

  This migration adds tables from math_tutor to support:
  - Parent accounts and authentication
  - Student management (children linked to parents)
  - Session scheduling (one-time and recurring)
  - Tutoring sessions tracking
  - Session reports for parents

  ## Tables Added
  - profiles: User profiles extending auth.users
  - students: Children linked to parent accounts
  - scheduled_sessions: Parent-scheduled learning sessions
  - tutoring_sessions: Actual tutoring interaction records
  - session_reports: AI-generated reports for parents
*/

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('parent', 'student')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create students table (children linked to parents)
CREATE TABLE IF NOT EXISTS public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  grade_level integer NOT NULL CHECK (grade_level >= 1 AND grade_level <= 12),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can view their students"
  ON public.students FOR SELECT
  TO authenticated
  USING (parent_id = auth.uid());

CREATE POLICY "Parents can create students"
  ON public.students FOR INSERT
  TO authenticated
  WITH CHECK (parent_id = auth.uid());

CREATE POLICY "Parents can update their students"
  ON public.students FOR UPDATE
  TO authenticated
  USING (parent_id = auth.uid())
  WITH CHECK (parent_id = auth.uid());

CREATE POLICY "Parents can delete their students"
  ON public.students FOR DELETE
  TO authenticated
  USING (parent_id = auth.uid());

-- Create scheduled_sessions table
CREATE TABLE IF NOT EXISTS public.scheduled_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  parent_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  topic text,
  scheduled_date date NOT NULL,
  scheduled_time time NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 30,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'missed')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.scheduled_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can view their scheduled sessions"
  ON public.scheduled_sessions FOR SELECT
  TO authenticated
  USING (parent_id = auth.uid());

CREATE POLICY "Parents can create scheduled sessions"
  ON public.scheduled_sessions FOR INSERT
  TO authenticated
  WITH CHECK (parent_id = auth.uid());

CREATE POLICY "Parents can update their scheduled sessions"
  ON public.scheduled_sessions FOR UPDATE
  TO authenticated
  USING (parent_id = auth.uid())
  WITH CHECK (parent_id = auth.uid());

CREATE POLICY "Parents can delete their scheduled sessions"
  ON public.scheduled_sessions FOR DELETE
  TO authenticated
  USING (parent_id = auth.uid());

-- Create tutoring_sessions table
CREATE TABLE IF NOT EXISTS public.tutoring_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  parent_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  scheduled_session_id uuid REFERENCES public.scheduled_sessions(id) ON DELETE SET NULL,
  session_type text NOT NULL CHECK (session_type IN ('homework_help', 'scheduled_practice', 'self_initiated')),
  topic text NOT NULL,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  duration_minutes integer,
  problems_attempted integer DEFAULT 0,
  problems_correct integer DEFAULT 0,
  questions_asked integer DEFAULT 0,
  struggle_areas text,
  conversation_history jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.tutoring_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can view sessions for their students"
  ON public.tutoring_sessions FOR SELECT
  TO authenticated
  USING (parent_id = auth.uid());

CREATE POLICY "Parents can create sessions for their students"
  ON public.tutoring_sessions FOR INSERT
  TO authenticated
  WITH CHECK (parent_id = auth.uid());

CREATE POLICY "Parents can update sessions for their students"
  ON public.tutoring_sessions FOR UPDATE
  TO authenticated
  USING (parent_id = auth.uid())
  WITH CHECK (parent_id = auth.uid());

-- Create session_reports table
CREATE TABLE IF NOT EXISTS public.session_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.tutoring_sessions(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  parent_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  summary text NOT NULL,
  accuracy_percentage integer,
  key_insights text,
  recommendations text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.session_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can view reports for their students"
  ON public.session_reports FOR SELECT
  TO authenticated
  USING (parent_id = auth.uid());

CREATE POLICY "System can create session reports"
  ON public.session_reports FOR INSERT
  TO authenticated
  WITH CHECK (parent_id = auth.uid());

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_students_parent ON public.students(parent_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_sessions_student ON public.scheduled_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_sessions_parent ON public.scheduled_sessions(parent_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_sessions_date ON public.scheduled_sessions(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_tutoring_sessions_student ON public.tutoring_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_tutoring_sessions_parent ON public.tutoring_sessions(parent_id);
CREATE INDEX IF NOT EXISTS idx_session_reports_parent ON public.session_reports(parent_id);
