-- Migration to run in the OLD Supabase project to stop anon form writes
-- Run this in the OLD project's SQL editor.

BEGIN;

-- Remove any permissive anon policy, then require authenticated inserts
DROP POLICY IF EXISTS "Allow anon inserts" ON public.sales_applications;
DROP POLICY IF EXISTS "Require authenticated inserts" ON public.sales_applications;

CREATE POLICY "Require authenticated inserts" ON public.sales_applications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

COMMIT;

-- Rollback (if needed):
-- DROP POLICY IF EXISTS "Require authenticated inserts" ON public.sales_applications;
-- -- Optionally re-create a permissive policy if you intentionally want anon inserts
