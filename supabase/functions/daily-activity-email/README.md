# Daily Activity Email Edge Function

This Edge Function sends daily activity summary emails to all users who have email notifications enabled.

## Setup

1. **Deploy the function:**
   ```bash
   supabase functions deploy daily-activity-email
   ```

2. **Environment variables are automatically provided by Supabase:**
   - `SUPABASE_URL` - Automatically set by Supabase
   - `SUPABASE_SERVICE_ROLE_KEY` - Automatically set by Supabase
   - If you need to override them, go to: **Project Settings → Edge Functions → Secrets**

3. **Update the cron job migration:**
   - Edit `supabase/migrations/20251223000004_daily_email_notifications.sql`
   - Replace `YOUR_PROJECT_REF` with your actual project reference
   - Replace `YOUR_SERVICE_ROLE_KEY` with your service role key
   - Or use the settings approach (Option 1) and set them via Supabase dashboard

4. **Run the migration:**
   ```bash
   supabase db push
   ```

## How It Works

1. **pg_cron** runs daily at midnight UTC (7 PM EST / 8 PM EDT)
2. It calls this Edge Function via HTTP
3. The function:
   - Gets all users with email notifications enabled
   - For each user, collects activity from the last 24 hours:
     - New workouts from friends
     - Comments on their workouts
     - Reactions (fist bumps) on their workouts
   - Calls the `send-email` Edge Function to send each user's summary

## Customization

- **Change schedule time**: Edit the cron expression in the migration (`'0 0 * * *'` = midnight UTC = 7 PM EST)
- **Cron format**: `minute hour day month weekday` (e.g., `'0 0 * * *'` = midnight UTC daily)
- **Email content**: Edit the `generateEmailHTML` function in `index.ts`

## Testing

You can manually trigger the function to test:

```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/daily-activity-email \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

