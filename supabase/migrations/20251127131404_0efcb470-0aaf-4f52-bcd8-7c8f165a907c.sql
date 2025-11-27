-- Add missing columns to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free';

-- Update existing profiles to copy full_name to name if name is null
UPDATE public.profiles SET name = full_name WHERE name IS NULL;

-- Add missing columns to learning_plans
ALTER TABLE public.learning_plans ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Add trigger to update learning_plans updated_at
DROP TRIGGER IF EXISTS update_learning_plans_updated_at ON public.learning_plans;
CREATE TRIGGER update_learning_plans_updated_at
  BEFORE UPDATE ON public.learning_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add missing columns to scheduled_sessions
ALTER TABLE public.scheduled_sessions ADD COLUMN IF NOT EXISTS topic TEXT;
ALTER TABLE public.scheduled_sessions ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 60;

-- Add missing columns to session_reports
ALTER TABLE public.session_reports ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE public.session_reports ADD COLUMN IF NOT EXISTS accuracy_percentage INTEGER;
ALTER TABLE public.session_reports ADD COLUMN IF NOT EXISTS key_insights TEXT[];
ALTER TABLE public.session_reports ADD COLUMN IF NOT EXISTS recommendations TEXT[];

-- Add completed_at column to learning_tasks if it doesn't exist
ALTER TABLE public.learning_tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Create function to refresh invite codes if it doesn't exist
CREATE OR REPLACE FUNCTION public.get_fresh_invite_code(user_id uuid)
RETURNS TABLE (
  invite_code text,
  expires_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if invite code is expired
  UPDATE profiles
  SET 
    invite_code = upper(substring(md5(random()::text) from 1 for 8)),
    invite_code_expires_at = now() + interval '30 days'
  WHERE 
    id = user_id 
    AND role = 'student'
    AND (invite_code_expires_at IS NULL OR invite_code_expires_at < now());
  
  -- Return the current invite code
  RETURN QUERY
  SELECT 
    p.invite_code,
    p.invite_code_expires_at
  FROM profiles p
  WHERE p.id = user_id AND p.role = 'student';
END;
$$;