-- Drop both possible signatures to avoid overload conflicts
DROP FUNCTION IF EXISTS public.save_client_quiz(UUID, UUID, UUID, JSON, JSON);
DROP FUNCTION IF EXISTS public.save_client_quiz(UUID, UUID, UUID, JSONB, JSONB);

-- Recreate with explicit JSONB to match Supabase's preferred format
CREATE OR REPLACE FUNCTION public.save_client_quiz(
  p_admin_id UUID,
  p_client_id UUID,
  p_quiz_id UUID,
  p_quiz_data JSONB,
  p_questions_data JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_valid BOOLEAN;
  v_quiz_id UUID;
  v_status public.quiz_status;
  v_created_by UUID;
BEGIN
  -- 1. Verify admin belongs to this client and is active
  SELECT EXISTS (
    SELECT 1 FROM public.client_admins
    WHERE id = p_admin_id
      AND client_id = p_client_id
      AND is_active = true
  ) INTO v_is_valid;
  
  IF NOT v_is_valid THEN
    RAISE EXCEPTION 'Unauthorized or invalid admin';
  END IF;

  -- 2. Extract and cast status properly to avoid enum error
  v_status := (p_quiz_data->>'status')::public.quiz_status;

  -- 3. Get created_by fallback for client admins
  v_created_by := COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::UUID);

  -- 4. Insert or Update Quiz
  IF p_quiz_id IS NULL THEN
    INSERT INTO public.quizzes (
      client_id, title, description, start_time, end_time,
      timer_per_question, randomize_questions, randomize_options,
      show_leaderboard, status, created_by, is_private
    ) VALUES (
      p_client_id,
      p_quiz_data->>'title',
      p_quiz_data->>'description',
      (p_quiz_data->>'start_time')::TIMESTAMPTZ,
      (p_quiz_data->>'end_time')::TIMESTAMPTZ,
      (p_quiz_data->>'timer_per_question')::INTEGER,
      COALESCE((p_quiz_data->>'randomize_questions')::BOOLEAN, false),
      COALESCE((p_quiz_data->>'randomize_options')::BOOLEAN, false),
      COALESCE((p_quiz_data->>'show_leaderboard')::BOOLEAN, true),
      v_status, v_created_by, true
    ) RETURNING id INTO v_quiz_id;
  ELSE
    UPDATE public.quizzes SET
      title = p_quiz_data->>'title',
      description = p_quiz_data->>'description',
      start_time = (p_quiz_data->>'start_time')::TIMESTAMPTZ,
      end_time = (p_quiz_data->>'end_time')::TIMESTAMPTZ,
      timer_per_question = (p_quiz_data->>'timer_per_question')::INTEGER,
      randomize_questions = COALESCE((p_quiz_data->>'randomize_questions')::BOOLEAN, false),
      randomize_options = COALESCE((p_quiz_data->>'randomize_options')::BOOLEAN, false),
      show_leaderboard = COALESCE((p_quiz_data->>'show_leaderboard')::BOOLEAN, true),
      status = v_status,
      updated_at = NOW()
    WHERE id = p_quiz_id AND client_id = p_client_id
    RETURNING id INTO v_quiz_id;
    
    IF v_quiz_id IS NULL THEN
      RAISE EXCEPTION 'Quiz not found or unauthorized';
    END IF;
  END IF;

  -- 5. Delete existing questions for this quiz safely
  DELETE FROM public.questions WHERE quiz_id = v_quiz_id;

  -- 6. Insert new questions from JSONB array elements
  IF p_questions_data IS NOT NULL AND jsonb_typeof(p_questions_data) = 'array' AND jsonb_array_length(p_questions_data) > 0 THEN
    INSERT INTO public.questions (
      quiz_id, question_text, options, correct_answer, order_index
    )
    SELECT 
      v_quiz_id,
      q->>'question_text',
      q->'options',
      q->>'correct_answer',
      (q->>'order_index')::INTEGER
    FROM jsonb_array_elements(p_questions_data) AS q;
  END IF;

  RETURN v_quiz_id;
END;
$$;
