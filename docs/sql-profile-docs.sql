-- Escort profile documents: the escort chooses which approved documents show on the public profile. Additive; already run.
alter table public.certifications add column if not exists show_on_profile boolean not null default false;
