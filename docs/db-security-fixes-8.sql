-- Run in Supabase > SQL Editor AFTER the contact-privacy code is deployed.
-- Order: code first, this SQL second. Running this first breaks the live site, because the
-- browser still selects email, phone, and profiles select('*') until that deploy is live.
-- Safe to run again. Run the whole file in one go.
--
-- Column grants cannot be limited to "your own row". Revoking these columns from
-- `authenticated` hides them on every row, including the caller's. The app reads the
-- signed-in user's own sensitive columns through /api/profile/me (service key).
-- Another person's phone and email come only from /api/contact/party.
--
-- A table-level SELECT is not overridden by a later column-level REVOKE, so the table
-- grant has to come off first. After that, select('*') fails instead of returning the hidden columns.
-- anon was already limited to the public columns. INSERT, UPDATE, and DELETE on the table stay.

-- STEP 1 (must come first). The loads policy "Pro users see all open loads" reads profiles.email inside its own check.
-- Once email is hidden from `authenticated`, that policy fails with "permission denied for table profiles" and
-- nobody could read the load board. The check moves into a definer function that runs with the owner's rights.
-- Same people qualify as before: pro / fleet_pro tier, admins, and the two owner emails. Open loads still show to
-- everyone after one minute.
create or replace function public.is_pro_viewer()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and (p.tier = any (array['pro', 'fleet_pro'])
           or p.role = 'admin'
           or p.email = any (array['bahmed3170@gmail.com', 'brian@precisionpilotservices.com']))
  )
$$;
revoke all on function public.is_pro_viewer() from public;
grant execute on function public.is_pro_viewer() to anon, authenticated;

drop policy if exists "Pro users see all open loads" on public.loads;
create policy "Pro users see all open loads" on public.loads
  for select
  using (status = 'open' and (public.is_pro_viewer() or created_at < now() - interval '1 minute'));

-- STEP 2: hide the sensitive columns.
revoke select on table public.profiles from authenticated;

grant select (
  id,
  created_at,
  full_name,
  company_name,
  role,
  tier,
  bio,
  vehicle,
  states_licensed,
  state,
  p_evo_verified,
  pevo_verified,
  bgc_verified,
  vehicle_verified,
  admin_verified,
  rating,
  avg_rating,
  review_count,
  total_jobs,
  reliability_score,
  response_time,
  is_available,
  avatar_url,
  availability_states,
  fmcsa_verified,
  req_high_pole,
  req_route_survey,
  ctts_bc,
  ctts_ab,
  oapc,
  sask_pilot,
  lineman_cert
) on public.profiles to authenticated;

-- check: sensitive columns false, a public column true
select
  has_column_privilege('authenticated', 'public.profiles', 'email', 'select') as auth_email,
  has_column_privilege('authenticated', 'public.profiles', 'phone', 'select') as auth_phone,
  has_column_privilege('authenticated', 'public.profiles', 'bgc_document_url', 'select') as auth_bgc_doc,
  has_column_privilege('authenticated', 'public.profiles', 'dd214_url', 'select') as auth_dd214,
  has_column_privilege('authenticated', 'public.profiles', 'stripe_customer_id', 'select') as auth_stripe,
  has_column_privilege('authenticated', 'public.profiles', 'stripe_subscription_id', 'select') as auth_stripe_sub,
  has_column_privilege('authenticated', 'public.profiles', 'dot_number', 'select') as auth_dot,
  has_column_privilege('authenticated', 'public.profiles', 'mc_number', 'select') as auth_mc,
  has_column_privilege('authenticated', 'public.profiles', 'full_name', 'select') as auth_name,
  has_column_privilege('anon', 'public.profiles', 'email', 'select') as anon_email;

-- check: the load board still reads. Expect true for both.
select
  (select count(*) from pg_policies where tablename = 'loads' and policyname = 'Pro users see all open loads' and qual ~ 'is_pro_viewer') = 1 as policy_uses_function,
  has_function_privilege('authenticated', 'public.is_pro_viewer()', 'execute') as authenticated_can_run_it;
