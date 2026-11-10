-- ============================================================================
-- Migration: 011_create_job_postings.sql
-- Description: Dynamic hiring posts management for Alpha Orbit Admin Panel
--              and public Careers application form.
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.job_postings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,                      -- e.g. "Sales Executive", "Intern (All Niches)", "Agentic AI Expert"
  department text NOT NULL,                 -- e.g. "Sales & BD", "Internships", "AI Engineering"
  job_type text NOT NULL DEFAULT 'Full-time', -- "Full-time", "Internship", "Contract", "Part-time"
  location text NOT NULL DEFAULT 'Remote',
  description text,
  requirements text[] DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;

-- 1. Public / Anon can view active job postings
DROP POLICY IF EXISTS "Allow public read active job postings" ON public.job_postings;
CREATE POLICY "Allow public read active job postings" ON public.job_postings
  FOR SELECT TO public
  USING (is_active = true);

-- 2. Authenticated Admin full CRUD access
DROP POLICY IF EXISTS "Allow admin full access to job postings" ON public.job_postings;
CREATE POLICY "Allow admin full access to job postings" ON public.job_postings
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- 3. Seed Initial Openings requested: Sales Executive, Intern (All Niches), Agentic AI Expert
INSERT INTO public.job_postings (title, department, job_type, location, is_active, featured, description)
VALUES 
  (
    'Sales Executive',
    'Sales & Business Development',
    'Full-time',
    'Remote',
    true,
    true,
    'Drive client acquisition, high-ticket digital service closures, and pipeline growth for Alpha Orbit.'
  ),
  (
    'Intern (All Niches)',
    'Internship Program',
    'Internship',
    'Remote',
    true,
    true,
    'Fast-track internship opportunity across Development, UI/UX Design, SEO, Video Editing, or Business Ops.'
  ),
  (
    'Agentic AI Expert',
    'Artificial Intelligence',
    'Full-time',
    'Remote',
    true,
    true,
    'Architect and implement cutting-edge autonomous AI agents, multi-agent workflows, and enterprise LLM integrations.'
  );

COMMIT;
