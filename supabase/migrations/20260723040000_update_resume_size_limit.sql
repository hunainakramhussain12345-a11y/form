-- Migration: 20260723040000_update_resume_size_limit.sql
-- Update storage bucket file_size_limit for 'resumes' to 5MB (5242880 bytes) and enforce application/pdf allowed mime types.

BEGIN;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resumes', 
  'resumes', 
  true, 
  5242880, 
  ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO UPDATE SET 
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['application/pdf']::text[],
  public = true;

-- Ensure public read and anon upload RLS policies
DROP POLICY IF EXISTS "Allow anon upload resumes" ON storage.objects;
CREATE POLICY "Allow anon upload resumes" ON storage.objects
  FOR INSERT TO anon
  WITH CHECK (bucket_id = 'resumes');

DROP POLICY IF EXISTS "Allow public read resumes" ON storage.objects;
CREATE POLICY "Allow public read resumes" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'resumes');

COMMIT;
