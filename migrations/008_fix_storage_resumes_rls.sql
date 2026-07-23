-- Migration: 008_fix_storage_resumes_rls.sql
-- Fix RLS policy on storage.objects table specifically for the 'resumes' bucket
-- Grants the anon role INSERT permission on storage.objects scoped strictly to bucket_id = 'resumes', allowing anonymous uploads without read/list/delete access.

BEGIN;

-- 1. Ensure storage.objects has RLS enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Allow anon upload resumes" ON storage.objects;
DROP POLICY IF EXISTS "Allow anon insert resumes" ON storage.objects;
DROP POLICY IF EXISTS "Anon Upload Resumes" ON storage.objects;

-- 3. Create INSERT policy on storage.objects for anon role scoped strictly to resumes bucket
CREATE POLICY "Allow anon upload resumes" ON storage.objects
  FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'resumes');

COMMIT;
