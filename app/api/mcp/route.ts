import { NextRequest, NextResponse } from 'next/server'
import { clientIp } from '@/lib/quick-post'
import { handleRpc, MAX_BATCH, MAX_BODY } from '@/lib/mcp'

export const dynamic = 'force-dynamic'

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-headers': 'content-type, accept, mcp-protocol-version, mcp-session-id',
}

// A small per-server window: 60 calls a minute per caller address. The tools are read-only and cheap; this keeps a runaway client polite.
const hits = new Map<string, number[]>()
function limited(ip: string): boolean {
  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60000)
  recent.push(now)
  hits.set(ip, recent)
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < 60000)) hits.delete(k)
  return recent.length > 60
}

const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: CORS })

export function OPTIONS() { return new NextResponse(null, { status: 204, headers: CORS }) }
// No streaming channel and no sessions: clients that probe with GET are told to use POST.
export function GET() { return new NextResponse('This is an MCP endpoint (streamable HTTP). Send JSON-RPC with POST.', { status: 405, headers: { ...CORS, allow: 'POST, OPTIONS' } }) }

export async function POST(req: NextRequest) {
  if (limited(clientIp(req.headers))) return json({ jsonrpc: '2.0', id: null, error: { code: -32000, message: 'Too many requests. Slow down.' } }, 429)
  const raw = await req.text()
  if (raw.length > MAX_BODY) return json({ jsonrpc: '2.0', id: null, error: { code: -32600, message: 'Request too large' } }, 413)
  let body: unknown
  try { body = JSON.parse(raw) } catch { return json({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }, 400) }
  if (Array.isArray(body)) {
    if (body.length === 0 || body.length > MAX_BATCH) return json({ jsonrpc: '2.0', id: null, error: { code: -32600, message: 'Invalid batch' } }, 400)
    const out = (await Promise.all(body.map(handleRpc))).filter((r) => r !== null)
    return out.length ? json(out) : new NextResponse(null, { status: 202, headers: CORS })
  }
  const out = await handleRpc(body)
  return out ? json(out) : new NextResponse(null, { status: 202, headers: CORS })
}
