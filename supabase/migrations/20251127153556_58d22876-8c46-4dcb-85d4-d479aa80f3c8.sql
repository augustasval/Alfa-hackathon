-- Fix function search_path for prevent_role_update function
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