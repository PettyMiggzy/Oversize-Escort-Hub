-- ============================================================
-- OEH — Schema verification (READ ONLY, safe to run)
-- ============================================================
-- The app's code expects the tables/columns below. Many were created
-- directly in the Supabase Studio UI and are not in the migration files,
-- so this script just CHECKS what exists. It changes nothing.
--
-- How to run: Supabase Dashboard → SQL Editor → paste → Run.
-- Anything that comes back as "MISSING" is a feature that will error
-- until the table/column is created.
-- ============================================================

-- 1) Tables the code reads/writes -----------------------------------------
WITH expected(table_name) AS (
  VALUES
    ('profiles'), ('loads'), ('bids'), ('reviews'), ('referrals'),
    ('escort_expenses'), ('certifications'),
    ('notifications'), ('push_subscriptions'), ('push_queue'),
    ('sms_opt_outs'), ('escort_availability'), ('sponsored_zones'),
    ('invoices'), ('job_logs'), ('escort_certs'),
    ('fleet_searches'), ('fleet_escorts'), ('admin_flags'),
    ('device_fingerprints'), ('launch_waitlist'), ('disputes'),
    ('veteran_discounts'), ('dd214_submissions')
)
SELECT
  e.table_name,
  CASE WHEN t.table_name IS NULL THEN '❌ MISSING' ELSE '✅ exists' END AS status
FROM expected e
LEFT JOIN information_schema.tables t
  ON t.table_schema = 'public' AND t.table_name = e.table_name
ORDER BY status, e.table_name;

-- 2) Key columns the code depends on --------------------------------------
WITH expected(table_name, column_name) AS (
  VALUES
    -- profiles
    ('profiles','tier'), ('profiles','role'), ('profiles','email'),
    ('profiles','stripe_customer_id'), ('profiles','stripe_subscription_id'),
    ('profiles','bgc_verified'), ('profiles','bgc_paid'), ('profiles','bgc_pending'),
    ('profiles','pevo_verified'), ('profiles','pevo_paid'),
    ('profiles','push_token'), ('profiles','availability_states'),
    ('profiles','breakdown_protocol_enabled'),
    ('profiles','avg_rating'), ('profiles','review_count'),
    -- loads
    ('loads','carrier_id'), ('loads','matched_escort_id'),
    ('loads','match_requested_at'), ('loads','status'), ('loads','board_type'),
    ('loads','escort_type'), ('loads','escort_count'), ('loads','load_type'),
    ('loads','per_mile_rate'), ('loads','day_rate'), ('loads','cert_types'),
    ('loads','permit_url'), ('loads','pay_term'),
    ('loads','deadhead_destination_city'), ('loads','deadhead_destination_state'),
    ('loads','start_date'), ('loads','expires_at'),
    -- reviews
    ('reviews','load_id'), ('reviews','reviewer_id'), ('reviews','reviewee_id'),
    ('reviews','rating'), ('reviews','body')
)
SELECT
  e.table_name || '.' || e.column_name AS column_path,
  CASE WHEN c.column_name IS NULL THEN '❌ MISSING' ELSE '✅ exists' END AS status
FROM expected e
LEFT JOIN information_schema.columns c
  ON c.table_schema = 'public'
 AND c.table_name = e.table_name
 AND c.column_name = e.column_name
ORDER BY status, column_path;
