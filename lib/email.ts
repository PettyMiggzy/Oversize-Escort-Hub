// Logo on top of every email. A fixed public URL (not an attachment) so Gmail and Outlook show it; width/height set
// so the layout holds when images are blocked, and the alt text reads as the name.
export const EMAIL_LOGO_URL = 'https://www.oversize-escort-hub.com/email-logo.png'
const LOGO_HEADER = `<div style="text-align:center;padding:16px 0 8px"><a href="https://www.oversize-escort-hub.com" style="text-decoration:none"><img src="${EMAIL_LOGO_URL}" alt="Oversize Escort Hub" width="180" height="67" style="display:inline-block;width:180px;height:67px;border:0;outline:none;text-decoration:none" /></a></div>`

/** Puts the logo above the email body, unless the email already shows a logo of its own. */
export function withLogo(html: string): string {
  if (/oversize-escort-hub\.com\/(email-)?logo\.png/.test(html)) return html
  return LOGO_HEADER + html
}

export async function sendEmail({ to, subject, html, replyTo }: { to: string; subject: string; html: string; replyTo?: string }): Promise<boolean> {
  try {
    const resendKey = process.env.RESEND_API_KEY;

    // No provider configured (e.g. local dev): log and succeed so callers that
    // only send notification emails don't fail their primary operation.
    if (!resendKey) {
      console.log('[Email stub — set RESEND_API_KEY to send]', { to, subject });
      return true;
    }

    const from = process.env.EMAIL_FROM || 'OEH <noreply@oversize-escort-hub.com>';
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({ from, to, subject, html: withLogo(html), ...(replyTo ? { reply_to: replyTo } : {}) }),
    }).catch(() => null);

    if (!response?.ok) {
      console.error('Email send failed:', response?.status, await response?.text?.().catch(() => ''));
      return false;
    }
    return true;
  } catch (error) {
    console.error('Email error:', error);
    return false;
  }
}
