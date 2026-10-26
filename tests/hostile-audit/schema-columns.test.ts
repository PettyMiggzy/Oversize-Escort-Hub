import path from 'node:path'
import { expect, test } from 'vitest'
import { BILLING_FILES, scanColumns, type Schema } from './schema-columns'

/** Production public columns read on 2026-10-25. This list is the authority. */
const SCHEMA = {
  bids: ['id', 'created_at', 'load_id', 'escort_id', 'note', 'status', 'rate'],
  device_fingerprints: ['id', 'fingerprint', 'user_id', 'used_trial', 'created_at'],
  disputes: ['id', 'created_at', 'load_id', 'filed_by', 'dispute_type', 'description', 'status', 'resolution', 'resolved_at'],
  escort_availability: ['id', 'escort_id', 'location_city', 'location_state', 'available_from', 'available_until', 'cert_types', 'phone', 'notes', 'expires_at', 'created_at'],
  escort_expenses: ['id', 'escort_id', 'load_id', 'kind', 'miles', 'amount', 'note', 'incurred_on', 'created_at'],
  expenses: ['id', 'user_id', 'category', 'amount', 'date', 'description', 'receipt_url', 'created_at'],
  external_loads: ['id', 'source', 'board', 'escort_type', 'pickup_city', 'pickup_state', 'destination_city', 'destination_state', 'rate', 'rate_type', 'raw_title', 'raw_text', 'posted_at', 'expires_at', 'status', 'created_at', 'screen_content'],
  fleet_escorts: ['id', 'fleet_manager_id', 'name', 'phone', 'location', 'available', 'created_at'],
  fleet_searches: ['id', 'user_id', 'escort_count', 'created_at'],
  invoices: ['id', 'escort_id', 'carrier_id', 'load_id', 'amount', 'miles', 'rate', 'date', 'status', 'pdf_url', 'created_at'],
  job_logs: ['id', 'escort_id', 'load_id', 'mileage', 'expenses', 'notes', 'logged_at'],
  jobs: ['id', 'user_id', 'load_id', 'carrier', 'date', 'miles', 'rate', 'total', 'notes', 'created_at'],
  launch_waitlist: ['email', 'source', 'created_at'],
  load_matches: ['id', 'load_id', 'escort_id', 'carrier_id', 'status', 'created_at'],
  loads: ['id', 'created_at', 'carrier_id', 'board_type', 'pu_city', 'pu_state', 'dl_city', 'dl_state', 'miles', 'position', 'pay_type', 'status', 'per_mile_rate', 'day_rate', 'overnight_fee', 'no_go_fee', 'requires_p_evo', 'requires_witpac', 'requires_ny_cert', 'requires_twic', 'requires_passport', 'requires_cse', 'requires_cptt', 'requires_ca_cptt', 'load_width', 'load_height', 'load_weight', 'notes', 'start_date', 'expires_at', 'filled_by', 'poster_company', 'poster_rating', 'poster_jobs', 'requires_high_pole', 'requires_route_survey', 'requires_ctts_bc', 'requires_ctts_ab', 'requires_oapc', 'requires_sask', 'requires_lineman', 'matched_escort_id', 'match_requested_at', 'permit_miles_agreement', 'estimated_miles', 'permit_states', 'escort_count', 'police_escort_required', 'deadhead_destination_city', 'deadhead_destination_state', 'deadhead_notified_at', 'cert_types', 'pay_term', 'escort_type', 'rate', 'load_type', 'escort_qty', 'permit_url', 'bgc_verified', 'fmcsa_verified'],
  notifications: ['id', 'user_id', 'message', 'read', 'created_at'],
  profiles: ['id', 'created_at', 'full_name', 'email', 'phone', 'state', 'company_name', 'role', 'tier', 'stripe_customer_id', 'bio', 'vehicle', 'states_licensed', 'p_evo_verified', 'bgc_verified', 'vehicle_verified', 'admin_verified', 'rating', 'total_jobs', 'reliability_score', 'response_time', 'is_available', 'req_high_pole', 'req_route_survey', 'ctts_bc', 'ctts_ab', 'oapc', 'sask_pilot', 'lineman_cert', 'bgc_pending', 'bgc_document_url', 'availability_states', 'referral_code', 'referred_by', 'avg_rating', 'review_count', 'avatar_url', 'notification_states', 'suspended', 'sms_opt_in', 'fmcsa_verified', 'dot_number', 'mc_number', 'breakdown_protocol_enabled', 'bgc_paid', 'pevo_paid', 'pevo_verified', 'deadhead_active', 'deadhead_destination_city', 'deadhead_destination_state', 'tier_updated_at', 'stripe_subscription_id', 'dd214_pending', 'dd214_url', 'verified_tier', 'tier1_pending', 'tier2_pending', 'prior_role'],
  push_subscriptions: ['id', 'user_id', 'subscription', 'created_at'],
  referrals: ['id', 'referrer_id', 'referred_id', 'code', 'status', 'created_at', 'converted_at'],
  reviews: ['id', 'created_at', 'load_id', 'reviewer_id', 'reviewee_id', 'rating', 'comment', 'reviewer_role'],
  rewards: ['wallet', 'points', 'streak', 'last_checkin', 'referred_by', 'ref_count', 'created_at', 'updated_at'],
  sms_compliance: ['id', 'phone', 'action', 'created_at'],
  sms_opt_outs: ['id', 'phone', 'opted_out_at'],
  sponsored_zones: ['id', 'user_id', 'zone', 'stripe_subscription_id', 'active', 'created_at', 'expires_at'],
  support_tickets: ['id', 'user_id', 'subject', 'message', 'status', 'created_at'],
  veteran_submissions: ['id', 'user_id', 'pdf_url', 'status', 'created_at'],
} as const satisfies Schema

/**
 * Columns the code still names, where the real table has no column for that field.
 * Billing files and certifications are not in this set: the scan skips them.
 * A new unknown column fails this test. Removing one of these from the code fails it
 * until the entry is removed, so the list cannot drift.
 */
const OPEN_GAPS = [
  'fleet_escorts.escort_id',
  'invoices.description',
  'invoices.due_date',
  'invoices.items',
  'profiles.email_alerts',
  'profiles.push_token',
  'profiles.tier1_document_url',
  'profiles.tier2_document_url',
] as const

const root = path.resolve(__dirname, '../..')

function ignored(file: string) {
  return BILLING_FILES.has(file) || file.startsWith('android/') || file === 'capacitor.config.ts'
}

test('supabase column names in app/, lib/, and components/ match production', () => {
  const scan = scanColumns(root, SCHEMA)
  const mismatches = scan.mismatches.filter((m) => !ignored(m.file))
  const found = [...new Set(mismatches.map((m) => `${m.table}.${m.column}`))].sort()
  const expected = [...OPEN_GAPS].sort()
  expect(found, JSON.stringify({ found, unresolved: scan.unresolved, unknown: scan.unknownTables, extra: mismatches }, null, 2)).toEqual(expected)
  for (const gap of OPEN_GAPS) {
    expect(found, gap).toContain(gap)
  }
  const unknown = [...new Set(scan.unknownTables.filter((u) => !ignored(u.file) && u.table !== 'certifications').map((u) => u.table))].sort()
  expect(unknown).toEqual(['admin_flags', 'dd214_submissions', 'veteran_discounts'])
})
