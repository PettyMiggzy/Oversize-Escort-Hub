-- Third database script. Run in the Supabase SQL Editor of the app's project (rcdezyugannbyqqtowrc).

-- STEP A (urgent): a new sign-up can no longer choose its own role. The old function copied the role straight from
-- what the browser sent at sign-up, so anyone could have signed up as an admin.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare r text := new.raw_user_meta_data ->> 'role';
begin
  insert into public.profiles (id, email, full_name, role, tier)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name',
          case when r in ('escort', 'carrier', 'broker') then r else 'escort' end, 'free')
  on conflict (id) do nothing;
  return new;
end $$;

-- the trigger functions are not meant to be called from outside
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.protect_profile_columns() from public, anon, authenticated;
revoke execute on function public.protect_prior_role() from public, anon, authenticated;

-- STEP B: the storage buckets the app uses did not exist, so photo and document uploads were failing.
-- Documents are private; only profile photos and permits (shown to escorts) are public.
insert into storage.buckets (id, name, public) values
  ('avatars', 'avatars', true),
  ('bgc-submissions', 'bgc-submissions', false),
  ('pevo-certs', 'pevo-certs', false),
  ('vehicle-docs', 'vehicle-docs', false),
  ('verification-docs', 'verification-docs', false),
  ('documents', 'documents', false)
on conflict (id) do nothing;

-- a signed-in user can add, read and replace files only in their own folder (the server handles everything else)
drop policy if exists oeh_own_files_insert on storage.objects;
create policy oeh_own_files_insert on storage.objects for insert to authenticated with check (
  (bucket_id in ('pevo-certs', 'vehicle-docs', 'permits') and (storage.foldername(name))[1] = auth.uid()::text)
  or (bucket_id = 'avatars' and name like 'avatars/' || auth.uid()::text || '%'));
drop policy if exists oeh_own_files_select on storage.objects;
create policy oeh_own_files_select on storage.objects for select to authenticated using (
  (bucket_id in ('pevo-certs', 'vehicle-docs', 'permits') and (storage.foldername(name))[1] = auth.uid()::text)
  or (bucket_id = 'avatars' and name like 'avatars/' || auth.uid()::text || '%'));
drop policy if exists oeh_own_files_update on storage.objects;
create policy oeh_own_files_update on storage.objects for update to authenticated using (
  (bucket_id in ('pevo-certs', 'vehicle-docs', 'permits') and (storage.foldername(name))[1] = auth.uid()::text)
  or (bucket_id = 'avatars' and name like 'avatars/' || auth.uid()::text || '%'))
with check (
  (bucket_id in ('pevo-certs', 'vehicle-docs', 'permits') and (storage.foldername(name))[1] = auth.uid()::text)
  or (bucket_id = 'avatars' and name like 'avatars/' || auth.uid()::text || '%'));
