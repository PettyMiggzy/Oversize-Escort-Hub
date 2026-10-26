'use client';

import { useState } from 'react';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import PageTitle from '@/components/PageTitle';

export default function ComingSoonPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'err'>('idle');
  const [msg, setMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setMsg('');
    try {
      const res = await fetch('/api/notify-launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'coming-soon' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        setStatus('err');
        setMsg(data?.error === 'invalid_email' ? 'Please enter a valid email.' : 'Something went wrong. Try again.');
        return;
      }
      setStatus('ok');
      setMsg("You're on the list. We'll email you May 1st.");
      setEmail('');
    } catch {
      setStatus('err');
      setMsg('Network error. Try again.');
    }
  }

  return (
    <div className="ui-page">
      <SiteHeader />
      <div className="ui-wrap" style={{ maxWidth: 560, textAlign: 'center' }}>
        <img
          src="/logo-wordmark.png"
          alt="Oversize Escort Hub"
          style={{ width: 'min(220px, 70%)', height: 'auto', margin: '0 auto 28px', display: 'block' }}
        />

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <PageTitle
            eyebrow="Launching May 1st"
            title="Oversize Escort Hub"
            lead="The verified marketplace for oversize carriers and P/EVO escorts."
          />
        </div>
        <p className="ui-note" style={{ marginTop: -12, marginBottom: 28 }}>
          Official Evergreen Safety Council Member.
        </p>

        <form
          onSubmit={handleSubmit}
          className="ui-card"
          style={{ display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left' }}
        >
          <input
            className="ui-input"
            type="email"
            required
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={status === 'loading'}
          />
          <button
            className="ui-btn block"
            type="submit"
            disabled={status === 'loading' || !email}
          >
            {status === 'loading' ? 'Saving…' : 'Notify Me at Launch'}
          </button>
          {msg && (
            <div className={status === 'ok' ? 'ui-ok' : 'ui-err'}>
              {msg}
            </div>
          )}
        </form>

        <div className="ui-chips" style={{ justifyContent: 'center', marginTop: 24 }}>
          <Link href="/pricing" className="ui-link">
            Preview pricing →
          </Link>
          <Link href="/getting-started" className="ui-link">
            How to get started →
          </Link>
        </div>

        <div className="ui-note" style={{ marginTop: 40, letterSpacing: '.08em' }}>
          OVERSIZE-ESCORT-HUB.COM
        </div>
      </div>
    </div>
  );
}
