-- Create messages table for contact form submissions
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Anyone can insert messages
CREATE POLICY "Anyone can submit messages" 
ON public.messages 
FOR INSERT 
WITH CHECK (true);

-- Only admins can view messages
CREATE POLICY "Admins can view all messages" 
ON public.messages 
FOR SELECT 
USING (is_admin(auth.uid()));

-- Admins can update messages (mark as read)
CREATE POLICY "Admins can update messages" 
ON public.messages 
FOR UPDATE 
USING (is_admin(auth.uid()));

-- Admins can delete messages
CREATE POLICY "Admins can delete messages" 
ON public.messages 
FOR DELETE 
USING (is_admin(auth.uid()));