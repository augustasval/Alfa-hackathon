-- Fix search_path for get_fresh_invite_code function
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
  UPDATE public.profiles
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
  FROM public.profiles p
  WHERE p.id = user_id AND p.role = 'student';
END;
$$;