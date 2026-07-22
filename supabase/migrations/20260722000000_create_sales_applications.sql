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
  resume_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Add resume_url column if missing from existing table
ALTER TABLE public.sales_applications ADD COLUMN IF NOT EXISTS resume_url text;

-- 4. Enable Row Level Security on table
ALTER TABLE public.sales_applications ENABLE ROW LEVEL SECURITY;

-- 5. Re-create RLS Policies cleanly
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

-- 6. Storage Bucket for PDF CVs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('resumes', 'resumes', true, 10485760, ARRAY['application/pdf'])
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Allow anon upload resumes" ON storage.objects;
CREATE POLICY "Allow anon upload resumes" ON storage.objects
  FOR INSERT TO anon WITH CHECK (bucket_id = 'resumes');

-- FIX LINT 0025: Drop broad SELECT policy on storage.objects to prevent listing all files in the bucket
DROP POLICY IF EXISTS "Allow public read resumes" ON storage.objects;
