import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'

// The pending certification rows hold links to private documents, so the browser cannot read the table.
// The admin page gets its three review queues from here, after the admin check.
export async function GET() {
  const { error: authErr } = await requireAdmin()
  if (authErr) return authErr

  const svc = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: rows, error } = await svc
    .from('certifications')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: 'Could not load the queue' }, { status: 500 })

  const ids = Array.from(new Set((rows || []).map((r: any) => r.user_id).filter(Boolean)))
  const people: Record<string, { full_name: string | null; email: string | null }> = {}
  if (ids.length) {
    const { data: profs } = await svc.from('profiles').select('id, full_name, email').in('id', ids)
    for (const p of profs || []) people[(p as any).id] = { full_name: (p as any).full_name, email: (p as any).email }
  }
  const all = (rows || []).map((r: any) => ({ ...r, profiles: people[r.user_id] || null }))
  return NextResponse.json({
    bgc: all.filter((r: any) => r.type === 'bgc'),
    certs: all.filter((r: any) => r.type !== 'bgc'),
    verification: all,
  })
}
