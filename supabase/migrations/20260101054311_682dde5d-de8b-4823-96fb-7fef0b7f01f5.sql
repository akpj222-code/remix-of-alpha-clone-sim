-- Create support messages table
CREATE TABLE public.support_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  is_from_admin BOOLEAN NOT NULL DEFAULT false,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- Users can view their own messages
CREATE POLICY "Users can view own messages" 
ON public.support_messages 
FOR SELECT 
USING (auth.uid() = user_id);

-- Users can send messages
CREATE POLICY "Users can send messages" 
ON public.support_messages 
FOR INSERT 
WITH CHECK (auth.uid() = user_id AND is_from_admin = false);

-- Admins can view all messages
CREATE POLICY "Admins can view all messages" 
ON public.support_messages 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can insert messages (replies)
CREATE POLICY "Admins can send messages" 
ON public.support_messages 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update messages (mark as read)
CREATE POLICY "Admins can update messages" 
ON public.support_messages 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for support messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;