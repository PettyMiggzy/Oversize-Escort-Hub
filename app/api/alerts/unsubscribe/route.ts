import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyUnsubToken } from '@/lib/alerts'

export const dynamic = 'force-dynamic'

const page = (title: string, body: string) => new NextResponse(
  `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
<body style="font-family:Arial,sans-serif;background:#0b0b0b;color:#eee;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0">
<div style="max-width:420px;padding:24px;text-align:center"><h2>${title}</h2>${body}</div></body>`,
  { headers: { 'content-type': 'text/html; charset=utf-8' } })

// The link in the email only shows a button: mail scanners that open links must not unsubscribe anyone by accident.
export async function GET(req: NextRequest) {
  const u = req.nextUrl.searchParams.get('u') || '', t = req.nextUrl.searchParams.get('t') || ''
  if (!verifyUnsubToken(u, t)) return page('Link not valid', '<p>This link is not valid. Sign in and change your alerts from your account.</p>')
  return page('Stop alert emails?', `<p>You will still see alerts inside the app.</p>
<form method="post" action="/api/alerts/unsubscribe?u=${encodeURIComponent(u)}&t=${encodeURIComponent(t)}">
<button style="background:#f0a500;border:0;padding:12px 22px;border-radius:6px;font-weight:bold;font-size:15px;cursor:pointer">Stop the emails</button></form>`)
}

export async function POST(req: NextRequest) {
  const u = req.nextUrl.searchParams.get('u') || '', t = req.nextUrl.searchParams.get('t') || ''
  if (!verifyUnsubToken(u, t)) return page('Link not valid', '<p>This link is not valid.</p>')
  const svc = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { error } = await svc.from('profiles').update({ email_alerts: false }).eq('id', u)
  if (error) return page('Something went wrong', '<p>Please try again in a minute.</p>')
  return page('Done', '<p>You will not get alert emails any more. You can still see alerts inside the app.</p>')
}
