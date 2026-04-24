import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { isAdminEmail } from '@/lib/supabase'

export async function requireAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, supabase: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  return { user, supabase, error: null as NextResponse | null }
}

export async function requireAdmin() {
  const { user, supabase, error } = await requireAuth()
  if (error) return { user: null, error }
  const { data: p } = await supabase!.from('profiles').select('role').eq('id', user!.id).single()
  if (p?.role !== 'admin' && !isAdminEmail(user!.email ?? '')) {
    return { user: null, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { user, error: null as NextResponse | null }
}

export function requireCron(req: Request) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}
