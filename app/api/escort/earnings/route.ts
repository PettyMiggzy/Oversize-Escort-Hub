import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { serviceClient } from '@/lib/service-client'

export const dynamic = 'force-dynamic'

// Estimated earnings from the escort's own accepted bids. A bid is a rate per mile, so the money is rate times the
// load's miles; a load with no miles on it is counted as a job but adds no dollars (we do not guess).
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const now = new Date()
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString()

  const { data: accepted, error } = await supabase
    .from('bids')
    .select('rate, created_at, load_id')
    .eq('escort_id', user.id)
    .eq('status', 'accepted')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = (accepted ?? []) as { rate: number | string | null; created_at: string | null; load_id: string }[]
  const ids = [...new Set(rows.map((b) => b.load_id).filter(Boolean))]
  const miles = new Map<string, number>()
  if (ids.length) {
    const { data: loads } = await serviceClient().from('loads').select('id, miles, estimated_miles').in('id', ids)
    for (const l of (loads ?? []) as { id: string; miles: number | null; estimated_miles: number | null }[]) {
      const m = Number(l.miles ?? l.estimated_miles ?? 0)
      if (Number.isFinite(m) && m > 0) miles.set(l.id, m)
    }
  }
  const dollars = (b: { rate: number | string | null; load_id: string }) => Number(b.rate || 0) * (miles.get(b.load_id) ?? 0)
  const lifetime = rows.reduce((s, b) => s + dollars(b), 0)
  const month = rows.filter((b) => b.created_at && b.created_at >= monthStart).reduce((s, b) => s + dollars(b), 0)

  return NextResponse.json({ month, lifetime, jobsCount: rows.length })
}
