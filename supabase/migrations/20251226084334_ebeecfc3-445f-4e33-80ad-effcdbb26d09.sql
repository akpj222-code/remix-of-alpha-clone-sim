-- Create killswitch table for managing site states
CREATE TABLE public.killswitch (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_name TEXT NOT NULL UNIQUE,
  site_url TEXT NOT NULL,
  is_killed BOOLEAN NOT NULL DEFAULT false,
  killed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.killswitch ENABLE ROW LEVEL SECURITY;

-- Allow public read access (so sites can check their status)
CREATE POLICY "Anyone can read killswitch status"
ON public.killswitch
FOR SELECT
USING (true);

-- Only allow updates/inserts from authenticated users (we'll add developer check in code)
CREATE POLICY "Authenticated users can update killswitch"
ON public.killswitch
FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert killswitch"
ON public.killswitch
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Insert TAMIC Group as the first site
INSERT INTO public.killswitch (site_name, site_url, is_killed)
VALUES ('TAMIC Group', 'https://tamic-group.lovable.app', false);

-- Create trigger for updated_at
CREATE TRIGGER update_killswitch_updated_at
BEFORE UPDATE ON public.killswitch
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();