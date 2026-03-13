-- Add whatsapp_required column to quizzes table
ALTER TABLE public.quizzes 
ADD COLUMN IF NOT EXISTS whatsapp_required BOOLEAN DEFAULT false;
