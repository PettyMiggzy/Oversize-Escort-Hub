import { NextRequest, NextResponse } from 'next/server'
import { requireCron } from '@/lib/api-auth'
import { notifyProEscorts } from '@/lib/notify-pro'

export const dynamic = 'force-dynamic'

// Manual trigger for operators (Authorization: Bearer CRON_SECRET). The app itself calls notifyProEscorts
// from app/api/loads/route.ts when a load is posted.
export async function POST(req: NextRequest) {
  const denied = requireCron(req)
  if (denied) return denied
  const body = await req.json().catch(() => ({}))
  const result = await notifyProEscorts(body)
  return NextResponse.json(result, { status: 'error' in result ? 400 : 200 })
}
