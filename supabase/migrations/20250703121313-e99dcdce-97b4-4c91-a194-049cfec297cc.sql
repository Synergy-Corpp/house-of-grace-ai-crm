
-- Create ai_chat_sessions table for storing AI chat history
CREATE TABLE public.ai_chat_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS)
ALTER TABLE public.ai_chat_sessions ENABLE ROW LEVEL SECURITY;

-- Create policy that allows users to view their own chat sessions
CREATE POLICY "Users can view their own chat sessions" 
  ON public.ai_chat_sessions 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create policy that allows users to create their own chat sessions
CREATE POLICY "Users can create their own chat sessions" 
  ON public.ai_chat_sessions 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create policy that allows users to update their own chat sessions
CREATE POLICY "Users can update their own chat sessions" 
  ON public.ai_chat_sessions 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create policy that allows users to delete their own chat sessions
CREATE POLICY "Users can delete their own chat sessions" 
  ON public.ai_chat_sessions 
  FOR DELETE 
  USING (auth.uid() = user_id);
