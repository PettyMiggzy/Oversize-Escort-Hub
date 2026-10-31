import { NextRequest, NextResponse } from 'next/server'
import { serviceClient } from '@/lib/service-client'
import { clientIp, hashIp } from '@/lib/quick-post'

/**
 * Per-caller-address limit for open (no sign-in) routes, counted in helper_usage so it holds across serverless instances.
 * Returns a 429 response when the caller is over `perHour`, else records the call and returns null.
 * A database hiccup never blocks a real visitor: it logs and lets the call through.
 */
export async function ipLimited(req: NextRequest | Request, kind: string, perHour: number): Promise<NextResponse | null> {
  try {
    const key = `ip:${hashIp(clientIp(req.headers))}`
    const svc = serviceClient()
    const since = new Date(Date.now() - 3600000).toISOString()
    const { data, count } = await svc.from('helper_usage').select('id', { count: 'exact', head: true }).eq('key', key).eq('kind', kind).gte('created_at', since)
    const used = count ?? (Array.isArray(data) ? data.length : 0)
    if (used >= perHour) return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 })
    const { error } = await svc.from('helper_usage').insert({ key, kind, question: '' })
    if (error) console.error('[rate-limit] insert failed:', kind, error.message)
  } catch (e) {
    console.error('[rate-limit]', kind, e instanceof Error ? e.message : e)
  }
  return null
}
