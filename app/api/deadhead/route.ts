import { NextRequest, NextResponse } from 'next/server'
import { requireCron } from '@/lib/api-auth'
import { notifyDeadhead } from '@/lib/deadhead'

export const dynamic = 'force-dynamic'

// Manual trigger for operators (Authorization: Bearer CRON_SECRET). The app itself calls notifyDeadhead
// from app/api/loads/route.ts when a load is posted.
export async function POST(req: NextRequest) {
  const denied = requireCron(req)
  if (denied) return denied
  const { load_id } = await req.json().catch(() => ({}))
  const result = await notifyDeadhead(load_id)
  return NextResponse.json(result, { status: 'error' in result ? 500 : 200 })
}
