import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const now = new Date()
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString()

  const { data: accepted, error } = await supabase
    .from('bids')
    .select('rate, created_at')
    .eq('escort_id', user.id)
    .eq('status', 'accepted')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const lifetime = (accepted ?? []).reduce((s, b: any) => s + Number(b.rate || 0), 0)
  const month = (accepted ?? [])
    .filter((b: any) => b.created_at && b.created_at >= monthStart)
    .reduce((s, b: any) => s + Number(b.rate || 0), 0)
  const jobsCount = (accepted ?? []).length

  return NextResponse.json({ month, lifetime, jobsCount })
}
