-- Run once in Supabase > SQL Editor. Safe to run again.
-- Reviews: any signed-in user could insert a review about anyone, tied to no job, which feeds the public rating.
-- The server route checks that both people worked the load; writes now only go through it (service key),
-- with one review per person per load.

create unique index if not exists reviews_one_per_load_reviewer on public.reviews (load_id, reviewer_id);

drop policy if exists "Own reviews" on public.reviews;
drop policy if exists "Reviews insertable by auth" on public.reviews;
drop policy if exists "User can write review" on public.reviews;
drop policy if exists "Public reviews" on public.reviews;
drop policy if exists "Reviews viewable by all" on public.reviews;
-- "Reviews are public" (select, using true) stays: ratings are shown on escort profiles

revoke insert, update, delete, truncate on public.reviews from anon, authenticated;

-- check: expect one policy left (select) and signed_in_can_insert = false
select count(*) as policies_left from pg_policies where schemaname = 'public' and tablename = 'reviews';
select has_table_privilege('authenticated', 'public.reviews', 'insert') as signed_in_can_insert;
