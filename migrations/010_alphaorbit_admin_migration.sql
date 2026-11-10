-- ============================================================================
-- Migration: 010_alphaorbit_admin_migration.sql
-- Description: Sets up the sales_applications table, storage bucket, RLS policies,
--              and onboarding/review columns for the Alpha Orbit Admin Panel.
-- Domain: mail.thealphaorbit.com / career.thealphaorbit.com
-- ============================================================================

BEGIN;

-- Ensure pgcrypto extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Create table public.sales_applications if it doesn't already exist
CREATE TABLE IF NOT EXISTS public.sales_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone_number text NOT NULL,
  linkedin_url text NOT NULL,
  role_applied_for text NOT NULL,
  role_other_text text,
  privacy_accepted boolean NOT NULL DEFAULT true,
  years_of_sales_experience text,
  relevant_experience text,
  why_fit text,
  expected_compensation text,
  availability text,
  primary_skills text,
  project_description text,
  portfolio_url text,
  resume_file_name text,
  resume_url text,
  -- Admin Panel Onboarding & Management Fields:
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'interview_scheduled', 'selected', 'rejected', 'onboarded')),
  admin_notes text,
  reviewed_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Ensure all columns exist (in case table was partially created previously)
ALTER TABLE public.sales_applications ADD COLUMN IF NOT EXISTS role_applied_for text;
ALTER TABLE public.sales_applications ADD COLUMN IF NOT EXISTS role_other_text text;
ALTER TABLE public.sales_applications ADD COLUMN IF NOT EXISTS privacy_accepted boolean DEFAULT true;
ALTER TABLE public.sales_applications ADD COLUMN IF NOT EXISTS primary_skills text;
ALTER TABLE public.sales_applications ADD COLUMN IF NOT EXISTS project_description text;
ALTER TABLE public.sales_applications ADD COLUMN IF NOT EXISTS portfolio_url text;
ALTER TABLE public.sales_applications ADD COLUMN IF NOT EXISTS resume_file_name text;
ALTER TABLE public.sales_applications ADD COLUMN IF NOT EXISTS resume_url text;
ALTER TABLE public.sales_applications ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';
ALTER TABLE public.sales_applications ADD COLUMN IF NOT EXISTS admin_notes text;
ALTER TABLE public.sales_applications ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id);
ALTER TABLE public.sales_applications ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.sales_applications ENABLE ROW LEVEL SECURITY;

-- 4. Candidate Anonymous Submission Policy (INSERT only)
DROP POLICY IF EXISTS "Allow anon inserts with basic validation" ON public.sales_applications;
DROP POLICY IF EXISTS "Allow anon inserts" ON public.sales_applications;

CREATE POLICY "Allow anon inserts with basic validation" ON public.sales_applications
  FOR INSERT
  TO anon
  WITH CHECK (
    full_name IS NOT NULL AND trim(full_name) <> '' AND
    email IS NOT NULL AND position('@' in email) > 1
  );

-- 5. Authenticated Admin Policy (Full Access for Admin Panel dashboard)
DROP POLICY IF EXISTS "Allow authenticated admin full access" ON public.sales_applications;

CREATE POLICY "Allow authenticated admin full access" ON public.sales_applications
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 6. Configure Storage Bucket for Resumes (5MB limit, PDF only)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resumes',
  'resumes',
  true,
  5242880, -- 5MB limit (5 * 1024 * 1024 bytes)
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['application/pdf'];

-- 7. Storage Policies: Allow anon upload & public read
DROP POLICY IF EXISTS "anon_resume_upload" ON storage.objects;
DROP POLICY IF EXISTS "Allow public resume upload" ON storage.objects;

CREATE POLICY "anon_resume_upload" ON storage.objects
  FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'resumes');

DROP POLICY IF EXISTS "Allow public resume read" ON storage.objects;
CREATE POLICY "Allow public resume read" ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'resumes');

COMMIT;
