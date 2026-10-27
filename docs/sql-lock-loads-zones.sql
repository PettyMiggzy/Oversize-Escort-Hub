-- Security fixes from the 2026-10-27 audit. Additive and safe to run twice. Run AFTER the matching code is live
-- (the bid-accept route now writes with the service key).

-- 1. A signed-in user can no longer say who a load is matched to, mark it filled, or set review flags.
--    Those columns are written by the server (service key) only. Everything else a carrier edits on their own load still works.
create or replace function public.protect_load_columns()
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
    new.matched_escort_id := null; new.filled_by := null; new.reviewed_at := null;
    new.taken_flagged_at := null; new.source := null; new.status := 'open';
    new.carrier_id := auth.uid();
  else
    new.matched_escort_id := old.matched_escort_id; new.filled_by := old.filled_by; new.reviewed_at := old.reviewed_at;
    new.taken_flagged_at := old.taken_flagged_at; new.source := old.source; new.carrier_id := old.carrier_id;
  end if;
  return new;
end $$;
drop trigger if exists protect_load_columns on public.loads;
create trigger protect_load_columns before insert or update on public.loads
  for each row execute function public.protect_load_columns();

-- 2. Paid sponsored zones are created only by the payment webhook (service key). Users may read them.
drop policy if exists "Auth users can insert sponsored zones" on public.sponsored_zones;
drop policy if exists "Own sponsored zones" on public.sponsored_zones;
revoke insert, update, delete on public.sponsored_zones from authenticated, anon;

-- 3. A user cannot point their profile at someone else's email address.
create or replace function public.protect_profile_email()
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
  if tg_op = 'INSERT' then new.email := nullif(caller_email, '');
  else new.email := old.email; end if;
  return new;
end $$;
drop trigger if exists protect_profile_email on public.profiles;
create trigger protect_profile_email before insert or update on public.profiles
  for each row execute function public.protect_profile_email();
