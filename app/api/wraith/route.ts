import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { serviceClient } from '@/lib/service-client'
import { helperModels, validateTurns } from '@/lib/helper'
import { hasWraithAccess, WRAITH_FREE_DAILY, wraithFreeLeft } from '@/lib/wraith-access'
import { WRAITH_LIMITS, WRAITH_SYSTEM, WRAITH_TOOLS, runWraithTool, speakable, wraithLive, type WraithLink } from '@/lib/wraith'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

const BUSY = 'You have asked me a lot in a short time. Try again in a little while.'
const FAIL = "I couldn't answer just now. Try again in a minute."

async function countSince(table: string, since: string, key?: string, kind?: string): Promise<number> {
  let q = serviceClient().from(table).select('id', { count: 'exact', head: true }).gte('created_at', since)
  if (key) q = q.eq('key', key)
  if (kind) q = q.eq('kind', kind)
  const { data, count } = await q
  return count ?? (Array.isArray(data) ? data.length : 0)
}

// Who am I and how many free questions are left (the page uses it to show the plan and to wait for a payment to land).
export async function GET() {
  if (!wraithLive()) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const { data: { user } } = await (await createClient()).auth.getUser()
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 })
  const svc = serviceClient()
  const paid = await hasWraithAccess(svc, user.id, user.email)
  return NextResponse.json({ paid, freeLeft: paid ? null : await wraithFreeLeft(svc, user.id) })
}

// The voice assistant. Signed-in people only. Read-only tools scoped to the caller. Off unless WRAITH_LIVE=on.
export async function POST(req: NextRequest) {
  if (!wraithLive()) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 })

  let body: { messages?: unknown } = {}
  try { body = await req.json() } catch { /* below */ }
  const turns = validateTurns(body.messages)
  if (!turns) return NextResponse.json({ error: 'Say or type something first.' }, { status: 400 })
  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ reply: 'I am not switched on yet.', off: true })

  const key = `u:${user.id}`
  const now = Date.now()
  const hourAgo = new Date(now - 3600000).toISOString()
  const dayAgo = new Date(now - 86400000).toISOString()
  const [hour, day, all] = await Promise.all([
    countSince('helper_usage', hourAgo, key, 'wraith'),
    countSince('helper_usage', dayAgo, key, 'wraith'),
    countSince('helper_usage', dayAgo, undefined, 'wraith'),
  ])
  const svc = serviceClient()
  const paid = await hasWraithAccess(svc, user.id, user.email)
  // Free taste: a few questions a day. Then it asks for the subscription (made on the website).
  if (!paid && day >= WRAITH_FREE_DAILY) {
    return NextResponse.json({ reply: `That was your ${WRAITH_FREE_DAILY} free questions for today. Wraith Pro has no daily taste limit.`, upgrade: true, paid: false, freeLeft: 0 })
  }
  if (hour >= WRAITH_LIMITS.perKeyHour || day >= WRAITH_LIMITS.perKeyDay) return NextResponse.json({ reply: BUSY, limited: true })
  if (all >= WRAITH_LIMITS.globalDay) return NextResponse.json({ reply: 'I am resting for today. Try again tomorrow.', limited: true })
  await svc.from('helper_usage').insert({ key, kind: 'wraith', question: turns[turns.length - 1].content.slice(0, 300) })

  const workspace = /^wrkspc_[A-Za-z0-9]+$/.test(process.env.ANTHROPIC_WORKSPACE_ID || '') ? process.env.ANTHROPIC_WORKSPACE_ID : ''
  const client = new Anthropic({ maxRetries: 1, timeout: 20000, ...(workspace ? { defaultHeaders: { 'anthropic-workspace-id': workspace } } : {}) })
  const models = helperModels()
  const messages: Anthropic.MessageParam[] = turns.map((t) => ({ role: t.role, content: t.content }))
  const links: WraithLink[] = []

  async function ask(): Promise<Anthropic.Message | null> {
    for (let i = 0; i < models.length; i++) {
      try {
        return await client.messages.create({
          model: models[i],
          max_tokens: WRAITH_LIMITS.maxOutputTokens,
          ...(i === 0 ? { output_config: { effort: 'low' as const } } : {}),
          cache_control: { type: 'ephemeral' },
          system: WRAITH_SYSTEM,
          tools: WRAITH_TOOLS,
          messages,
        })
      } catch (e) {
        const status = e instanceof Anthropic.APIError ? e.status : 0
        const msg = e instanceof Error ? e.message : ''
        const gone = status === 404 || status === 410 || (status === 400 && /model/i.test(msg))
        console.error('[wraith] model error:', models[i], status, msg.slice(0, 300))
        if (!gone || i === models.length - 1) return null
      }
    }
    return null
  }

  let res = await ask()
  for (let round = 0; res && res.stop_reason === 'tool_use' && round < WRAITH_LIMITS.maxToolRounds; round++) {
    const calls = res.content.filter((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use')
    messages.push({ role: 'assistant', content: res.content })
    const results: Anthropic.ToolResultBlockParam[] = []
    for (const c of calls) {
      let out
      try { out = await runWraithTool(c.name, c.input, user.id, svc) } catch { out = { json: JSON.stringify({ error: 'lookup failed' }), links: [] as WraithLink[] } }
      for (const l of out.links) if (links.length < 3 && !links.some((x) => x.href === l.href)) links.push(l)
      results.push({ type: 'tool_result', tool_use_id: c.id, content: out.json })
    }
    messages.push({ role: 'user', content: results })
    res = await ask()
  }
  if (!res) return NextResponse.json({ reply: FAIL, error: true })
  if (res.stop_reason === 'refusal') return NextResponse.json({ reply: "I can't help with that one here." })
  const text = speakable(res.content.filter((b): b is Anthropic.TextBlock => b.type === 'text').map((b) => b.text).join(' '))
  return NextResponse.json({ reply: text || "I'm not sure about that one.", links, paid, freeLeft: paid ? null : Math.max(0, WRAITH_FREE_DAILY - day - 1) })
}

