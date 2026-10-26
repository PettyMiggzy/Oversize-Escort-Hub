export const dynamic = 'force-dynamic'
export const maxDuration = 60
import { NextResponse } from 'next/server'
import { requireCron } from '@/lib/api-auth'
import { alertWeeklyDigest } from '@/lib/alerts'

// Vercel Cron, Mondays 14:00 UTC (vercel.json), sends Authorization: Bearer CRON_SECRET.
export async function GET(req: Request) {
  const denied = requireCron(req)
  if (denied) return denied
  const result = await alertWeeklyDigest()
  return NextResponse.json({ ok: true, ...result })
}
