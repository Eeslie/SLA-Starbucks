-- Fix sla_rules table schema
-- Adds missing condition_field and condition_value columns if they don't exist

-- Create sla_rules table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.sla_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  response_mins integer DEFAULT 60,
  resolution_mins integer DEFAULT 480,
  created_at timestamptz DEFAULT now()
);

-- Add condition_field column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'sla_rules' 
        AND column_name = 'condition_field'
    ) THEN
        ALTER TABLE public.sla_rules ADD COLUMN condition_field text;
    END IF;
END $$;

-- Add condition_value column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'sla_rules' 
        AND column_name = 'condition_value'
    ) THEN
        ALTER TABLE public.sla_rules ADD COLUMN condition_value text;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE public.sla_rules ENABLE ROW LEVEL SECURITY;

-- Create policy if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public'
        AND tablename = 'sla_rules' 
        AND policyname = 'Enable all for sla_rules'
    ) THEN
        CREATE POLICY "Enable all for sla_rules" 
        ON public.sla_rules 
        FOR ALL 
        USING (true) 
        WITH CHECK (true);
    END IF;
END $$;

-- Grant permissions
GRANT ALL ON public.sla_rules TO anon, authenticated;
