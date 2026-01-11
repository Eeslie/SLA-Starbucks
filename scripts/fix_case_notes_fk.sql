-- Fix case_notes foreign key constraint
-- The table references "supportCase" but should reference "support_cases"

-- First, check if case_notes table exists and drop the old foreign key
DO $$
BEGIN
    -- Drop the old foreign key constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'case_notes_case_id_fkey'
    ) THEN
        ALTER TABLE case_notes DROP CONSTRAINT case_notes_case_id_fkey;
    END IF;
END $$;

-- Create case_notes table if it doesn't exist, or alter existing one
CREATE TABLE IF NOT EXISTS public.case_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id uuid NOT NULL,
  text text NOT NULL,
  at timestamptz DEFAULT now(),
  internal boolean DEFAULT true,
  author_id uuid,
  created_at timestamptz DEFAULT now()
);

-- Add foreign key constraint to support_cases (the actual table being used)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'case_notes_case_id_fkey'
        AND table_name = 'case_notes'
    ) THEN
        ALTER TABLE public.case_notes
        ADD CONSTRAINT case_notes_case_id_fkey 
        FOREIGN KEY (case_id) 
        REFERENCES public.support_cases(id) 
        ON DELETE CASCADE;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE public.case_notes ENABLE ROW LEVEL SECURITY;

-- Create policy if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'case_notes' 
        AND policyname = 'Enable all for case_notes'
    ) THEN
        CREATE POLICY "Enable all for case_notes" 
        ON public.case_notes 
        FOR ALL 
        USING (true) 
        WITH CHECK (true);
    END IF;
END $$;
