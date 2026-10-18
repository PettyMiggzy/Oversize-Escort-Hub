-- Supabase checks for Oversize Escort Hub. Paste each block into Supabase > SQL Editor and run it.
-- Blocks 1 to 4 only READ. Block 5 makes the app-store reviewer accounts (edit the two emails first).

-- 1. Which tables have row-level security switched on? Every table the app uses should show rls_on = true.
select c.relname as table_name, c.relrowsecurity as rls_on
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
order by c.relrowsecurity, c.relname;

-- 2. The policies in force. Look for any policy whose "roles" includes anon or public on profiles, loads, bids,
--    certifications, notifications, push_subscriptions, disputes, job_logs, escort_expenses: those would be readable by anyone.
select tablename, policyname, cmd, roles, qual as using_expr, with_check
from pg_policies where schemaname = 'public'
order by tablename, cmd, policyname;

-- 3. Storage buckets: which are public? Documents (pevo-certs, bgc-submissions, verification-docs) should be public = false.
select id, name, public from storage.buckets order by public desc, name;
select policyname, cmd, roles, qual as using_expr, with_check from pg_policies
where schemaname = 'storage' and tablename = 'objects' order by cmd, policyname;

-- 4. Triggers on profiles and auth.users (the app expects a profile row to exist for every signed-in user).
select event_object_schema, event_object_table, trigger_name, action_timing, event_manipulation
from information_schema.triggers
where event_object_table in ('profiles', 'users') order by 1, 2, 3;

-- 5. Reviewer accounts for the app stores.
--    First create the two users in the app itself (the sign-in page, "create account"), or in Supabase > Authentication > Add user
--    (tick "Auto confirm user"). Then run this with their emails.
update public.profiles set role = 'escort', tier = 'pro', pevo_verified = true, bgc_verified = true, tier_updated_at = now()
where id = (select id from auth.users where email = 'REVIEWER-ESCORT@example.com');

update public.profiles set role = 'carrier', tier = 'carrier_member', tier_updated_at = now()
where id = (select id from auth.users where email = 'REVIEWER-CARRIER@example.com');

select u.email, p.role, p.tier, p.pevo_verified, p.bgc_verified
from public.profiles p join auth.users u on u.id = p.id
where u.email in ('REVIEWER-ESCORT@example.com', 'REVIEWER-CARRIER@example.com');
