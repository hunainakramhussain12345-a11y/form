-- Migration: 009_security_hardening_and_storage_limit.sql
-- 1. Update storage bucket file_size_limit for 'resumes' to 5MB (5242880 bytes).
-- 2. Revoke EXECUTE privileges on public.notify_resend_on_application_insert() from PUBLIC, anon, and authenticated roles.
-- 3. Set explicit fixed search_path on public.notify_resend_on_application_insert().
-- 4. Move pg_net extension out of public schema to extensions schema per Supabase security advisor recommendations.

BEGIN;

-- 1. Update storage.buckets file_size_limit to 5MB (5242880 bytes)
UPDATE storage.buckets 
SET file_size_limit = 5242880,
    allowed_mime_types = ARRAY['application/pdf']::text[],
    public = true
WHERE id = 'resumes';

-- 2. Revoke EXECUTE permission from PUBLIC, anon, and authenticated on notify_resend_on_application_insert
REVOKE EXECUTE ON FUNCTION public.notify_resend_on_application_insert() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_resend_on_application_insert() FROM anon;
REVOKE EXECUTE ON FUNCTION public.notify_resend_on_application_insert() FROM authenticated;

-- 3. Set explicit fixed search_path to resolve mutable search_path warning
ALTER FUNCTION public.notify_resend_on_application_insert() SET search_path = public, pg_temp;

-- 4. Move pg_net extension out of public schema to extensions schema
CREATE SCHEMA IF NOT EXISTS extensions;
ALTER EXTENSION pg_net SET SCHEMA extensions;

COMMIT;

-- ----------------------------------------------------
-- VERIFICATION QUERIES
-- ----------------------------------------------------

-- Query 1: Verify storage bucket configuration
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id = 'resumes';

-- Query 2: Verify function privileges (Should return 0 rows for anon/authenticated/PUBLIC)
SELECT grantee, privilege_type
FROM information_schema.routine_privileges
WHERE routine_name = 'notify_resend_on_application_insert';

-- Query 3: Verify function search_path (proconfig should contain search_path=public, pg_temp)
SELECT proname, proconfig
FROM pg_proc
WHERE proname = 'notify_resend_on_application_insert';

-- Query 4: Verify pg_net extension schema (schema_name should be 'extensions')
SELECT extname, nspname AS schema_name
FROM pg_extension e
JOIN pg_namespace n ON n.oid = e.extnamespace
WHERE extname = 'pg_net';
