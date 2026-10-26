import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { escapeHtml } from '@/lib/security'
import { withLogo } from '@/lib/email'

const resend = new Resend(process.env.RESEND_API_KEY)

const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const name = text(body.name, 120)
    const email = text(body.email, 200)
    const subject = text(body.subject, 200)
    const message = text(body.message, 5000)
    if (!name || !email || !message) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email)) return NextResponse.json({ error: 'That email address doesn’t look right' }, { status: 400 })

    // a subject or name with a line break must never become a mail header
    const oneLine = (s: string) => s.replace(/[\r\n]+/g, ' ')

    const { error: sendErr } = await resend.emails.send({
      from: 'OEH Contact <noreply@oversize-escort-hub.com>',
      to: 'support@oversize-escort-hub.com',
      replyTo: email,
      subject: `[OEH Contact] ${oneLine(subject) || 'General Inquiry'} - from ${oneLine(name)}`,
      html: withLogo(`
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Subject:</strong> ${escapeHtml(subject) || 'General Inquiry'}</p>
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
      `),
    })
    if (sendErr) {
      console.error('[contact] resend error:', sendErr)
      return NextResponse.json({ error: 'Could not send your message' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[contact] error:', err)
    return NextResponse.json({ error: 'Could not send your message' }, { status: 500 })
  }
}
