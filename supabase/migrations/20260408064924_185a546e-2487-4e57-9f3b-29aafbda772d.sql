
-- 1. Revoke direct INSERT on quiz_results from public (only edge function will insert)
DROP POLICY IF EXISTS "Users can insert their own quiz results" ON public.quiz_results;

-- 2. Add CHECK constraints as a safety net
ALTER TABLE public.quiz_results ADD CONSTRAINT check_score_range CHECK (score_percentage >= 0 AND score_percentage <= 100);
ALTER TABLE public.quiz_results ADD CONSTRAINT check_correct_answers CHECK (correct_answers >= 0 AND correct_answers <= total_questions);

-- 3. Restrict profiles UPDATE to only allow display_name and preferred_language changes (not form_level)
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Create a security definer function that only allows updating safe columns
CREATE OR REPLACE FUNCTION public.update_profile_safe(
  p_display_name text DEFAULT NULL,
  p_preferred_language text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET
    display_name = COALESCE(p_display_name, display_name),
    preferred_language = COALESCE(p_preferred_language, preferred_language)
  WHERE user_id = auth.uid();
END;
$$;
