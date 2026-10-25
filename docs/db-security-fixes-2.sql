-- Second database script for Oversize Escort Hub. Run in the Supabase SQL Editor of the app's project (rcdezyugannbyqqtowrc).
-- RUN STEPS 1 AND 2 BEFORE the code that uses them goes live (the new webhook and admin tool read `prior_role`).

-- STEP 1: remember a user's role while a fleet plan is active, and give trial fingerprints an owner
alter table public.profiles add column if not exists prior_role text;
alter table public.device_fingerprints add column if not exists user_id uuid;

-- prior_role cannot be set from a user session (same rule as plan, role and badges)
create or replace function public.protect_prior_role()
returns trigger language plpgsql security definer set search_path = public as $$
declare caller_email text := lower(coalesce(auth.jwt() ->> 'email', '')); privileged boolean;
begin
  privileged := coalesce(auth.role(), '') = 'service_role' or auth.uid() is null
    or caller_email in ('bahmed3170@gmail.com', 'brian@precisionpilotservices.com')
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin');
  if privileged then return new; end if;
  if tg_op = 'INSERT' then new.prior_role := null; else new.prior_role := old.prior_role; end if;
  return new;
end $$;
drop trigger if exists protect_prior_role on public.profiles;
create trigger protect_prior_role before insert or update on public.profiles
  for each row execute function public.protect_prior_role();

-- STEP 2: one live bid per escort per load, enforced by the database (duplicates are cleaned up first)
delete from public.bids b using public.bids d
where b.status = 'pending' and d.status = 'pending' and b.load_id = d.load_id and b.escort_id = d.escort_id and b.ctid > d.ctid;
create unique index if not exists bids_one_pending_per_escort on public.bids (load_id, escort_id) where status = 'pending';

-- STEP 3 (optional, do it last): make the document buckets private so only signed links open them.
-- First look at what is stored today: documents already uploaded keep their old public links, which stop working
-- once the bucket is private (the person re-uploads, or ask me to re-sign them).
-- select 'certifications' as t, count(*) from public.certifications where document_url like '%/object/public/%'
-- union all select 'profiles bgc', count(*) from public.profiles where bgc_document_url like '%/object/public/%';
-- update storage.buckets set public = false where id in ('bgc-submissions', 'pevo-certs', 'verification-docs', 'vehicle-docs', 'documents');
