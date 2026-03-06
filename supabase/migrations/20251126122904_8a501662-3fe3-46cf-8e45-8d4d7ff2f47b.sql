-- Create enum for admin roles
CREATE TYPE public.admin_role AS ENUM ('super_admin', 'admin', 'moderator');

-- Create enum for quiz status
CREATE TYPE public.quiz_status AS ENUM ('draft', 'published', 'expired');

-- Create admins table
CREATE TABLE public.admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  role admin_role NOT NULL DEFAULT 'moderator',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on admins
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins
    WHERE admins.user_id = is_admin.user_id
  );
$$;

-- Admins policies
CREATE POLICY "Admins can view all admins"
  ON public.admins FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Create sponsors table
CREATE TABLE public.sponsors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  link TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active sponsors"
  ON public.sponsors FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage sponsors"
  ON public.sponsors FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Create quizzes table
CREATE TABLE public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  timer_per_question INTEGER NOT NULL DEFAULT 10,
  randomize_questions BOOLEAN DEFAULT false,
  randomize_options BOOLEAN DEFAULT false,
  status quiz_status NOT NULL DEFAULT 'draft',
  sponsor_id UUID REFERENCES public.sponsors(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published quizzes"
  ON public.quizzes FOR SELECT
  USING (status = 'published');

CREATE POLICY "Admins can manage quizzes"
  ON public.quizzes FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Create questions table
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE NOT NULL,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view questions for published quizzes"
  ON public.questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quizzes
      WHERE quizzes.id = questions.quiz_id
      AND quizzes.status = 'published'
    )
  );

CREATE POLICY "Admins can manage questions"
  ON public.questions FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Create participants table
CREATE TABLE public.participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  whatsapp TEXT,
  city TEXT,
  exam_target TEXT,
  start_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_time TIMESTAMPTZ,
  total_score INTEGER DEFAULT 0,
  total_time_taken INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view their own data"
  ON public.participants FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert participants"
  ON public.participants FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Participants can update their own data"
  ON public.participants FOR UPDATE
  USING (true);

CREATE POLICY "Admins can manage all participants"
  ON public.participants FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Create responses table
CREATE TABLE public.responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID REFERENCES public.participants(id) ON DELETE CASCADE NOT NULL,
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES public.questions(id) ON DELETE CASCADE NOT NULL,
  answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  time_taken INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view their own responses"
  ON public.responses FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert responses"
  ON public.responses FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all responses"
  ON public.responses FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Create practice_quizzes table (for future)
CREATE TABLE public.practice_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  topic TEXT NOT NULL,
  is_premium BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.practice_quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view free practice quizzes"
  ON public.practice_quizzes FOR SELECT
  USING (is_premium = false);

-- Create user_points table (for gamification)
CREATE TABLE public.user_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID REFERENCES public.participants(id) ON DELETE CASCADE NOT NULL,
  points INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  last_participation_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own points"
  ON public.user_points FOR SELECT
  USING (true);

CREATE POLICY "System can update points"
  ON public.user_points FOR ALL
  WITH CHECK (true);

-- Create function to update quiz timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for quizzes
CREATE TRIGGER update_quizzes_updated_at
  BEFORE UPDATE ON public.quizzes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_quizzes_status ON public.quizzes(status);
CREATE INDEX idx_quizzes_start_time ON public.quizzes(start_time);
CREATE INDEX idx_questions_quiz_id ON public.questions(quiz_id);
CREATE INDEX idx_participants_quiz_id ON public.participants(quiz_id);
CREATE INDEX idx_responses_participant_id ON public.responses(participant_id);
CREATE INDEX idx_responses_quiz_id ON public.responses(quiz_id);