import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// TextRequest is retired. Inbound texts are handled by Twilio at /api/sms/twilio.
// 410 Gone tells TextRequest this URL will not come back, so it can stop retrying.
// This route does not read the body, validate a signature, or send a text.
// SMS stays off unless SMS_ENABLED=true on the server.
export async function POST() {
  return NextResponse.json({ ok: false, error: 'TextRequest is no longer used' }, { status: 410 })
}
