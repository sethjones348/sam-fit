-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule daily email job (runs at midnight UTC = 7 PM EST / 8 PM EDT)
-- This calls the daily-activity-email Edge Function which handles all the email sending
-- 
-- IMPORTANT: Before running this migration, you need to:
-- 1. Deploy the daily-activity-email Edge Function
-- 2. Replace YOUR_PROJECT_REF below with your actual Supabase project reference
-- 3. Replace YOUR_SERVICE_ROLE_KEY below with your service role key (from Settings → API)
--
-- To find your project ref: Supabase Dashboard → Settings → General → Reference ID
-- To find service role key: Supabase Dashboard → Settings → API → service_role key

SELECT cron.schedule(
  'daily-activity-emails',
  '0 0 * * *',  -- Midnight UTC = 7 PM EST (previous day) / 8 PM EDT (previous day)
  $$
  SELECT
    net.http_post(
      url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/daily-activity-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
      )::text,
      body := '{}'::text
    ) as request_id;
  $$
);

-- To unschedule (if needed):
-- SELECT cron.unschedule('daily-activity-emails');

-- To view scheduled jobs:
-- SELECT * FROM cron.job;
