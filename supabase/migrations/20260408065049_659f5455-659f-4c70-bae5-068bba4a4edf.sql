
-- Trigger to prevent direct form_level changes via client
CREATE OR REPLACE FUNCTION public.prevent_form_level_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If form_level is being changed, revert it to old value
  -- Only the security definer function update_profile_safe can bypass this
  IF NEW.form_level IS DISTINCT FROM OLD.form_level THEN
    -- Check if caller is the service role (edge functions) by checking current_setting
    -- For regular user updates, prevent form_level changes
    IF current_setting('role') = 'authenticated' THEN
      NEW.form_level := OLD.form_level;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER prevent_form_level_direct_change
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_form_level_change();
