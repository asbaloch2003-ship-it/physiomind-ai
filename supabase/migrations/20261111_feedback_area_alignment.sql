-- Apply in the Supabase SQL Editor for existing PhysioSmart AI installations.
-- Align the database's permitted feedback areas with the public feedback form.
alter table public.project_feedback
  drop constraint if exists project_feedback_area_check;
alter table public.project_feedback
  add constraint project_feedback_area_check
  check (area in (
    'Overall experience','Study materials','Special tests',
    'AI clinical reasoning','BCQs','Accessibility',
    'History taking forms','Notes','Curriculum','Other'
  ));
