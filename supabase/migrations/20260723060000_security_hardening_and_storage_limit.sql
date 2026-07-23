-- Migration: 20260723060000_security_hardening_and_storage_limit.sql
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
