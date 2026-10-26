-- Load lifecycle: a 12-hour "still need escorts?" check-in, "taken" reports, and relisting. Additive only; already run.
alter table public.loads
  add column if not exists checkin_sent_at timestamptz,
  add column if not exists taken_flagged_at timestamptz,
  add column if not exists relisted_at timestamptz;
