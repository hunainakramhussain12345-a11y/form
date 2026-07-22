-- Supabase Migration: 20260722150000_add_resumes_bucket.sql
-- Create Supabase Storage Bucket for Candidate Resumes & CVs and add resume_url column
-- LINT FIX (0025_public_bucket_allows_listing): Dropped broad SELECT policy on storage.objects.
-- Because the bucket is public = true, individual object URLs are accessible publicly without exposing file listing.

-- 1. Insert bucket if missing
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resumes',
  'resumes',
  true,
  10485760, -- 10MB limit
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Add resume_url column to public.sales_applications table
ALTER TABLE public.sales_applications ADD COLUMN IF NOT EXISTS resume_url text;

-- 3. Storage Row Level Security (RLS) Policies for resumes bucket
-- Enable anonymous upload of PDF files to resumes bucket
DROP POLICY IF EXISTS "Allow anon upload resumes" ON storage.objects;
CREATE POLICY "Allow anon upload resumes" ON storage.objects
  FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'resumes');

-- FIX LINT 0025: Drop broad SELECT policy on storage.objects to prevent listing all files in the bucket
-- Public object URLs work automatically when public = true without exposing storage.objects table listing.
DROP POLICY IF EXISTS "Allow public read resumes" ON storage.objects;
