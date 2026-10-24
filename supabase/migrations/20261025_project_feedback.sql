-- Apply this migration in the Supabase SQL editor before enabling feedback submissions.
create table if not exists public.project_feedback (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  role text not null check (role in ('DPT student','Physiotherapist','Faculty','Other')),
  rating integer not null check (rating between 1 and 5),
  area text not null check (area in ('Overall experience','Study materials','Special tests','AI clinical reasoning','BCQs','Accessibility')),
  comment text not null check (char_length(comment) between 10 and 1500),
  contact text check (char_length(contact) <= 160)
);
alter table public.project_feedback enable row level security;
revoke all on public.project_feedback from anon, authenticated;
-- Service role bypasses RLS. Never expose the service role key to the browser.
