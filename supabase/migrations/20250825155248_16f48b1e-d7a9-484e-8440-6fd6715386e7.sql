-- Add user_id to chats table
ALTER TABLE public.chats ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Add user_id to messages table  
ALTER TABLE public.messages ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Update RLS policies for chats - users can only see their own chats
DROP POLICY IF EXISTS "Allow all operations on chats" ON public.chats;

CREATE POLICY "Users can view their own chats" 
ON public.chats 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own chats" 
ON public.chats 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chats" 
ON public.chats 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chats" 
ON public.chats 
FOR DELETE 
USING (auth.uid() = user_id);

-- Update RLS policies for messages - users can only see messages from their own chats
DROP POLICY IF EXISTS "Allow all operations on messages" ON public.messages;

CREATE POLICY "Users can view messages from their own chats" 
ON public.messages 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create messages in their own chats" 
ON public.messages 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own messages" 
ON public.messages 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages" 
ON public.messages 
FOR DELETE 
USING (auth.uid() = user_id);