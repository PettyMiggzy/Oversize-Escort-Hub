-- Run in Supabase > SQL Editor BEFORE the sponsored-zone code fix goes live. Safe to run again.
-- Adds the end date a 30-day sponsorship needs. Old rows stay valid until you end them (expires_at stays empty).
alter table public.sponsored_zones add column if not exists expires_at timestamptz;
