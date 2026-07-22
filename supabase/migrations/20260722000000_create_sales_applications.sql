-- Supabase Migration: 20260722000000_create_sales_applications.sql
-- Create public.sales_applications table and RLS policies for Alpha Orbit Careers Form

-- 1. Ensure pgcrypto extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create table public.sales_applications
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

-- 3. Enable Row Level Security
ALTER TABLE public.sales_applications ENABLE ROW LEVEL SECURITY;

-- 4. Re-create RLS Policies cleanly
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
