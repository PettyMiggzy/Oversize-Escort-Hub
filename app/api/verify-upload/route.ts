import { sendEmail } from '@/lib/email';
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { escapeHtml } from '@/lib/security'

export async function POST(req: Request) {
  const { user, error: authErr } = await requireAuth()
  if (authErr) return authErr
  try {
    const { tier, fileName } = await req.json()
    // the page sends tier as the number 1 or 2; anything else is refused
    const t = Number(tier)
    if (t !== 1 && t !== 2) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    const userId = user!.id
    const subject = t === 1 ? 'Tier 1 P/EVO Cert Submission' : 'Tier 2 Vehicle Submission'
    await sendEmail({to: 'verify@oversize-escort-hub.com',
      subject,
      html: `<p><strong>Tier ${t} Verification Submission</strong></p><p>User ID: ${escapeHtml(userId)}</p><p>File: ${escapeHtml(String(fileName || 'N/A').slice(0, 200))}</p><p>Bucket: ${t === 1 ? 'pevo-certs' : 'vehicle-docs'}/${escapeHtml(userId)}/</p><p>Submitted: ${new Date().toISOString()}</p>`,
    })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[verify-upload] error:', err)
    return NextResponse.json({ error: 'Could not send the notice' }, { status: 500 })
  }
}
