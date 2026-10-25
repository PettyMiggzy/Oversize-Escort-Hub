-- DO NOT RUN YET. Run this only when you are about to turn texting on.
-- The sign-up form already sends sms_opt_in with the new account, but handle_new_user
-- never copied them onto the profile, so every new account looked "not opted in" to the texting code.
-- This copies the checkbox answer onto the profile at sign-up. It changes nothing for existing accounts,
-- and it never opts anyone in who did not tick the box.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  r text := new.raw_user_meta_data ->> 'role';
  opted boolean := coalesce((new.raw_user_meta_data ->> 'sms_opt_in')::boolean, false);
begin
  insert into public.profiles (id, email, full_name, role, tier, sms_opt_in)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name',
          case when r in ('escort', 'carrier', 'broker') then r else 'escort' end, 'free',
          opted)
  on conflict (id) do nothing;
  return new;
end $function$;
