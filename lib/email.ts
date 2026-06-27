export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }): Promise<boolean> {
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
      body: JSON.stringify({ from, to, subject, html }),
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
