-- ============================================================
-- HIDE CORRECT ANSWERS FROM CLIENTS
-- Creates a secure view that excludes correct_answer column
-- ============================================================

-- 1. Create a view that exposes questions WITHOUT correct_answer
CREATE OR REPLACE VIEW public.questions_public AS
SELECT 
  id,
  quiz_id,
  question_text,
  options,
  order_index,
  created_at
  -- NOTE: correct_answer is intentionally excluded
FROM public.questions;

-- 2. Grant SELECT on the view to anon and authenticated users
GRANT SELECT ON public.questions_public TO anon;
GRANT SELECT ON public.questions_public TO authenticated;

-- 3. Revoke direct access to questions table for non-admins
-- First, drop existing policies that allow public read
DROP POLICY IF EXISTS "Anyone can view questions for published quizzes" ON public.questions;

-- 4. Create new policy: Only admins can read questions table directly
CREATE POLICY "Only admins can view questions directly"
  ON public.questions FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- 5. Allow the trigger function to still access correct_answer
-- (SECURITY DEFINER functions run with creator's permissions)
-- The validate_response_answer() function already has SECURITY DEFINER

-- 6. Create a policy for anon users to use the view (via RLS bypass)
-- Views inherit the definer's permissions, so this should work
