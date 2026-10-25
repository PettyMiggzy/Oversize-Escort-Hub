# Task for Cursor: check every database call in the code against the real database columns

Repo: PettyMiggzy/Oversize-Escort-Hub, branch main (work on your own branch, do not push to main, open no pull request).

Why: a real test on the live site found that the `certifications` table has columns `cert_type, pdf_url, verified` but the code writes
`type, status, document_url`, so every certificate, background-check and verification upload returned 500. Nothing in the unit tests
saw it because they use a mock client. The same kind of bug is likely elsewhere. Two more already visible:
`app/find-escorts/page.tsx` reads `escort_availability.state` and filters `sponsored_zones.state`, but the tables have
`location_state` and `zone`.

Job: for every `.from('<table>')` in app/, lib/, components/ (select lists, `.eq/.in/.order` columns, insert/update/upsert objects,
embedded `table(col, col)` selects, and the `profiles:user_id(...)` style embeds), compare each column name against the list below.
Report every column that does not exist, with file:line, and what the code is trying to do. Also report tables the code uses that are not in the list.
Fix each one to the real column, or, where the real table clearly lacks a column the feature needs, say so and propose the SQL (do not guess).
Add a vitest that fails on the old code for each fix (tests live in tests/hostile-audit/; a small static test that reads the schema list below
and scans the source for column names is welcome and would catch this class for good).

Do not touch certifications (now fixed and live: it has `type, status, document_url`). Also already fixed today and live: dd214_submissions and veteran_discounts now exist; reviews insert uses `comment` (patch in flight). Still check app/api/veteran/dd214-submit/route.ts (uses the user's client against the private documents bucket). Do not touch Android, billing or the Chain repo.
Run `npx tsc --noEmit` and `npm run test:hostile` before you finish. Report: what changed, proof (command and counts), what you did not run.

## Real columns (public schema, read from production on 2026-10-25)
bids: id, created_at, load_id, escort_id, note, status, rate
device_fingerprints: id, fingerprint, user_id, used_trial, created_at
disputes: id, created_at, load_id, filed_by, dispute_type, description, status, resolution, resolved_at
escort_availability: id, escort_id, location_city, location_state, available_from, available_until, cert_types, phone, notes, expires_at, created_at
escort_expenses: id, escort_id, load_id, kind, miles, amount, note, incurred_on, created_at
expenses: id, user_id, category, amount, date, description, receipt_url, created_at
external_loads: id, source, board, escort_type, pickup_city, pickup_state, destination_city, destination_state, rate, rate_type, raw_title, raw_text, posted_at, expires_at, status, created_at, screen_content
fleet_escorts: id, fleet_manager_id, name, phone, location, available, created_at
fleet_searches: id, user_id, escort_count, created_at
invoices: id, escort_id, carrier_id, load_id, amount, miles, rate, date, status, pdf_url, created_at
job_logs: id, escort_id, load_id, mileage, expenses, notes, logged_at
jobs: id, user_id, load_id, carrier, date, miles, rate, total, notes, created_at
launch_waitlist: email, source, created_at
load_matches: id, load_id, escort_id, carrier_id, status, created_at
loads: id, created_at, carrier_id, board_type, pu_city, pu_state, dl_city, dl_state, miles, position, pay_type, status, per_mile_rate, day_rate, overnight_fee, no_go_fee, requires_p_evo, requires_witpac, requires_ny_cert, requires_twic, requires_passport, requires_cse, requires_cptt, requires_ca_cptt, load_width, load_height, load_weight, notes, start_date, expires_at, filled_by, poster_company, poster_rating, poster_jobs, requires_high_pole, requires_route_survey, requires_ctts_bc, requires_ctts_ab, requires_oapc, requires_sask, requires_lineman, matched_escort_id, match_requested_at, permit_miles_agreement, estimated_miles, permit_states, escort_count, police_escort_required, deadhead_destination_city, deadhead_destination_state, deadhead_notified_at, cert_types, pay_term, escort_type, rate, load_type, escort_qty, permit_url, bgc_verified, fmcsa_verified
notifications: id, user_id, message, read, created_at
profiles: id, created_at, full_name, email, phone, state, company_name, role, tier, stripe_customer_id, bio, vehicle, states_licensed, p_evo_verified, bgc_verified, vehicle_verified, admin_verified, rating, total_jobs, reliability_score, response_time, is_available, req_high_pole, req_route_survey, ctts_bc, ctts_ab, oapc, sask_pilot, lineman_cert, bgc_pending, bgc_document_url, availability_states, referral_code, referred_by, avg_rating, review_count, avatar_url, notification_states, suspended, sms_opt_in, fmcsa_verified, dot_number, mc_number, breakdown_protocol_enabled, bgc_paid, pevo_paid, pevo_verified, deadhead_active, deadhead_destination_city, deadhead_destination_state, tier_updated_at, stripe_subscription_id, dd214_pending, dd214_url, verified_tier, tier1_pending, tier2_pending, prior_role
push_subscriptions: id, user_id, subscription, created_at
referrals: id, referrer_id, referred_id, code, status, created_at, converted_at
reviews: id, created_at, load_id, reviewer_id, reviewee_id, rating, comment, reviewer_role
rewards: wallet, points, streak, last_checkin, referred_by, ref_count, created_at, updated_at
sms_compliance: id, phone, action, created_at
sms_opt_outs: id, phone, opted_out_at
sponsored_zones: id, user_id, zone, stripe_subscription_id, active, created_at
support_tickets: id, user_id, subject, message, status, created_at
veteran_submissions: id, user_id, pdf_url, status, created_at
moni_submissions: belongs to another project, ignore.
