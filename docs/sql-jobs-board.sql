-- Job posts board (table is job_posts: 'jobs' already holds escorts work logs) (fleets and escorts hiring subcontractors or drivers). Additive only: two new tables, nothing existing is changed.
-- Run in Supabase > SQL Editor, or tell Claude to run it. Safe to run twice.
create table if not exists public.job_posts (
  id uuid primary key default gen_random_uuid(),
  poster_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  company text,
  description text,
  classification text not null default '1099' check (classification in ('1099','w2','either')),
  equipment text not null check (equipment in ('bring_own','company_vehicle','company_gear','either')),
  pay_model text not null check (pay_model in ('percent','weekly_flat','day_rate','per_mile','hourly','negotiable')),
  pay_min numeric,
  pay_max numeric,
  pay_note text,
  schedule text not null default 'on_call' check (schedule in ('full_time','part_time','on_call')),
  travel text not null default 'regional' check (travel in ('local','regional','nationwide')),
  base_city text,
  base_state text,
  states text[] not null default '{}',
  cert_types text[] not null default '{}',
  start_date date,
  status text not null default 'open' check (status in ('open','filled','closed','removed')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days')
);
create index if not exists job_posts_open_idx on public.job_posts (status, created_at desc);
create index if not exists job_posts_state_idx on public.job_posts (base_state);
create index if not exists job_posts_poster_idx on public.job_posts (poster_id);
alter table public.job_posts enable row level security;
revoke all on public.job_posts from anon, authenticated;
grant select on public.job_posts to anon, authenticated;
-- anyone can read open, unexpired jobs; a poster also sees their own. All writes go through the server.
do $$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='job_posts' and policyname='Open job posts are public') then execute $q$create policy "Open job posts are public" on public.job_posts for select to anon, authenticated
  using (status = 'open' and (expires_at is null or expires_at > now()))$q$; end if; end $$;
do $$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='job_posts' and policyname='Posters see their own job posts') then execute $q$create policy "Posters see their own job posts" on public.job_posts for select to authenticated using (poster_id = auth.uid())$q$; end if; end $$;

create table if not exists public.job_applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.job_posts(id) on delete cascade,
  applicant_id uuid not null references public.profiles(id) on delete cascade,
  message text,
  status text not null default 'new' check (status in ('new','accepted','declined','withdrawn')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, applicant_id)
);
create index if not exists job_apps_job_idx on public.job_applications (job_id);
create index if not exists job_apps_applicant_idx on public.job_applications (applicant_id);
alter table public.job_applications enable row level security;
revoke all on public.job_applications from anon, authenticated;
grant select on public.job_applications to authenticated;
do $$ begin if not exists (select 1 from pg_policies where schemaname='public' and tablename='job_applications' and policyname='Parties see applications') then execute $q$create policy "Parties see applications" on public.job_applications for select to authenticated
  using (applicant_id = auth.uid() or exists (select 1 from public.job_posts j where j.id = job_id and j.poster_id = auth.uid()))$q$; end if; end $$;
