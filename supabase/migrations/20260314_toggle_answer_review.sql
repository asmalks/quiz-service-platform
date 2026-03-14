-- ============================================================
-- ADD ANSWER REVIEW TOGGLE AND SECURE RESULTS RPC
-- ============================================================

-- 1. Add show_answer_review column to quizzes table
ALTER TABLE public.quizzes 
ADD COLUMN IF NOT EXISTS show_answer_review BOOLEAN DEFAULT true;

-- 2. Create RPC for secure results retrieval
-- This function bypasses RLS on questions table to show results ONLY after completion
CREATE OR REPLACE FUNCTION public.get_participant_results(p_participant_id UUID)
RETURNS TABLE (
    question_id UUID,
    question_text TEXT,
    options JSONB,
    correct_answer TEXT,
    user_answer TEXT,
    is_correct BOOLEAN,
    show_review BOOLEAN
) AS $$
DECLARE
    v_quiz_id UUID;
    v_end_time TIMESTAMPTZ;
    v_show_review BOOLEAN;
BEGIN
    -- Get participant info and quiz settings
    SELECT p.quiz_id, p.end_time, q.show_answer_review
    INTO v_quiz_id, v_end_time, v_show_review
    FROM public.participants p
    JOIN public.quizzes q ON q.id = p.quiz_id
    WHERE p.id = p_participant_id;

    -- Return full data only if participant has finished the quiz
    IF v_end_time IS NOT NULL THEN
        RETURN QUERY
        SELECT 
            q.id as question_id,
            q.question_text,
            q.options,
            CASE WHEN v_show_review THEN q.correct_answer ELSE NULL END as correct_answer,
            r.answer as user_answer,
            CASE WHEN v_show_review THEN r.is_correct ELSE NULL END as is_correct,
            v_show_review as show_review
        FROM public.questions q
        LEFT JOIN public.responses r ON r.question_id = q.id AND r.participant_id = p_participant_id
        WHERE q.quiz_id = v_quiz_id
        ORDER BY q.order_index ASC;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Grant access to the function
GRANT EXECUTE ON FUNCTION public.get_participant_results(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.get_participant_results(UUID) TO authenticated;

-- 4. Update save_client_quiz RPC to handle show_answer_review
CREATE OR REPLACE FUNCTION public.save_client_quiz(
  p_admin_id UUID,
  p_client_id UUID,
  p_quiz_id UUID,
  p_quiz_data JSON,
  p_questions_data JSON
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

  -- 2. Extract and cast status properly to avoid the enum error
  v_status := (p_quiz_data->>'status')::public.quiz_status;

  -- 3. Get created_by
  v_created_by := COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::UUID);

  -- 4. Insert or Update Quiz
  IF p_quiz_id IS NULL THEN
    -- Create new quiz
    INSERT INTO public.quizzes (
      client_id,
      title,
      description,
      start_time,
      end_time,
      timer_per_question,
      randomize_questions,
      randomize_options,
      show_leaderboard,
      show_answer_review,
      whatsapp_required,
      badge_text,
      status,
      created_by,
      is_private
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
      COALESCE((p_quiz_data->>'show_answer_review')::BOOLEAN, true),
      COALESCE((p_quiz_data->>'whatsapp_required')::BOOLEAN, false),
      p_quiz_data->>'badge_text',
      v_status,
      v_created_by,
      true -- client quizzes are private by default
    ) RETURNING id INTO v_quiz_id;
  ELSE
    -- Update existing quiz
    UPDATE public.quizzes SET
      title = p_quiz_data->>'title',
      description = p_quiz_data->>'description',
      start_time = (p_quiz_data->>'start_time')::TIMESTAMPTZ,
      end_time = (p_quiz_data->>'end_time')::TIMESTAMPTZ,
      timer_per_question = (p_quiz_data->>'timer_per_question')::INTEGER,
      randomize_questions = COALESCE((p_quiz_data->>'randomize_questions')::BOOLEAN, false),
      randomize_options = COALESCE((p_quiz_data->>'randomize_options')::BOOLEAN, false),
      show_leaderboard = COALESCE((p_quiz_data->>'show_leaderboard')::BOOLEAN, true),
      show_answer_review = COALESCE((p_quiz_data->>'show_answer_review')::BOOLEAN, true),
      whatsapp_required = COALESCE((p_quiz_data->>'whatsapp_required')::BOOLEAN, false),
      badge_text = p_quiz_data->>'badge_text',
      status = v_status,
      updated_at = NOW()
    WHERE id = p_quiz_id AND client_id = p_client_id
    RETURNING id INTO v_quiz_id;
    
    IF v_quiz_id IS NULL THEN
      RAISE EXCEPTION 'Quiz not found or unauthorized';
    END IF;
  END IF;

  -- 5. Delete existing questions for this quiz
  DELETE FROM public.questions WHERE quiz_id = v_quiz_id;

  -- 6. Insert new questions
  IF p_questions_data IS NOT NULL AND json_typeof(p_questions_data) = 'array' AND json_array_length(p_questions_data) > 0 THEN
    INSERT INTO public.questions (
      quiz_id,
      question_text,
      options,
      correct_answer,
      order_index
    )
    SELECT 
      v_quiz_id,
      q->>'question_text',
      q->'options',
      q->>'correct_answer',
      (q->>'order_index')::INTEGER
    FROM json_array_elements(p_questions_data) AS q;
  END IF;

  RETURN v_quiz_id;
END;
$$;
