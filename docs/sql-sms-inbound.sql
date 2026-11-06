-- One row per inbound text, so one number (or the whole line) cannot flood us. Only the server can read or write it.
create table if not exists public.sms_inbound (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  created_at timestamptz not null default now()
);
alter table public.sms_inbound enable row level security;
revoke all on public.sms_inbound from anon, authenticated;
create index if not exists sms_inbound_phone_idx on public.sms_inbound (phone, created_at);
create index if not exists sms_inbound_created_idx on public.sms_inbound (created_at);
