-- Create settings table for landing page content and announcements
CREATE TABLE IF NOT EXISTS public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Admins can manage all settings
CREATE POLICY "Admins can manage settings"
ON public.site_settings
FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Anyone can view settings (for landing page)
CREATE POLICY "Anyone can view settings"
ON public.site_settings
FOR SELECT
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_site_settings_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.site_settings (key, value) VALUES
  ('landing_hero_title', '"Daily PSC Quiz Competition"'::jsonb),
  ('landing_hero_subtitle', '"Test your knowledge and compete with thousands of PSC aspirants across Kerala"'::jsonb),
  ('landing_description', '"Join our daily quiz competitions, climb the leaderboard, and win exciting prizes while preparing for your PSC exams."'::jsonb),
  ('announcement', '{"enabled": false, "title": "", "message": ""}'::jsonb),
  ('quiz_schedule', '"Daily quizzes start at 9:00 AM and end at 9:00 PM"'::jsonb)
ON CONFLICT (key) DO NOTHING;