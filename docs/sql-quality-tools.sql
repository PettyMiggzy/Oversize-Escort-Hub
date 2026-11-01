-- Quality tools (2026-11-01): urgent loads, regulars first, equipment, review tags. Additive and safe to run twice.
-- loads: urgent flag, equipment the carrier asks for, a regulars-first window, and a flag for alerts waiting on that window
alter table public.loads add column if not exists urgent boolean not null default false;
alter table public.loads add column if not exists urgent_at timestamptz;
alter table public.loads add column if not exists required_equipment text[] not null default '{}';
alter table public.loads add column if not exists regulars_until timestamptz;
alter table public.loads add column if not exists alerts_pending boolean not null default false;
-- profiles: equipment the escort lists about their own rig (not checked by us). Readable like the other public profile columns.
alter table public.profiles add column if not exists equipment text[] not null default '{}';
grant select (equipment) on public.profiles to anon, authenticated;
-- reviews: one-tap tags
alter table public.reviews add column if not exists tags text[] not null default '{}';
grant select (tags) on public.reviews to anon, authenticated;
-- a carrier's regulars. Both people can read the row; only the server writes it.
create table if not exists public.favorite_escorts (
  carrier_id uuid not null references public.profiles(id) on delete cascade,
  escort_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (carrier_id, escort_id)
);
create index if not exists favorite_escorts_escort_idx on public.favorite_escorts (escort_id);
alter table public.favorite_escorts enable row level security;
revoke all on public.favorite_escorts from anon;
drop policy if exists "regulars readable by both people" on public.favorite_escorts;
create policy "regulars readable by both people" on public.favorite_escorts for select to authenticated using (auth.uid() = carrier_id or auth.uid() = escort_id);
