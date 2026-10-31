-- Fleet dashboard and Wraith "my fleet" read and write fleet_escorts.escort_id, which the table never had.
-- Additive and safe to run twice. Existing rows get null. The foreign key is named fleet_escorts_escort_id_fkey,
-- which is the name the dashboard's embedded select uses.
alter table public.fleet_escorts
  add column if not exists escort_id uuid references public.profiles(id) on delete cascade;
create index if not exists fleet_escorts_escort_id_idx on public.fleet_escorts (escort_id);
