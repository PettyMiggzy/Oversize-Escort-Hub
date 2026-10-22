import { createClient } from '@supabase/supabase-js'
import { SMS_ENABLED } from '@/lib/features'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function sendSMS(phone: string, body: string): Promise<boolean> {
  if (!SMS_ENABLED) return false
  const apiKey = process.env.TEXTREQUEST_API_KEY
  const accountId = process.env.TEXTREQUEST_ACCOUNT_ID
  if (!apiKey || !accountId) return false
  const { data: optOut } = await supabase.from('sms_opt_outs').select('id').eq('phone', phone).maybeSingle()
  if (optOut) return false
  const res = await fetch(`https://api.textrequest.com/api/v3/Messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Api-Key': apiKey },
    body: JSON.stringify({ AccountId: accountId, Contact: { PhoneNumber: phone }, Body: body }),
  })
  return res.ok
}

type NotifyProInput = { load_id: string; zone?: string; cert_type?: string; pu_state?: string; dl_state?: string }

// Pro early access: queues a push to matching Pro escorts the moment a load posts (they see it before Members).
// Called by the server from app/api/loads/route.ts, never from a browser.
export async function notifyProEscorts({ load_id, zone, cert_type, pu_state, dl_state }: NotifyProInput) {
  if (!load_id) return { error: 'load_id required' }

  const { data: load } = await supabase.from('loads').select('*').eq('id', load_id).single()

  const stateFilter = zone || pu_state || null

  // Instant-claim tiers (mirrors lib/board-access INSTANT_TIERS) all get the
  // early-access push — not only profiles.tier === 'pro'.
  let query = supabase
    .from('profiles')
    .select('id, push_token, full_name, phone')
    .in('tier', ['pro', 'fleet_starter', 'fleet_plus', 'fleet_pro'])
    .eq('role', 'escort')
    .not('push_token', 'is', null)

  if (stateFilter) query = query.eq('state', stateFilter)
  if (cert_type) query = query.contains('cert_types', [cert_type])

  const { data: proEscorts } = await query
  // Also include admin-email escorts
  const { data: adminEscorts } = await supabase
    .from('profiles')
    .select('id, email, push_token, phone')
    .eq('role', 'escort')
    .in('email', ['brian@precisionpilotservices.com', 'bahmed3170@gmail.com'])
  const allEscorts = [...(proEscorts || []), ...(adminEscorts || [])].filter(
    (v, i, a) => a.findIndex((x: any) => x.id === v.id) === i
  )
  if (!allEscorts.length) return { notified: 0, tier: 'pro' }

  const inserts = allEscorts
    .filter((e: any) => e.push_token)
    .map((e: any) => ({
      token: e.push_token,
      title: '⭐ Pro Early Access — New Load',
      body: 'A new load just posted. You have a 5-minute exclusive window before Members see it. Tap to view.',
      data: { load_id, type: 'pro_early_access' },
    }))

  if (inserts.length) await supabase.from('push_queue').insert(inserts)

  // Texts stay off until SMS is switched on (see lib/features.ts)
  let smsSent = 0
  if (load && SMS_ENABLED) {
    const puCity = load.pu_city || ''
    const dlCity = load.dl_city || ''
    const puSt = pu_state || load.pu_state || ''
    const dlSt = dl_state || load.dl_state || ''
    const rate = load.per_mile_rate ?? load.rate ?? '?'
    const msg = `New OEH Pro Load: ${puCity}, ${puSt} → ${dlCity}, ${dlSt}. Rate: $${rate}/mi. View: oversize-escort-hub.com/loads/${load_id}`
    for (const e of allEscorts as any[]) {
      if (!e.phone) continue
      try {
        if (await sendSMS(e.phone, msg)) smsSent++
      } catch {}
    }
  }

  return { ok: true, notified: allEscorts.length, sms: smsSent, tier: 'pro' }
}
