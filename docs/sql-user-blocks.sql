-- User blocking and user reports (App Store 1.2, Google Play user-generated content). Additive, safe to run twice.
-- Both tables are written and read by the server (service key) only.
create table if not exists public.user_blocks (
  blocker_id uuid not null,
  blocked_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
create index if not exists user_blocks_blocked_idx on public.user_blocks (blocked_id);
alter table public.user_blocks enable row level security;
revoke all on public.user_blocks from anon, authenticated;

create table if not exists public.user_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null,
  reported_id uuid not null,
  reason text not null,
  details text,
  created_at timestamptz not null default now(),
  check (reporter_id <> reported_id)
);
create index if not exists user_reports_reported_idx on public.user_reports (reported_id);
alter table public.user_reports enable row level security;
revoke all on public.user_reports from anon, authenticated;
