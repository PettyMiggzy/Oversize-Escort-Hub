// Public read of open job posts with the anon key. No cookies, so the board can stay cached.
import { cache } from 'react'
import { createClient } from '@supabase/supabase-js'

export const JOB_LIST_COLUMNS = 'id, poster_id, title, company, description, classification, equipment, pay_model, pay_min, pay_max, pay_note, schedule, travel, base_city, base_state, states, cert_types, start_date, status, created_at, expires_at'

export type JobPost = {
  id: string
  poster_id: string
  title: string
  company: string | null
  description: string | null
  classification: string
  equipment: string
  pay_model: string
  pay_min: number | null
  pay_max: number | null
  pay_note: string | null
  schedule: string
  travel: string
  base_city: string | null
  base_state: string | null
  states: string[]
  cert_types: string[]
  start_date: string | null
  status: string
  created_at: string
  expires_at: string
}

function anon() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}

function asNumber(v: unknown): number | null {
  if (v == null || v === '') return null
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : null
}

function normalize(row: Record<string, unknown>): JobPost {
  return {
    id: String(row.id),
    poster_id: String(row.poster_id),
    title: String(row.title || ''),
    company: row.company == null ? null : String(row.company),
    description: row.description == null ? null : String(row.description),
    classification: String(row.classification || ''),
    equipment: String(row.equipment || ''),
    pay_model: String(row.pay_model || ''),
    pay_min: asNumber(row.pay_min),
    pay_max: asNumber(row.pay_max),
    pay_note: row.pay_note == null ? null : String(row.pay_note),
    schedule: String(row.schedule || ''),
    travel: String(row.travel || ''),
    base_city: row.base_city == null ? null : String(row.base_city),
    base_state: row.base_state == null ? null : String(row.base_state),
    states: Array.isArray(row.states) ? row.states.map((s) => String(s)) : [],
    cert_types: Array.isArray(row.cert_types) ? row.cert_types.map((s) => String(s)) : [],
    start_date: row.start_date == null ? null : String(row.start_date).slice(0, 10),
    status: String(row.status || ''),
    created_at: String(row.created_at || ''),
    expires_at: String(row.expires_at || ''),
  }
}

export function postedLabel(createdAt: string, now = Date.now()): string {
  const t = Date.parse(createdAt)
  if (!Number.isFinite(t)) return 'Posted recently'
  const days = Math.floor((now - t) / 86400000)
  if (days <= 0) return 'Posted today'
  if (days === 1) return 'Posted 1 day ago'
  return `Posted ${days} days ago`
}

export const loadOpenJobs = cache(async (): Promise<JobPost[]> => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return []
  const now = new Date().toISOString()
  const { data, error } = await anon()
    .from('job_posts')
    .select(JOB_LIST_COLUMNS)
    .eq('status', 'open')
    .gt('expires_at', now)
    .order('created_at', { ascending: false })
    .limit(200)
  if (error || !data) return []
  return (data as Record<string, unknown>[]).map(normalize)
})

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const loadOpenJob = cache(async (id: string): Promise<JobPost | null> => {
  if (!UUID.test(id)) return null
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null
  const now = new Date().toISOString()
  const { data, error } = await anon()
    .from('job_posts')
    .select(JOB_LIST_COLUMNS)
    .eq('id', id)
    .eq('status', 'open')
    .gt('expires_at', now)
    .maybeSingle()
  if (error || !data) return null
  return normalize(data as Record<string, unknown>)
})
