-- Find test or invented rows in the live database before launch. Paste each block into Supabase > SQL Editor.
-- Blocks 1 to 5 only READ. Look at the results, then use block 6 only for rows you have confirmed are fake.

-- 1. Profiles that do not belong to a real sign-up (no matching account in auth.users).
select p.id, p.full_name, p.email, p.role, p.tier, p.created_at
from public.profiles p left join auth.users u on u.id = p.id
where u.id is null order by p.created_at;

-- 2. Profiles that look like test data (by name or email).
select id, full_name, email, role, tier, created_at from public.profiles
where email ilike any (array['%test%', '%example.com', '%demo%', '%fake%', '%sample%'])
   or full_name ilike any (array['%test%', '%demo%', '%fake%', '%sample%', 'jane doe', 'john doe'])
order by created_at;

-- 3. Loads posted by an account that does not exist, or by one of the profiles from blocks 1 and 2.
select l.id, l.pu_city, l.pu_state, l.dl_city, l.dl_state, l.status, l.carrier_id, l.created_at
from public.loads l left join auth.users u on u.id = l.carrier_id
where u.id is null order by l.created_at;

-- 4. Escorts that appear in the directory: name, how they signed up, and whether the account is real.
select p.id, p.full_name, p.email, p.pevo_verified, p.bgc_verified, p.tier, (u.id is not null) as has_real_account, p.created_at
from public.profiles p left join auth.users u on u.id = p.id
where p.role = 'escort' order by p.created_at;

-- 5. Reviews, bids and job logs that point at accounts that do not exist.
select 'reviews' as t, count(*) from public.reviews r left join auth.users u on u.id = r.reviewer_id where u.id is null
union all select 'bids', count(*) from public.bids b left join auth.users u on u.id = b.escort_id where u.id is null
union all select 'job_logs', count(*) from public.job_logs j left join auth.users u on u.id = j.escort_id where u.id is null;

-- 6. Remove rows you confirmed are fake. Replace the ids, run one statement at a time, check the row count each time.
-- delete from public.loads    where id in ('PUT-LOAD-IDS-HERE');
-- delete from public.profiles where id in ('PUT-PROFILE-IDS-HERE');
