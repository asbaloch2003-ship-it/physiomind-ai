# Feedback collection setup

The public feedback page is at /feedback. It requires a server-side Supabase connection before submissions can be saved.

1. In your Supabase project's SQL editor, run `supabase/migrations/20261025_project_feedback.sql`.
2. In Vercel > Project > Settings > Environment Variables, set:
   - `SUPABASE_URL` = your project's Supabase URL
   - `SUPABASE_SERVICE_ROLE_KEY` = your project's **secret service role** key
3. Redeploy, then submit a test response from /feedback.
4. View submissions in Supabase > Table Editor > project_feedback. Keep the table private and limit team access.

**Security:** Never prefix the service role key with VITE_ and never put it in client code. Feedback is optional and contact information should be used only for requested follow-up. Establish a retention/deletion policy and add stronger rate limiting or CAPTCHA before wide public promotion. Avoid patient information. The server stores no IP address in the feedback table.

If environment variables or the table are missing, the form will display a submission error rather than falsely confirming success.
