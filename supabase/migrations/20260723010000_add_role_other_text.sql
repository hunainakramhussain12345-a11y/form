-- Migration: 20260723010000_add_role_other_text.sql
-- Add role_other_text column for custom "Other" role submissions

BEGIN;

ALTER TABLE public.sales_applications 
ADD COLUMN IF NOT EXISTS role_other_text text;

COMMIT;
