export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }): Promise<boolean> {
  try {
    // Email sending via environment-configured SMTP
    // Falls back to console log in development
    if (!process.env.SMTP_HOST && !process.env.GMAIL_USER) {
      console.log('[Email stub]', { to, subject });
      return true;
    }
    // Production: use fetch to internal email service or SMTP relay
    const response = await fetch('/api/internal/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, html }),
    }).catch(() => null);
    return response?.ok ?? false;
  } catch (error) {
    console.error('Email error:', error);
    return false;
  }
}
