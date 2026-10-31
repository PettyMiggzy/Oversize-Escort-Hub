-- Wraith voice assistant subscription (paid add-on). Additive, safe to run twice. Server (service key) only.
create table if not exists public.wraith_access (
  user_id uuid primary key,
  status text not null default 'active',
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);
create index if not exists wraith_access_sub_idx on public.wraith_access (stripe_subscription_id);
alter table public.wraith_access enable row level security;
revoke all on public.wraith_access from anon, authenticated;
