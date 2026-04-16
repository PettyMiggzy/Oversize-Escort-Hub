import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message } = await req.json()
    if (!name || !email || !message) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    await resend.emails.send({
      from: 'OEH Contact <noreply@oversize-escort-hub.com>',
      to: 'support@oversize-escort-hub.com',
      subject: `[OEH Contact] ${subject || 'General Inquiry'} - from ${name}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject || 'General Inquiry'}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[contact] error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
