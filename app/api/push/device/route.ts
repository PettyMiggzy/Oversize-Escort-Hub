import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { serviceClient } from '@/lib/service-client'

export const dynamic = 'force-dynamic'

// The phone apps tell the server which device belongs to the signed-in person, so alerts can reach it.
const OK_TOKEN = /^[A-Za-z0-9:_\-.=]{20,4096}$/

export async function POST(req: NextRequest) {
  const { user, error } = await requireAuth()
  if (error) return error
  const b = await req.json().catch(() => ({}))
  const platform = b?.platform
  const token = typeof b?.token === 'string' ? b.token.trim() : ''
  if (platform !== 'ios' && platform !== 'android') return NextResponse.json({ error: 'Unknown platform' }, { status: 400 })
  if (!OK_TOKEN.test(token)) return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
  const svc = serviceClient()
  // a phone moves between accounts: the newest sign-in owns the token
  await svc.from('device_tokens').delete().eq('token', token)
  const { error: dbErr } = await svc.from('device_tokens').insert({ user_id: user!.id, platform, token })
  if (dbErr) return NextResponse.json({ error: 'Could not save the device' }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const { user, error } = await requireAuth()
  if (error) return error
  const b = await req.json().catch(() => ({}))
  const token = typeof b?.token === 'string' ? b.token.trim() : ''
  if (!OK_TOKEN.test(token)) return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
  await serviceClient().from('device_tokens').delete().eq('token', token).eq('user_id', user!.id)
  return NextResponse.json({ ok: true })
}
