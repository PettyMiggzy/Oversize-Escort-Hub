import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)

export async function POST(req: Request) {
  try {
    const { userId, tier, subject, fileName } = await req.json()
    if (!userId || !tier || !subject) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    await resend.emails.send({
      from: 'noreply@oversize-escort-hub.com',
      to: 'verify@oversize-escort-hub.com',
      subject,
      html: `<p><strong>Tier ${tier} Verification Submission</strong></p><p>User ID: ${userId}</p><p>File: ${fileName || 'N/A'}</p><p>Bucket: ${tier === 1 ? 'pevo-certs' : 'vehicle-docs'}/${userId}/</p><p>Submitted: ${new Date().toISOString()}</p>`,
    })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
