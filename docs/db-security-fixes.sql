-- Database fixes for Oversize Escort Hub. Run in the Supabase SQL Editor of THIS app's project (rcdezyugannbyqqtowrc).
-- Run STEP 0 first (read-only) and look at it, then run STEPS 1 to 4 together.

-- STEP 0 (read only): accounts that already have more access than a normal signup
select email, role, tier, pevo_verified, p_evo_verified, bgc_verified, suspended, created_at
from public.profiles
where (role is distinct from 'escort' and role is distinct from 'carrier' and role is distinct from 'broker')
   or tier is distinct from 'free' or pevo_verified or p_evo_verified or bgc_verified
order by created_at;

-- STEP 1: columns the code already writes but the database never had
alter table public.profiles
  add column if not exists tier_updated_at timestamptz,
  add column if not exists stripe_subscription_id text,
  add column if not exists dd214_pending boolean not null default false,
  add column if not exists dd214_url text,
  add column if not exists verified_tier integer,
  add column if not exists tier1_pending boolean not null default false,
  add column if not exists tier2_pending boolean not null default false;

-- STEP 2: tables the code uses that do not exist (job log and fleet search)
create table if not exists public.job_logs (
  id uuid primary key default gen_random_uuid(),
  escort_id uuid not null references auth.users(id) on delete cascade,
  load_id text,
  mileage numeric not null default 0,
  expenses jsonb,
  notes text,
  logged_at timestamptz not null default now()
);
alter table public.job_logs enable row level security;
drop policy if exists job_logs_own_select on public.job_logs;
create policy job_logs_own_select on public.job_logs for select using (auth.uid() = escort_id);
drop policy if exists job_logs_own_insert on public.job_logs;
create policy job_logs_own_insert on public.job_logs for insert with check (auth.uid() = escort_id);

create table if not exists public.fleet_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  escort_count integer,
  created_at timestamptz not null default now()
);
alter table public.fleet_searches enable row level security;
drop policy if exists fleet_searches_own_select on public.fleet_searches;
create policy fleet_searches_own_select on public.fleet_searches for select using (auth.uid() = user_id);
drop policy if exists fleet_searches_own_insert on public.fleet_searches;
create policy fleet_searches_own_insert on public.fleet_searches for insert with check (auth.uid() = user_id);

-- STEP 3: a signed-in user can no longer give themselves a plan, a role, a badge, or lift a suspension.
-- The server (service key), admins and the SQL editor are unaffected.
create or replace function public.protect_profile_columns()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  caller_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  privileged boolean;
begin
  privileged :=
       coalesce(auth.role(), '') = 'service_role'
    or auth.uid() is null
    or caller_email in ('bahmed3170@gmail.com', 'brian@precisionpilotservices.com')
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin');
  if privileged then return new; end if;

  if tg_op = 'INSERT' then
    if new.role is null or new.role not in ('escort', 'carrier', 'broker') then new.role := 'escort'; end if;
    new.tier := 'free';
    new.tier_updated_at := null; new.stripe_customer_id := null; new.stripe_subscription_id := null;
    new.p_evo_verified := false; new.pevo_verified := false; new.bgc_verified := false;
    new.vehicle_verified := false; new.admin_verified := false; new.suspended := false;
    new.bgc_paid := false; new.pevo_paid := false; new.bgc_pending := false; new.bgc_document_url := null;
    new.dd214_pending := false; new.dd214_url := null; new.verified_tier := null;
    new.tier1_pending := false; new.tier2_pending := false;
    new.rating := 0; new.avg_rating := 0; new.review_count := 0; new.total_jobs := 0; new.reliability_score := 0;
  else
    new.role := old.role; new.tier := old.tier; new.tier_updated_at := old.tier_updated_at;
    new.stripe_customer_id := old.stripe_customer_id; new.stripe_subscription_id := old.stripe_subscription_id;
    new.p_evo_verified := old.p_evo_verified; new.pevo_verified := old.pevo_verified;
    new.bgc_verified := old.bgc_verified; new.vehicle_verified := old.vehicle_verified;
    new.admin_verified := old.admin_verified; new.suspended := old.suspended;
    new.bgc_paid := old.bgc_paid; new.pevo_paid := old.pevo_paid;
    new.bgc_pending := old.bgc_pending; new.bgc_document_url := old.bgc_document_url;
    new.dd214_pending := old.dd214_pending; new.dd214_url := old.dd214_url; new.verified_tier := old.verified_tier;
    new.tier1_pending := old.tier1_pending; new.tier2_pending := old.tier2_pending;
    new.rating := old.rating; new.avg_rating := old.avg_rating; new.review_count := old.review_count;
    new.total_jobs := old.total_jobs; new.reliability_score := old.reliability_score;
  end if;
  return new;
end $$;

drop trigger if exists protect_profile_columns on public.profiles;
create trigger protect_profile_columns before insert or update on public.profiles
  for each row execute function public.protect_profile_columns();

-- STEP 4: logged-out visitors can see public profile fields only (no email, phone, payment or document columns),
-- and the device fingerprint table is no longer open to the public key.
revoke select on public.profiles from anon;
grant select (id, created_at, full_name, company_name, role, tier, bio, vehicle, states_licensed, state,
  p_evo_verified, pevo_verified, bgc_verified, vehicle_verified, admin_verified, rating, avg_rating, review_count,
  total_jobs, reliability_score, response_time, is_available, avatar_url, availability_states, fmcsa_verified,
  req_high_pole, req_route_survey, ctts_bc, ctts_ab, oapc, sask_pilot, lineman_cert)
  on public.profiles to anon;
revoke all on public.device_fingerprints from anon, authenticated;
