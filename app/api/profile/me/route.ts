import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { serviceClient } from '@/lib/service-client'

export const dynamic = 'force-dynamic'

// The signed-in user's own profile, including columns the browser role cannot select.
// Column grants are not per-row, so this is the only way the app can still show
// the caller's phone, email, and payment flags after those columns are revoked.
export async function GET() {
  const { user, error } = await requireAuth()
  if (error) return error

  const { data, error: dbErr } = await serviceClient()
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .maybeSingle()
  if (dbErr) return NextResponse.json({ error: 'Could not load profile' }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  return NextResponse.json({ profile: data })
}
