-- ============================================================
-- QUIZ SERVICE PLATFORM MIGRATION
-- Adds multi-client "Quiz as a Service" support
-- ============================================================

-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- 1. CREATE quiz_clients TABLE
-- Stores external client/organization campaigns
-- ============================================================
CREATE TABLE public.quiz_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#6366f1',
  secondary_color TEXT DEFAULT '#8b5cf6',
  background_color TEXT DEFAULT '#ffffff',
  headline TEXT,
  subheadline TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

ALTER TABLE public.quiz_clients ENABLE ROW LEVEL SECURITY;

-- Anyone can view active clients (needed for rendering branded pages)
CREATE POLICY "Anyone can view active clients"
  ON public.quiz_clients FOR SELECT
  USING (is_active = true);

-- Super admins can manage all clients
CREATE POLICY "Admins can manage clients"
  ON public.quiz_clients FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_quiz_clients_updated_at
  BEFORE UPDATE ON public.quiz_clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for slug lookups
CREATE INDEX idx_quiz_clients_slug ON public.quiz_clients(slug);

-- ============================================================
-- 2. CREATE client_admins TABLE
-- Stores client admin accounts with separate auth
-- ============================================================
CREATE TABLE public.client_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.quiz_clients(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'client_admin',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.client_admins ENABLE ROW LEVEL SECURITY;

-- Super admins can manage all client admin accounts
CREATE POLICY "Admins can manage client admins"
  ON public.client_admins FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Allow anonymous to select for login verification (password checked server-side)
CREATE POLICY "Anyone can read client admins for login"
  ON public.client_admins FOR SELECT
  USING (true);

-- Index for email lookups
CREATE INDEX idx_client_admins_email ON public.client_admins(email);
CREATE INDEX idx_client_admins_client_id ON public.client_admins(client_id);

-- ============================================================
-- 3. MODIFY quizzes TABLE
-- Add client_id, is_private, access_code
-- ============================================================
ALTER TABLE public.quizzes
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.quiz_clients(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS access_code TEXT;

-- Index for client quiz lookups
CREATE INDEX IF NOT EXISTS idx_quizzes_client_id ON public.quizzes(client_id);

-- ============================================================
-- 4. HELPER FUNCTIONS
-- ============================================================

-- Function to verify client admin password
CREATE OR REPLACE FUNCTION public.verify_client_admin_login(
  p_email TEXT,
  p_password TEXT
)
RETURNS TABLE(
  admin_id UUID,
  admin_client_id UUID,
  admin_email TEXT,
  admin_role TEXT,
  client_name TEXT,
  client_slug TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ca.id,
    ca.client_id,
    ca.email,
    ca.role,
    qc.name,
    qc.slug
  FROM public.client_admins ca
  JOIN public.quiz_clients qc ON qc.id = ca.client_id
  WHERE ca.email = p_email
    AND ca.password_hash = crypt(p_password, ca.password_hash)
    AND ca.is_active = true
    AND qc.is_active = true;
END;
$$;

-- Function to create a client admin with hashed password
CREATE OR REPLACE FUNCTION public.create_client_admin(
  p_client_id UUID,
  p_email TEXT,
  p_password TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO public.client_admins (client_id, email, password_hash)
  VALUES (p_client_id, p_email, crypt(p_password, gen_salt('bf')))
  RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$;

-- Function to reset client admin password
CREATE OR REPLACE FUNCTION public.reset_client_admin_password(
  p_admin_id UUID,
  p_new_password TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.client_admins
  SET password_hash = crypt(p_new_password, gen_salt('bf'))
  WHERE id = p_admin_id;
  
  RETURN FOUND;
END;
$$;
