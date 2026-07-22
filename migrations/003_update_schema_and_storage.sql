-- SQL Migration: Update schema and storage limits for multi-role support
-- File: migrations/003_update_schema_and_storage.sql

BEGIN;

-- 1. Add new columns to public.sales_applications
ALTER TABLE public.sales_applications ADD COLUMN IF NOT EXISTS role_applied_for text;
ALTER TABLE public.sales_applications ADD COLUMN IF NOT EXISTS portfolio_url text;
ALTER TABLE public.sales_applications ADD COLUMN IF NOT EXISTS primary_skills text;
ALTER TABLE public.sales_applications ADD COLUMN IF NOT EXISTS project_description text;

-- Fill default for existing rows if any, then set default for role_applied_for
UPDATE public.sales_applications 
SET role_applied_for = 'Sales & Business Development' 
WHERE role_applied_for IS NULL;

-- 2. Make sales-specific fields nullable so non-sales roles can submit
ALTER TABLE public.sales_applications ALTER COLUMN years_of_sales_experience DROP NOT NULL;
ALTER TABLE public.sales_applications ALTER COLUMN relevant_experience DROP NOT NULL;
ALTER TABLE public.sales_applications ALTER COLUMN expected_compensation DROP NOT NULL;
ALTER TABLE public.sales_applications ALTER COLUMN why_fit DROP NOT NULL;
ALTER TABLE public.sales_applications ALTER COLUMN availability DROP NOT NULL;
ALTER TABLE public.sales_applications ALTER COLUMN current_role_company DROP NOT NULL;

-- 3. Update Supabase Storage Bucket for Candidate Resumes (3MB max limit, PDF only)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resumes',
  'resumes',
  true,
  3145728, -- 3MB limit (3 * 1024 * 1024 bytes)
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 3145728,
  allowed_mime_types = ARRAY['application/pdf'];

-- 4. Verify/Re-apply RLS policy for anon inserts on public.sales_applications
ALTER TABLE public.sales_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon inserts with basic validation" ON public.sales_applications;
CREATE POLICY "Allow anon inserts with basic validation" ON public.sales_applications
  FOR INSERT
  TO anon
  WITH CHECK (
    full_name IS NOT NULL AND trim(full_name) <> '' AND
    email IS NOT NULL AND position('@' in email) > 1
  );

COMMIT;
