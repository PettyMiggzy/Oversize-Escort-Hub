import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Profile = {
  id: string
  created_at: string
  full_name: string | null
  email: string | null
  phone: string | null
  state: string | null
  company_name: string | null
  role: 'escort' | 'carrier'
  tier: 'free' | 'member' | 'pro' | 'carrier_member'
  stripe_customer_id: string | null
  bio: string | null
  vehicle: string | null
  states_licensed: string[] | null
  p_evo_verified: boolean
  bgc_verified: boolean
  vehicle_verified: boolean
  admin_verified: boolean
  rating: number
  total_jobs: number
  reliability_score: number
  response_time: string | null
  is_available: boolean
}

export type Load = {
  id: string
  created_at: string
  carrier_id: string
  board_type: 'flat-rate' | 'bid' | 'open-bid'
  pu_city: string
  pu_state: string
  dl_city: string
  dl_state: string
  miles: number | null
  position: string
  pay_type: string | null
  status: 'open' | 'filled' | 'expired' | 'cancelled'
  per_mile_rate: number
  day_rate: number
  overnight_fee: number
  no_go_fee: number
  requires_p_evo: boolean
  requires_witpac: boolean
  requires_ny_cert: boolean
  requires_twic: boolean
  requires_passport: boolean
  requires_cse: boolean
  requires_cptt: boolean
  requires_ca_cptt: boolean
  load_width: number | null
  load_height: number | null
  load_weight: number | null
  notes: string | null
  start_date: string | null
  expires_at: string | null
  filled_by: string | null
  poster_company: string | null
  poster_rating: number | null
  poster_jobs: number | null
}

export type Bid = {
  id: string
  created_at: string
  load_id: string
  escort_id: string
  rate: number
  note: string | null
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn'
}

export const ADMIN_EMAILS = [
  'brian@precisionpilotservices.com',
  'bahamed3170@gmail.com',
]

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false
  return ADMIN_EMAILS.includes(email.toLowerCase())
}
