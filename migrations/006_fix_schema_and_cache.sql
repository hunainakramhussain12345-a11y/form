-- Migration: 006_fix_schema_and_cache.sql
-- Add missing columns (years_experience, experience_type, expected_comp, current_role), make non-required columns nullable, and reload PostgREST schema cache.

BEGIN;

-- 1. Add missing columns to public.sales_applications
ALTER TABLE public.sales_applications ADD COLUMN IF NOT EXISTS years_experience text;
ALTER TABLE public.sales_applications ADD COLUMN IF NOT EXISTS experience_type text;
ALTER TABLE public.sales_applications ADD COLUMN IF NOT EXISTS expected_comp text;
ALTER TABLE public.sales_applications ADD COLUMN IF NOT EXISTS current_role text;

-- 2. Ensure non-required columns are NULLABLE
ALTER TABLE public.sales_applications ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE public.sales_applications ALTER COLUMN phone_number DROP NOT NULL;
ALTER TABLE public.sales_applications ALTER COLUMN current_role_company DROP NOT NULL;
ALTER TABLE public.sales_applications ALTER COLUMN years_of_sales_experience DROP NOT NULL;
ALTER TABLE public.sales_applications ALTER COLUMN relevant_experience DROP NOT NULL;
ALTER TABLE public.sales_applications ALTER COLUMN why_fit DROP NOT NULL;
ALTER TABLE public.sales_applications ALTER COLUMN expected_compensation DROP NOT NULL;
ALTER TABLE public.sales_applications ALTER COLUMN availability DROP NOT NULL;
ALTER TABLE public.sales_applications ALTER COLUMN portfolio_url DROP NOT NULL;
ALTER TABLE public.sales_applications ALTER COLUMN primary_skills DROP NOT NULL;
ALTER TABLE public.sales_applications ALTER COLUMN project_description DROP NOT NULL;
ALTER TABLE public.sales_applications ALTER COLUMN role_other_text DROP NOT NULL;

-- 3. Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';

COMMIT;
