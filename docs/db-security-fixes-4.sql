-- Run once in Supabase > SQL Editor. Safe to run again.
-- 1) The certifications table was missing the columns the app writes (type, status, document_url), so every
--    certificate, background-check and verification upload failed with "Upload failed".
-- 2) The table was readable by anyone (policy "Public certs", using true) and every signed-in user could write
--    their own rows, including status = 'approved'. Rows hold links to private documents.

alter table public.certifications add column if not exists type text;
alter table public.certifications add column if not exists status text not null default 'pending';
alter table public.certifications add column if not exists document_url text;

-- carry over anything saved under the old column names
update public.certifications set type = cert_type where type is null and cert_type is not null;
update public.certifications set document_url = pdf_url where document_url is null and pdf_url is not null;
update public.certifications set status = 'approved' where verified is true and status = 'pending';

-- the browser may read only the harmless columns (the public badge lists need type and status);
-- all writes and the document links go through the server with the service key
drop policy if exists "Own certs" on public.certifications;
drop policy if exists "Public certs" on public.certifications;
drop policy if exists "admins update certifications" on public.certifications;
alter table public.certifications enable row level security;
create policy "certs readable" on public.certifications for select using (true);

revoke all on public.certifications from anon, authenticated;
grant select (id, user_id, type, status, expiry_date, created_at) on public.certifications to anon, authenticated;

-- check: expect type/status/document_url present, and no document_url for anon or authenticated
select column_name from information_schema.columns where table_schema = 'public' and table_name = 'certifications' and column_name in ('type','status','document_url');
select has_column_privilege('anon', 'public.certifications', 'document_url', 'select') as anon_reads_links,
       has_column_privilege('authenticated', 'public.certifications', 'document_url', 'select') as signed_in_reads_links,
       has_table_privilege('authenticated', 'public.certifications', 'insert') as signed_in_can_insert;
