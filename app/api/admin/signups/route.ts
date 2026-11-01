import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-auth'
import { serviceClient } from '@/lib/service-client'

export const dynamic = 'force-dynamic'

const DAYS = 30
const TZ = 'America/New_York'
const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' })

// Calendar day in US Eastern, as YYYY-MM-DD.
export function dayKey(d: Date) {
  return fmt.format(d)
}

const ROLES = ['escort', 'carrier', 'broker', 'fleet_manager'] as const

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const svc = serviceClient()
  const cutoff = new Date(Date.now() - (DAYS + 2) * 86400000).toISOString()
  const { data, error: dbError } = await svc.from('profiles').select('role, created_at').gte('created_at', cutoff)
  if (dbError) return NextResponse.json({ error: 'Could not load sign-ups' }, { status: 500 })

  const days: { date: string; escort: number; carrier: number; broker: number; fleet_manager: number; other: number; total: number }[] = []
  const index = new Map<string, number>()
  for (let i = DAYS - 1; i >= 0; i--) {
    const date = dayKey(new Date(Date.now() - i * 86400000))
    index.set(date, days.length)
    days.push({ date, escort: 0, carrier: 0, broker: 0, fleet_manager: 0, other: 0, total: 0 })
  }
  for (const row of (data ?? []) as { role: string | null; created_at: string | null }[]) {
    if (!row.created_at || row.role === 'admin') continue
    const at = index.get(dayKey(new Date(row.created_at)))
    if (at === undefined) continue
    const day = days[at]
    const role = (ROLES as readonly string[]).includes(row.role ?? '') ? (row.role as (typeof ROLES)[number]) : 'other'
    day[role] += 1
    day.total += 1
  }

  const sum = (from: number, to: number) => days.slice(from, to).reduce((a, d) => a + d.total, 0)
  return NextResponse.json({
    days,
    today: days[DAYS - 1].total,
    last7: sum(DAYS - 7, DAYS),
    prev7: sum(DAYS - 14, DAYS - 7),
    last30: sum(0, DAYS),
    bestDay: Math.max(...days.map((d) => d.total)),
  })
}
