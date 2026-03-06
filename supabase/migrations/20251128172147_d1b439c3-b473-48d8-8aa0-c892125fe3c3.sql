-- Add show_leaderboard column to quizzes table for controlling visibility
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS show_leaderboard boolean DEFAULT true;