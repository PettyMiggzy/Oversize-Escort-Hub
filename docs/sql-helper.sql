-- Site helper: a small log used for rate limits and to see what people ask. Additive only. Server-side only (no browser access).
create table if not exists public.helper_usage (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  kind text not null check (kind in ('msg','ticket')),
  question text,
  created_at timestamptz not null default now()
);
create index if not exists helper_usage_key_idx on public.helper_usage (key, kind, created_at desc);
create index if not exists helper_usage_time_idx on public.helper_usage (created_at desc);
alter table public.helper_usage enable row level security;
revoke all on public.helper_usage from anon, authenticated;
