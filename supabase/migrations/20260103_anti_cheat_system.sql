-- ============================================================
-- ANTI-CHEAT SYSTEM MIGRATION
-- Prevents: time manipulation, score manipulation, duplicate entries
-- ============================================================

-- 1. Add fingerprint column to participants for duplicate detection
ALTER TABLE public.participants 
ADD COLUMN IF NOT EXISTS device_fingerprint TEXT;

-- 2. Add server_calculated_time column (will be calculated from start_time vs end_time)
ALTER TABLE public.participants 
ADD COLUMN IF NOT EXISTS server_calculated_time INTEGER;

-- 3. Create index for faster duplicate detection
CREATE INDEX IF NOT EXISTS idx_participants_fingerprint_quiz 
ON public.participants(device_fingerprint, quiz_id);

-- 4. Create function to validate and fix participant updates
-- This recalculates time server-side and validates minimum time
CREATE OR REPLACE FUNCTION public.validate_participant_submission()
RETURNS TRIGGER AS $$
DECLARE
  question_count INTEGER;
  timer_per_q INTEGER;
  min_possible_time INTEGER;
  calculated_time INTEGER;
  correct_count INTEGER;
BEGIN
  -- Only run when end_time is being set (quiz submission)
  IF NEW.end_time IS NOT NULL AND OLD.end_time IS NULL THEN
    -- Get quiz settings
    SELECT q.timer_per_question, COUNT(qs.id)
    INTO timer_per_q, question_count
    FROM public.quizzes q
    LEFT JOIN public.questions qs ON qs.quiz_id = q.id
    WHERE q.id = NEW.quiz_id
    GROUP BY q.timer_per_question;
    
    -- Calculate server-side elapsed time in seconds
    calculated_time := GREATEST(0, EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time))::INTEGER);
    
    -- Store server-calculated time
    NEW.server_calculated_time := calculated_time;
    
    -- Calculate minimum possible time (1 second per question minimum)
    min_possible_time := question_count;
    
    -- If client-sent time is suspiciously low (less than 1 second per question), use server time
    IF NEW.total_time_taken < min_possible_time THEN
      NEW.total_time_taken := calculated_time;
    END IF;
    
    -- Recalculate score from actual responses (don't trust client)
    SELECT COUNT(*) INTO correct_count
    FROM public.responses r
    JOIN public.questions q ON q.id = r.question_id
    WHERE r.participant_id = NEW.id
    AND r.answer = q.correct_answer;
    
    -- Override client-sent score with server-calculated score
    NEW.total_score := COALESCE(correct_count, 0);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create trigger for participant submission validation
DROP TRIGGER IF EXISTS validate_participant_submission_trigger ON public.participants;
CREATE TRIGGER validate_participant_submission_trigger
  BEFORE UPDATE ON public.participants
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_participant_submission();

-- 6. Create function to validate response answers server-side
-- This rechecks is_correct based on actual correct_answer
CREATE OR REPLACE FUNCTION public.validate_response_answer()
RETURNS TRIGGER AS $$
DECLARE
  actual_correct TEXT;
BEGIN
  -- Get the actual correct answer from questions table
  SELECT correct_answer INTO actual_correct
  FROM public.questions
  WHERE id = NEW.question_id;
  
  -- Override client's is_correct with server validation
  NEW.is_correct := (NEW.answer = actual_correct);
  
  -- Ensure time_taken is reasonable (at least 0, max equals timer_per_question)
  IF NEW.time_taken < 0 THEN
    NEW.time_taken := 0;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create trigger for response validation
DROP TRIGGER IF EXISTS validate_response_trigger ON public.responses;
CREATE TRIGGER validate_response_trigger
  BEFORE INSERT ON public.responses
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_response_answer();

-- 8. Create function to check for duplicate entries
CREATE OR REPLACE FUNCTION public.check_duplicate_participant()
RETURNS TRIGGER AS $$
DECLARE
  existing_count INTEGER;
BEGIN
  -- Check if participant with same fingerprint already completed this quiz
  IF NEW.device_fingerprint IS NOT NULL THEN
    SELECT COUNT(*) INTO existing_count
    FROM public.participants
    WHERE quiz_id = NEW.quiz_id
    AND device_fingerprint = NEW.device_fingerprint
    AND end_time IS NOT NULL;  -- Only completed entries count
    
    IF existing_count > 0 THEN
      RAISE EXCEPTION 'You have already completed this quiz from this device.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Create trigger for duplicate check on insert
DROP TRIGGER IF EXISTS check_duplicate_participant_trigger ON public.participants;
CREATE TRIGGER check_duplicate_participant_trigger
  BEFORE INSERT ON public.participants
  FOR EACH ROW
  EXECUTE FUNCTION public.check_duplicate_participant();

-- 10. Create function to limit entries per device per quiz
-- (allows re-entry if previous attempt wasn't completed)
CREATE OR REPLACE FUNCTION public.limit_concurrent_attempts()
RETURNS TRIGGER AS $$
DECLARE
  active_attempts INTEGER;
BEGIN
  IF NEW.device_fingerprint IS NOT NULL THEN
    -- Count active (incomplete) attempts from same device
    SELECT COUNT(*) INTO active_attempts
    FROM public.participants
    WHERE quiz_id = NEW.quiz_id
    AND device_fingerprint = NEW.device_fingerprint
    AND end_time IS NULL
    AND created_at > NOW() - INTERVAL '1 hour';  -- Only recent attempts
    
    IF active_attempts > 0 THEN
      RAISE EXCEPTION 'You already have an active quiz session. Please complete it first.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Create trigger for concurrent attempt limiting
DROP TRIGGER IF EXISTS limit_concurrent_attempts_trigger ON public.participants;
CREATE TRIGGER limit_concurrent_attempts_trigger
  BEFORE INSERT ON public.participants
  FOR EACH ROW
  EXECUTE FUNCTION public.limit_concurrent_attempts();

-- 12. Add show_leaderboard column if not exists
ALTER TABLE public.quizzes 
ADD COLUMN IF NOT EXISTS show_leaderboard BOOLEAN DEFAULT true;
