-- Consolidated migration for Alpha Orbit Careers Form
-- File: supabase/migrations/20260722000000_create_sales_applications.sql

BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.sales_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone_number text NOT NULL,
  linkedin_url text NOT NULL,
  current_role_company text NOT NULL,
  years_of_sales_experience text NOT NULL,
  relevant_experience text NOT NULL,
  why_fit text NOT NULL,
  expected_compensation text NOT NULL,
  availability text NOT NULL,
  resume_file_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sales_applications ADD COLUMN IF NOT EXISTS phone_number text;
ALTER TABLE public.sales_applications ADD COLUMN IF NOT EXISTS linkedin_url text;
ALTER TABLE public.sales_applications ADD COLUMN IF NOT EXISTS current_role_company text;
ALTER TABLE public.sales_applications ADD COLUMN IF NOT EXISTS years_of_sales_experience text;
ALTER TABLE public.sales_applications ADD COLUMN IF NOT EXISTS relevant_experience text;
ALTER TABLE public.sales_applications ADD COLUMN IF NOT EXISTS why_fit text;
ALTER TABLE public.sales_applications ADD COLUMN IF NOT EXISTS expected_compensation text;
ALTER TABLE public.sales_applications ADD COLUMN IF NOT EXISTS availability text;
ALTER TABLE public.sales_applications ADD COLUMN IF NOT EXISTS resume_file_name text;

ALTER TABLE public.sales_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon inserts with basic validation" ON public.sales_applications;
DROP POLICY IF EXISTS "Allow anon inserts" ON public.sales_applications;

CREATE POLICY "Allow anon inserts with basic validation" ON public.sales_applications
  FOR INSERT
  TO anon
  WITH CHECK (
    full_name IS NOT NULL AND trim(full_name) <> '' AND
    email IS NOT NULL AND position('@' in email) > 1
  );

DROP POLICY IF EXISTS "Allow anon reads for testing" ON public.sales_applications;
CREATE POLICY "Allow anon reads for testing" ON public.sales_applications
  FOR SELECT
  TO anon
  USING (true);

COMMIT;
