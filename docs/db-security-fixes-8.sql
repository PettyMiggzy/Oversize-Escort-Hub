-- Run in Supabase > SQL Editor AFTER the contact-privacy code is deployed.
-- Order: code first, this SQL second. Running this first breaks the live site, because the
-- browser still selects email, phone, and profiles select('*') until that deploy is live.
-- Safe to run again.
--
-- Column grants cannot be limited to "your own row". Revoking these columns from
-- `authenticated` hides them on every row, including the caller's. The app reads the
-- signed-in user's own sensitive columns through /api/profile/me (service key).
-- Another person's phone and email come only from /api/contact/party.
--
-- A table-level SELECT is not overridden by a later column-level REVOKE, so the table
-- grant has to come off first. After that, select('*') fails instead of returning the hidden columns.
-- anon was already limited to the public columns. INSERT, UPDATE, and DELETE on the table stay.

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
