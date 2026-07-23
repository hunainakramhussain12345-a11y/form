-- Migration: 20260723020000_add_privacy_accepted.sql
-- Add privacy_accepted column (boolean, NOT NULL, DEFAULT false) and enforce in CHECK constraint & RLS policy

BEGIN;

-- 1. Add privacy_accepted column to public.sales_applications
ALTER TABLE public.sales_applications 
ADD COLUMN IF NOT EXISTS privacy_accepted boolean NOT NULL DEFAULT false;

-- 2. Update existing rows so they pass the check constraint
UPDATE public.sales_applications 
SET privacy_accepted = true 
WHERE privacy_accepted IS NOT TRUE;

-- 3. Add CHECK constraint requiring privacy_accepted = true
ALTER TABLE public.sales_applications 
DROP CONSTRAINT IF EXISTS chk_privacy_accepted_true;

ALTER TABLE public.sales_applications 
ADD CONSTRAINT chk_privacy_accepted_true CHECK (privacy_accepted = true);

-- 4. Update Row Level Security (RLS) INSERT policy
ALTER TABLE public.sales_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon inserts with basic validation" ON public.sales_applications;
CREATE POLICY "Allow anon inserts with basic validation" ON public.sales_applications
  FOR INSERT
  TO anon
  WITH CHECK (
    full_name IS NOT NULL AND trim(full_name) <> '' AND
    email IS NOT NULL AND position('@' in email) > 1 AND
    privacy_accepted IS TRUE
  );

COMMIT;
