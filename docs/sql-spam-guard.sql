-- Already run on the live database (2026-10-26). Kept as the record. Safe to run again.
alter table public.loads add column if not exists source text;          -- 'quick_post' for loads posted without an account
alter table public.loads add column if not exists reviewed_at timestamptz; -- set when an admin has looked at it
create table if not exists public.load_reports (
  id uuid primary key default gen_random_uuid(),
  load_id uuid not null references public.loads(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null,
  created_at timestamptz not null default now(),
  unique (load_id, reporter_id)
);
alter table public.load_reports enable row level security;
revoke all on public.load_reports from anon, authenticated;
create index if not exists load_reports_load_idx on public.load_reports (load_id);
