-- How many pilot cars were told about a load (set by the server after the alerts go out).
alter table public.loads add column if not exists alerted_count integer;
