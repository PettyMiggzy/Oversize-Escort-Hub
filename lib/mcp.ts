// A small read-only MCP server (streamable HTTP, stateless JSON replies) so AI assistants can look things up on the site.
// Public data only: the beginner's guide, the fact sheet, escorts by state (the same public fields as the state pages),
// and open loads (route, pay, date; no company, no notes, no contact details). Nothing here can change anything.
import { serviceClient } from '@/lib/service-client'
import { HELPER_KNOWLEDGE } from '@/lib/helper-knowledge'
import { GUIDE_CHECKED, GUIDE_SECTIONS, SOURCES } from '@/lib/guide-content'
import { placeFor } from '@/lib/state-codes'

export const SITE = 'https://www.oversize-escort-hub.com'
export const PROTOCOLS = ['2025-06-18', '2025-03-26', '2024-11-05']
export const MAX_BODY = 20000
export const MAX_BATCH = 10
const MAX_ROWS = 20

type Json = Record<string, unknown>
type Rpc = { jsonrpc?: unknown; id?: unknown; method?: unknown; params?: unknown }
type ToolResult = { content: { type: 'text'; text: string }[]; structuredContent?: Json; isError?: boolean }

const READ_ONLY = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }

export const TOOLS = [
  {
    name: 'get_pilot_car_guide',
    title: 'Pilot car beginner guide',
    description: 'Plain-words guide for people new to pilot car / P/EVO work: what the job is, the escort positions, which states required certification (as of 2016), equipment, insurance, safety, and where to check each state\'s rules. Every section lists its public sources. Rules are set state by state and change: always confirm with the state.',
    inputSchema: { type: 'object', properties: { section: { type: 'string', description: 'Optional section id: ' + GUIDE_SECTIONS.map((s) => s.id).join(', ') + '. Omit for the whole guide.' } }, additionalProperties: false },
    annotations: { title: 'Pilot car beginner guide', ...READ_ONLY },
  },
  {
    name: 'get_site_facts',
    title: 'Oversize Escort Hub facts',
    description: 'What Oversize Escort Hub is, what it costs, how the flat-rate, open-bid and 5-minute bid boards work for escorts, carriers, brokers and fleets, how verification badges work, and the privacy rules.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: { title: 'Oversize Escort Hub facts', ...READ_ONLY },
  },
  {
    name: 'find_pilot_car_escorts',
    title: 'Find pilot car escorts by state',
    description: 'Pilot car / P/EVO escorts who list a US state, DC or Canadian province on Oversize Escort Hub. Returns names, badges and a profile link. No phone numbers or emails: those are shared only after a carrier accepts an escort. A listing does not mean the escort is free today.',
    inputSchema: { type: 'object', properties: { state: { type: 'string', description: 'Two-letter state or province code, for example TX or AB.' }, limit: { type: 'integer', minimum: 1, maximum: MAX_ROWS } }, required: ['state'], additionalProperties: false },
    annotations: { title: 'Find pilot car escorts by state', ...READ_ONLY },
  },
  {
    name: 'search_open_loads',
    title: 'Open oversize loads needing escorts',
    description: 'Open loads on the boards right now: route, escort type, pay, date and a link. No company names or contact details. Optionally filter by a state the load starts or ends in.',
    inputSchema: { type: 'object', properties: { state: { type: 'string', description: 'Optional two-letter state or province code.' }, limit: { type: 'integer', minimum: 1, maximum: MAX_ROWS } }, additionalProperties: false },
    annotations: { title: 'Open oversize loads needing escorts', ...READ_ONLY },
  },
] as const

const text = (t: string, structured?: Json): ToolResult => ({ content: [{ type: 'text', text: t }], ...(structured ? { structuredContent: structured } : {}) })
const bad = (t: string): ToolResult => ({ content: [{ type: 'text', text: t }], isError: true })
const limitOf = (v: unknown) => { const n = Math.trunc(Number(v)); return Number.isFinite(n) && n >= 1 ? Math.min(n, MAX_ROWS) : 10 }

function guideText(sectionId?: string): ToolResult {
  const chosen = sectionId ? GUIDE_SECTIONS.filter((s) => s.id === sectionId) : GUIDE_SECTIONS
  if (!chosen.length) return bad(`Unknown section "${sectionId}". Sections: ${GUIDE_SECTIONS.map((s) => s.id).join(', ')}.`)
  const out = chosen.map((s) => [`## ${s.title}`, ...s.body, ...(s.bullets ?? []).map((b) => `- ${b}`), s.sources.length ? 'Sources: ' + s.sources.map((id) => `${SOURCES[id].title} (${SOURCES[id].url})`).join('; ') : ''].filter(Boolean).join('\n\n')).join('\n\n')
  return text(`Pilot car beginner guide (last checked ${GUIDE_CHECKED}). Rules are set by each state and change: confirm with the state permit office. Full page: ${SITE}/pilot-car-guide\n\n${out}`)
}

type EscortRow = { id: string; full_name: string | null; tier: string | null; bgc_verified: boolean | null; pevo_verified: boolean | null; p_evo_verified: boolean | null; availability_states: string[] | null; states_licensed: string[] | null }

async function escorts(args: Json): Promise<ToolResult> {
  const place = placeFor(String(args.state ?? ''))
  if (!place) return bad('Give a two-letter US state, DC or Canadian province code, for example TX.')
  const cols = 'id, full_name, tier, bgc_verified, pevo_verified, p_evo_verified, availability_states, states_licensed'
  const svc = serviceClient()
  const q = (col: string) => svc.from('profiles').select(cols).eq('role', 'escort').or('suspended.is.null,suspended.eq.false').contains(col, [place.code]).limit(60)
  const [a, b] = await Promise.all([q('availability_states'), q('states_licensed')])
  if (a.error || b.error) return bad('The escort list could not be loaded right now. Try again later.')
  const seen = new Set<string>()
  const rows: EscortRow[] = []
  for (const r of [...(a.data ?? []), ...(b.data ?? [])] as unknown as EscortRow[]) if (r?.id && !seen.has(r.id)) { seen.add(r.id); rows.push(r) }
  rows.sort((x, y) => (x.full_name || '').localeCompare(y.full_name || ''))
  const list = rows.slice(0, limitOf(args.limit)).map((r) => ({
    name: r.full_name || 'Escort', profile: `${SITE}/escorts/${r.id}`,
    background_check_badge: !!r.bgc_verified, pevo_badge: !!(r.pevo_verified || r.p_evo_verified), pro_member: r.tier === 'pro',
    states: [...new Set([...(r.availability_states ?? []), ...(r.states_licensed ?? [])].map((s) => String(s).toUpperCase()))],
  }))
  const lines = list.map((e) => `- ${e.name}: ${e.profile}${e.pevo_badge ? ' (P/EVO badge)' : ''}${e.background_check_badge ? ' (background check badge)' : ''}; covers ${e.states.join(', ')}`)
  return text(list.length ? `${rows.length} escort(s) list ${place.name}${rows.length > list.length ? `, showing ${list.length}` : ''}. Contact details are shared only after a carrier accepts an escort; open a profile or post a load at ${SITE}/quick-post.\n${lines.join('\n')}` : `No escorts list ${place.name} yet. A carrier can still post a load at ${SITE}/quick-post and escorts get alerts.`, { escorts: list, total: rows.length })
}

type LoadRow = { id: string; board_type: string | null; pu_city: string | null; pu_state: string | null; dl_city: string | null; dl_state: string | null; escort_type: string | null; position: string | null; per_mile_rate: number | null; rate: number | null; pay_type: string | null; start_date: string | null; created_at: string | null; expires_at: string | null; deadhead_notified_at: string | null; source: string | null; reviewed_at: string | null; cert_types: string[] | null }

async function loads(args: Json): Promise<ToolResult> {
  let code = ''
  if (args.state !== undefined && args.state !== '') {
    const place = placeFor(String(args.state))
    if (!place) return bad('Give a two-letter US state, DC or Canadian province code, for example TX, or leave state out.')
    code = place.code
  }
  const { data, error } = await serviceClient().from('loads')
    .select('id, board_type, pu_city, pu_state, dl_city, dl_state, escort_type, position, per_mile_rate, rate, pay_type, start_date, created_at, expires_at, deadhead_notified_at, source, reviewed_at, cert_types')
    .eq('status', 'open').order('created_at', { ascending: false }).limit(100)
  if (error) return bad('Loads could not be loaded right now. Try again later.')
  const now = Date.now()
  const rows = ((data ?? []) as unknown as LoadRow[]).filter((l) =>
    // the same rules the public boards follow: a minute's head start for members, a 5-minute hold after a deadhead heads-up,
    // nothing expired, and account-free posts only after an admin has looked
    (!l.created_at || Date.parse(l.created_at) < now - 60000) &&
    (!l.deadhead_notified_at || Date.parse(l.deadhead_notified_at) < now - 300000) &&
    (!l.expires_at || Date.parse(l.expires_at) > now) &&
    (l.source !== 'quick_post' || !!l.reviewed_at) &&
    (!code || l.pu_state?.toUpperCase() === code || l.dl_state?.toUpperCase() === code))
  const list = rows.slice(0, limitOf(args.limit)).map((l) => ({
    route: `${l.pu_city}, ${l.pu_state} to ${l.dl_city}, ${l.dl_state}`, board: l.board_type, escort_type: l.escort_type || l.position,
    pay: l.per_mile_rate != null ? `$${l.per_mile_rate} per mile` : l.rate != null ? `$${l.rate}${l.pay_type ? ' ' + l.pay_type : ''}` : 'see load',
    start_date: l.start_date, certifications: l.cert_types ?? [], link: `${SITE}/loads/${l.id}`,
  }))
  const lines = list.map((l) => `- ${l.route} | ${l.escort_type ?? 'escort'} | ${l.pay} | ${l.start_date ?? 'date open'} | ${l.link}`)
  return text(list.length ? `${rows.length} open load(s)${code ? ' in ' + code : ''}, showing ${list.length}. Bids and claims need a free account.\n${lines.join('\n')}` : `No open loads${code ? ' in ' + code : ''} right now. New ones post all day: ${SITE}/open-loads`, { loads: list, total: rows.length })
}

export async function callTool(name: string, args: Json): Promise<ToolResult> {
  try {
    if (name === 'get_pilot_car_guide') return guideText(typeof args.section === 'string' ? args.section : undefined)
    if (name === 'get_site_facts') return text(HELPER_KNOWLEDGE)
    if (name === 'find_pilot_car_escorts') return await escorts(args)
    if (name === 'search_open_loads') return await loads(args)
  } catch {
    return bad('Something went wrong. Try again later.')
  }
  return bad(`Unknown tool "${name}".`)
}

const err = (id: unknown, code: number, message: string) => ({ jsonrpc: '2.0', id: id ?? null, error: { code, message } })

/** One JSON-RPC message in, one reply out (null for notifications and replies, which get no answer). */
export async function handleRpc(msg: unknown): Promise<Json | null> {
  if (!msg || typeof msg !== 'object' || Array.isArray(msg)) return err(null, -32600, 'Invalid request')
  const m = msg as Rpc
  const hasId = m.id !== undefined && m.id !== null
  if (m.jsonrpc !== '2.0' || typeof m.method !== 'string') return hasId && !('method' in m) ? null : err(m.id, -32600, 'Invalid request')
  if (!hasId) return null // a notification (for example notifications/initialized)
  const params = (m.params && typeof m.params === 'object' && !Array.isArray(m.params) ? m.params : {}) as Json
  switch (m.method) {
    case 'initialize': {
      const asked = typeof params.protocolVersion === 'string' ? params.protocolVersion : ''
      return { jsonrpc: '2.0', id: m.id, result: {
        protocolVersion: PROTOCOLS.includes(asked) ? asked : PROTOCOLS[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: 'oversize-escort-hub', title: 'Oversize Escort Hub', version: '1.0.0', websiteUrl: SITE },
        instructions: 'Read-only tools about pilot car (P/EVO) work and the Oversize Escort Hub marketplace. Pilot car rules are set by each state and change: tell people to confirm with the state. Contact details are never available through these tools.',
      } }
    }
    case 'ping': return { jsonrpc: '2.0', id: m.id, result: {} }
    case 'tools/list': return { jsonrpc: '2.0', id: m.id, result: { tools: TOOLS } }
    case 'tools/call': {
      const name = params.name
      if (typeof name !== 'string' || !TOOLS.some((t) => t.name === name)) return err(m.id, -32602, `Unknown tool: ${String(name).slice(0, 60)}`)
      const args = (params.arguments && typeof params.arguments === 'object' && !Array.isArray(params.arguments) ? params.arguments : {}) as Json
      return { jsonrpc: '2.0', id: m.id, result: await callTool(name, args) }
    }
    default: return err(m.id, -32601, 'Method not found')
  }
}
