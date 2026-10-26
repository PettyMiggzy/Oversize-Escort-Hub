-- Already run on the live database (2026-10-26). Kept here as the record. Safe to run again.
-- Holds a carrier's load until they click the link in their email. Only the server can read or write it.
create table if not exists public.quick_post_drafts (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  email text not null,
  payload jsonb not null,
  ip_hash text,
  created_at timestamptz not null default now(),
  used_at timestamptz,
  user_id uuid,
  password_set_at timestamptz
);
alter table public.quick_post_drafts enable row level security;
revoke all on public.quick_post_drafts from anon, authenticated;
create index if not exists quick_post_drafts_email_idx on public.quick_post_drafts (email, created_at);
create index if not exists quick_post_drafts_ip_idx on public.quick_post_drafts (ip_hash, created_at);
