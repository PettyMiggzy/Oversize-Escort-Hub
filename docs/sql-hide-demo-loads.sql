-- Loads whose notes start with ZZTEST are made for the app-store reviewers and for testing.
-- Only the reviewer and demo accounts, the owner's accounts and the load's own carrier may see them.
create or replace function public.can_see_demo_loads()
returns boolean language sql stable security invoker set search_path = public as $$
  select coalesce(lower(auth.jwt() ->> 'email'), '') ~ '\+(oehreview|demodriver|democarrier)'
      or coalesce(lower(auth.jwt() ->> 'email'), '') in ('bahmed3170@gmail.com', 'brian@precisionpilotservices.com')
$$;

alter policy "Loads are public" on public.loads
  using (notes is null or upper(ltrim(notes)) not like 'ZZTEST%' or public.can_see_demo_loads());

alter policy "View open loads" on public.loads
  using (((status = 'open'::text) AND (notes is null or upper(ltrim(notes)) not like 'ZZTEST%' or public.can_see_demo_loads())) OR (auth.uid() = carrier_id));

alter policy "Pro users see all open loads" on public.loads
  using ((status = 'open'::text) AND (is_pro_viewer() OR (created_at < (now() - '00:01:00'::interval))) AND (notes is null or upper(ltrim(notes)) not like 'ZZTEST%' or public.can_see_demo_loads()));
