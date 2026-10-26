import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { serviceClient } from '@/lib/service-client'
import { sendEmail } from '@/lib/email'
import { escapeHtml } from '@/lib/security'
import { clientIp, hashIp } from '@/lib/quick-post'
import { EMAIL_RE, HELPER_LIMITS, HELPER_MODEL, HELPER_SYSTEM, validateTurns } from '@/lib/helper'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

const SUPPORT = 'support@oversize-escort-hub.com'
const OFF = `The helper is not switched on yet. Email ${SUPPORT} and the team will answer.`
const BUSY = `You have asked a lot of questions in a short time. Please try again later, or email ${SUPPORT}.`

const TOOLS: Anthropic.Tool[] = [{
  name: 'send_to_team',
  description: 'Send a message to the Oversize Escort Hub team when the person needs a human: an account problem, a bug, a verification question, a partnership or complaint, or a question you cannot answer from the facts. For a signed-out person you must have their email address first.',
  strict: true,
  input_schema: {
    type: 'object',
    properties: {
      summary: { type: 'string', description: 'What the person needs, in one to three plain sentences, with any details they gave.' },
      reply_email: { type: 'string', description: 'Email address to reply to. Empty string if the person is signed in.' },
    },
    required: ['summary', 'reply_email'],
    additionalProperties: false,
  },
}]

async function countSince(table: string, since: string, key?: string, kind?: string): Promise<number> {
  let q = serviceClient().from(table).select('id', { count: 'exact', head: true }).gte('created_at', since)
  if (key) q = q.eq('key', key)
  if (kind) q = q.eq('kind', kind)
  const { data, count } = await q
  return count ?? (Array.isArray(data) ? data.length : 0)
}

export async function POST(req: NextRequest) {
  let body: { messages?: unknown } = {}
  try { body = await req.json() } catch { /* below */ }
  const turns = validateTurns(body.messages)
  if (!turns) return NextResponse.json({ error: 'Type a question first.' }, { status: 400 })

  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ reply: OFF, off: true })

  // who is asking: a signed-in account, else the caller's address (hashed)
  let userId: string | null = null
  let userEmail: string | null = null
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) { userId = user.id; userEmail = user.email ?? null }
  } catch { /* anonymous */ }
  const key = userId ? `u:${userId}` : `ip:${hashIp(clientIp(req.headers))}`

  const now = Date.now()
  const hourAgo = new Date(now - 3600000).toISOString()
  const dayAgo = new Date(now - 86400000).toISOString()
  const [hour, day, all] = await Promise.all([
    countSince('helper_usage', hourAgo, key, 'msg'),
    countSince('helper_usage', dayAgo, key, 'msg'),
    countSince('helper_usage', dayAgo, undefined, 'msg'),
  ])
  if (hour >= HELPER_LIMITS.perKeyHour || day >= HELPER_LIMITS.perKeyDay) return NextResponse.json({ reply: BUSY, limited: true })
  if (all >= HELPER_LIMITS.globalDay) return NextResponse.json({ reply: `The helper is resting for today. Email ${SUPPORT} and the team will answer.`, limited: true })
  const question = turns[turns.length - 1].content
  await serviceClient().from('helper_usage').insert({ key, kind: 'msg', question: question.slice(0, 300) })

  const client = new Anthropic({ maxRetries: 1, timeout: 25000 })
  let res: Anthropic.Message
  try {
    res = await client.messages.create({
      model: HELPER_MODEL,
      max_tokens: HELPER_LIMITS.maxOutputTokens,
      output_config: { effort: 'low' },
      cache_control: { type: 'ephemeral' },
      system: HELPER_SYSTEM,
      tools: TOOLS,
      messages: turns,
    })
  } catch (e) {
    console.error('[helper] model error:', e instanceof Anthropic.APIError ? e.status : e)
    return NextResponse.json({ reply: `I could not answer just now. Please try again in a minute, or email ${SUPPORT}.`, error: true })
  }

  if (res.stop_reason === 'refusal') return NextResponse.json({ reply: `I can't help with that one here. Email ${SUPPORT} if you need something from the team.` })

  const text = res.content.filter((b): b is Anthropic.TextBlock => b.type === 'text').map((b) => b.text).join('\n').trim()
  const call = res.content.find((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use' && b.name === 'send_to_team')
  if (!call) return NextResponse.json({ reply: text || `I am not sure about that. Email ${SUPPORT} and the team will answer.` })

  // The model asked to pass a message to the team: a few per person a day, and a reply address is required
  const input = (call.input ?? {}) as { summary?: unknown; reply_email?: unknown }
  const summary = typeof input.summary === 'string' ? input.summary.trim().slice(0, 1500) : ''
  const typed = typeof input.reply_email === 'string' ? input.reply_email.trim() : ''
  const replyTo = userEmail || (EMAIL_RE.test(typed) ? typed : '')
  if (!summary) return NextResponse.json({ reply: text || 'What would you like me to pass on to the team?' })
  if (!replyTo) return NextResponse.json({ reply: 'What email address should the team reply to?' })
  if (await countSince('helper_usage', dayAgo, key, 'ticket') >= HELPER_LIMITS.ticketsPerKeyDay) {
    return NextResponse.json({ reply: `You have already sent a few messages to the team today. Please wait for their reply, or email ${SUPPORT}.` })
  }
  await serviceClient().from('helper_usage').insert({ key, kind: 'ticket', question: summary.slice(0, 300) })
  const oneLine = (s: string) => s.replace(/[\r\n]+/g, ' ')
  const sent = await sendEmail({
    to: SUPPORT,
    replyTo,
    subject: `[OEH helper] ${oneLine(summary).slice(0, 70)}`,
    html: `<p><strong>Sent by the site helper.</strong></p><p><strong>From:</strong> ${escapeHtml(replyTo)}${userId ? ` (signed-in account ${escapeHtml(userId)})` : ' (signed out)'}</p><p><strong>What they need:</strong><br>${escapeHtml(summary).replace(/\n/g, '<br>')}</p><p><strong>Their last message:</strong><br>${escapeHtml(question).replace(/\n/g, '<br>')}</p>`,
  })
  if (!sent) return NextResponse.json({ reply: `I could not reach the team just now. Please email ${SUPPORT} directly.` })
  return NextResponse.json({ reply: `${text ? text + '\n\n' : ''}Done. I sent that to the team and they will reply to ${replyTo}.`, ticket: true })
}
