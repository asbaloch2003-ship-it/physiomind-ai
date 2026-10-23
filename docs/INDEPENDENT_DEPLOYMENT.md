# Independent deployment checklist (no Lovable credits)

This repository uses TanStack Start, React 19, Supabase authentication, and server functions. It is **not** a static-only Vite site. Do not deploy the output as a static SPA.

## Before deployment
1. Create an independent Supabase project on its free tier. Apply the repository's existing database migrations after reviewing them. Enable email authentication.
2. Configure the hosting provider with `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_URL`, and `SUPABASE_PUBLISHABLE_KEY` as appropriate for the server and browser. Publishable keys are public; never expose the service-role/secret key in Vite variables.
3. Configure Supabase Authentication > URL Configuration: Site URL and allowed redirect URLs must include the deployed origin, `/auth`, and `/reset-password`.
4. Configure Google OAuth only if desired; the button alone does not mean the provider is enabled.
5. Choose a host/runtime that supports TanStack Start SSR/server functions and verify the Nitro deployment preset. The current Lovable Vite config defaults to Cloudflare; do not assume it can be deployed to Vercel without an adapter/configuration change.
6. Test signup, email verification, login, logout, password reset, protected dashboard, per-user RLS, and saved BCQ activity.
7. Check the clinical simulator: the current UI is a scripted teaching case, **not** a live AI model. Do not describe it as live AI until a secure server-side model integration exists.

## Security
- Never commit API keys, database passwords, service-role keys, or patient identifiers.
- Keep row-level security enabled on student records and test access across two separate student accounts.
- Treat AI clinical outputs as educational, require red-flag escalation, and avoid real patient identifiable information.

## Current status
This file is a deployment plan, **not proof of a successful production deployment**. The production URL, live authentication, and database state must be verified separately.
