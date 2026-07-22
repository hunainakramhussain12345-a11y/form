-- Supabase Migration: 20260722160000_add_application_webhook.sql
-- Create Database Webhook trigger on sales_applications INSERT to invoke send-application-email Edge Function

-- 1. Enable pg_net extension for asynchronous HTTP requests from Postgres
CREATE EXTENSION IF NOT EXISTS "pg_net";

-- 2. Create trigger function to post new row to Edge Function
CREATE OR REPLACE FUNCTION public.notify_resend_on_application_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  edge_function_url text := 'https://qitgpnugxjameulzhyoq.supabase.co/functions/v1/send-application-email';
  anon_key text := 'sb_publishable_4nl0cEZLLKWa_yRG0AC4vw_juKltkmM';
BEGIN
  PERFORM net.http_post(
    url := edge_function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || anon_key
    ),
    body := jsonb_build_object(
      'type', TG_OP,
      'table', TG_TABLE_NAME,
      'record', row_to_json(NEW)
    )
  );
  RETURN NEW;
END;
$$;

-- 3. Create database trigger on sales_applications INSERT
DROP TRIGGER IF EXISTS tr_notify_resend_on_application_insert ON public.sales_applications;
CREATE TRIGGER tr_notify_resend_on_application_insert
  AFTER INSERT ON public.sales_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_resend_on_application_insert();
