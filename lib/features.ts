import { NextResponse } from 'next/server'

// SMS is coming soon. Nothing sends or accepts texts until SMS_ENABLED=true is set on the server
// (and the routes' own checks pass), so a leftover env key can never switch texting on by itself.
export const SMS_ENABLED = process.env.SMS_ENABLED === 'true'

export function smsComingSoon() {
  return NextResponse.json({ ok: false, error: 'SMS is coming soon', comingSoon: true }, { status: 503 })
}
