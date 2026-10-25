import { createClient } from '@supabase/supabase-js'
import { SMS_ENABLED } from '@/lib/features'
import { FREE_LAUNCH } from '@/lib/free-launch'
import { sendWebPushToUsers } from '@/lib/push'

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

// Pro early access: queues a push to matching Pro/Fleet escorts the moment a load posts.
// Called by the server from app/api/loads/route.ts, never from a browser.
export async function notifyProEscorts({ load_id, zone, cert_type, pu_state, dl_state }: NotifyProInput) {
  if (!load_id) return { error: 'load_id required' }

  const { data: load } = await supabase.from('loads').select('*').eq('id', load_id).single()

  const stateFilter = (zone || pu_state || '').toUpperCase() || null

  // Instant-claim tiers (mirrors lib/board-access INSTANT_TIERS)
  let query = supabase
    .from('profiles')
    .select('id, full_name, phone, availability_states')
    .in('role', ['escort', 'fleet_manager'])

  // while everything is free every escort is on the instant plan, so no plan filter
  if (!FREE_LAUNCH) query = query.in('tier', ['pro', 'fleet_starter', 'fleet_plus', 'fleet_pro'])

  const { data: proEscorts } = await query

  // Coverage: prefer profiles.availability_states; also include escort_availability rows
  let coveredIds: Set<string> | null = null
  if (stateFilter) {
    coveredIds = new Set<string>()
    for (const e of proEscorts || []) {
      const states = (e.availability_states as string[] | null) || []
      if (states.map((s) => String(s).toUpperCase()).includes(stateFilter)) {
        coveredIds.add(e.id)
      }
    }
    const { data: availRows } = await supabase
      .from('escort_availability')
      .select('escort_id')
      .eq('location_state', stateFilter)
    for (const row of availRows || []) {
      if (row.escort_id) coveredIds.add(row.escort_id)
    }
  }

  const filteredPros = (proEscorts || []).filter((e) => !coveredIds || coveredIds.has(e.id))

  const { data: adminEscorts } = await supabase
    .from('profiles')
    .select('id, email, phone')
    .eq('role', 'escort')
    .in('email', ['brian@precisionpilotservices.com', 'bahmed3170@gmail.com'])

  const allEscorts = [...filteredPros, ...(adminEscorts || [])].filter(
    (v, i, a) => a.findIndex((x: any) => x.id === v.id) === i
  )
  if (!allEscorts.length) return { notified: 0, tier: 'pro' }

  const sent = await sendWebPushToUsers(
    allEscorts.map((e) => e.id),
    {
      title: '⭐ Pro Early Access — New Load',
      body: 'A new load just posted. You have a 5-minute exclusive window before Members see it. Tap to view.',
      url: `/loads/${load_id}`,
      data: { load_id, type: 'pro_early_access' },
    }
  )

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

  return { ok: true, notified: allEscorts.length, pushed: sent, sms: smsSent, tier: 'pro' }
}
