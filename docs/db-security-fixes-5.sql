-- Run once in Supabase > SQL Editor. Safe to run again.
-- The veteran DD-214 flow wrote to two tables that were never created (dd214_submissions, veteran_discounts),
-- so every DD-214 upload failed after the profile had already been marked pending.
-- Both tables are only touched by the server (service key), so the browser gets no access at all.

create table if not exists public.dd214_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pdf_path text,
  document_url text,
  status text not null default 'pending',
  submitted_at timestamptz not null default now(),
  approved_at timestamptz
);
create table if not exists public.veteran_discounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  discount_percentage int not null default 30,
  created_at timestamptz not null default now()
);
create index if not exists dd214_submissions_user_idx on public.dd214_submissions (user_id);
create index if not exists veteran_discounts_user_idx on public.veteran_discounts (user_id);

alter table public.dd214_submissions enable row level security;
alter table public.veteran_discounts enable row level security;
revoke all on public.dd214_submissions from anon, authenticated;
revoke all on public.veteran_discounts from anon, authenticated;

-- stale links: nobody should keep a document link on a profile row other users can read
update public.profiles set bgc_document_url = null, dd214_url = null where bgc_document_url is not null or dd214_url is not null;

-- check: both tables exist and the browser has no access
select to_regclass('public.dd214_submissions') is not null as dd214_table,
       to_regclass('public.veteran_discounts') is not null as discount_table,
       has_table_privilege('authenticated', 'public.dd214_submissions', 'select') as signed_in_can_read_dd214;
