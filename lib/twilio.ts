import { createClient } from '@supabase/supabase-js'
import { phoneCandidates } from '@/lib/sms-parse'

// Same switch as SMS_ENABLED in lib/features.ts, read on each call.
// Texting stays off unless the server process has SMS_ENABLED=true. Importing this module does not turn it on.
function smsEnabled(): boolean {
  return process.env.SMS_ENABLED === 'true'
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Sends one SMS through Twilio's REST API. Returns false on every refusal or failure. Never throws.
// Does nothing unless SMS is enabled and the account SID, auth token, and From number are set.
// Refuses numbers on sms_opt_outs and profiles that have not set sms_opt_in.
// Do not log the auth token, the Authorization header, or a full phone number.
export async function sendSms(to: string, body: string): Promise<boolean> {
  try {
    if (!smsEnabled()) return false
    const sid = process.env.TWILIO_ACCOUNT_SID
    const token = process.env.TWILIO_AUTH_TOKEN
    const from = process.env.TWILIO_FROM
    if (!sid || !token || !from || !to || !body) return false

    // Profiles and opt-outs may hold the number in any common format, so match every format.
    const candidates = phoneCandidates(to)
    if (!candidates.length) return false

    const { data: optOuts, error: optErr } = await supabase
      .from('sms_opt_outs')
      .select('id')
      .in('phone', candidates)
      .limit(1)
    if (optErr || (optOuts && optOuts.length > 0)) return false

    const { data: profiles, error: profErr } = await supabase
      .from('profiles')
      .select('sms_opt_in')
      .in('phone', candidates)
      .limit(20)
    if (profErr || !profiles?.length) return false
    // Any matching profile that has not opted in blocks the send.
    if (!profiles.every((p) => (p as { sms_opt_in?: boolean }).sms_opt_in === true)) return false

    const params = new URLSearchParams()
    params.set('To', to)
    params.set('From', from)
    params.set('Body', body)
    const messagingService = process.env.TWILIO_MESSAGING_SERVICE_SID
    if (messagingService) params.set('MessagingServiceSid', messagingService)

    const auth = Buffer.from(`${sid}:${token}`).toString('base64')
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })
    if (!res.ok) {
      console.error('SMS send failed', res.status)
      return false
    }
    // Drain the body so the socket closes. The body can echo the destination number; do not log it.
    await res.text()
    return true
  } catch {
    return false
  }
}
