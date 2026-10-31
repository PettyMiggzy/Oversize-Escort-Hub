-- helper_usage counts calls for limits. Its kind check only allowed msg and ticket, so Wraith and the open-route limits
-- (contact, weather, nws, fmcsa, trial, waitlist) could not be recorded. Widen it. Safe to run twice.
alter table public.helper_usage drop constraint if exists helper_usage_kind_check;
alter table public.helper_usage add constraint helper_usage_kind_check
  check (kind in ('msg','ticket','wraith','contact','weather','nws','fmcsa','trial','waitlist'));
