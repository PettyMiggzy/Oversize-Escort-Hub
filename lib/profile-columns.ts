// Columns a signed-in browser may read on any profile. Sensitive columns are not in this list:
// column grants cannot be per-row, so email, phone, payment ids and document links are not
// selectable at all by `authenticated`. Own-row reads use /api/profile/me. Another person's
// phone and email use /api/contact/party.
export const PUBLIC_PROFILE_COLUMNS = [
  'id',
  'created_at',
  'full_name',
  'company_name',
  'role',
  'tier',
  'bio',
  'vehicle',
  'states_licensed',
  'state',
  'p_evo_verified',
  'pevo_verified',
  'bgc_verified',
  'vehicle_verified',
  'admin_verified',
  'rating',
  'avg_rating',
  'review_count',
  'total_jobs',
  'reliability_score',
  'response_time',
  'is_available',
  'avatar_url',
  'availability_states',
  'fmcsa_verified',
  'req_high_pole',
  'req_route_survey',
  'ctts_bc',
  'ctts_ab',
  'oapc',
  'sask_pilot',
  'lineman_cert',
] as const

export const PUBLIC_PROFILE_SELECT = PUBLIC_PROFILE_COLUMNS.join(', ')
