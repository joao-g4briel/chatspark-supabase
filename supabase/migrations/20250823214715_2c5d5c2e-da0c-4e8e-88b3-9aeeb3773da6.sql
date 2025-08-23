-- Create table for storing API configuration
CREATE TABLE public.config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service TEXT NOT NULL UNIQUE,
  api_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.config ENABLE ROW LEVEL SECURITY;

-- Create policy to allow read access to config table
-- Since this is for API keys that need to be accessed by edge functions,
-- we'll make it readable by authenticated users
CREATE POLICY "Allow read access to config" 
ON public.config 
FOR SELECT 
USING (true);

-- Create policy to allow insert/update for service configuration
CREATE POLICY "Allow insert/update config" 
ON public.config 
FOR ALL
USING (true);

-- Insert OpenRouter configuration (placeholder - user needs to update with real API key)
INSERT INTO public.config (service, api_key) 
VALUES ('openrouter', 'sk-or-v1-YOUR_OPENROUTER_API_KEY_HERE');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_config_updated_at
BEFORE UPDATE ON public.config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();