-- Run once in Supabase > SQL Editor. Safe to run again.
-- Email alerts (new loads, bids, matches) need an opt-out switch. Everyone starts opted in; every email has a
-- signed "stop these emails" link that turns it off.
alter table public.profiles add column if not exists email_alerts boolean not null default true;

-- check
select count(*) filter (where email_alerts) as opted_in, count(*) as profiles from public.profiles;
