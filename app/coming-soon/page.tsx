'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

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
    <div
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at top, #1a1a1a 0%, #0a0a0a 60%)',
        color: '#fff',
        fontFamily: "'Inter', system-ui, sans-serif",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
      }}
    >
      <div style={{ maxWidth: 520, width: '100%', textAlign: 'center' }}>
        <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'center' }}>
          <Image
            src="/logo.png"
            alt="Oversize Escort Hub"
            width={96}
            height={96}
            priority
            style={{ borderRadius: 12 }}
          />
        </div>

        <div
          style={{
            display: 'inline-block',
            padding: '4px 12px',
            background: 'rgba(249,144,0,0.12)',
            border: '1px solid rgba(249,144,0,0.4)',
            borderRadius: 999,
            fontSize: 11,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: '#f0a500',
            marginBottom: 20,
            fontFamily: "'Bebas Neue', Impact, sans-serif",
          }}
        >
          Launching May 1st
        </div>

        <h1
          style={{
            fontFamily: "'Bebas Neue', Impact, sans-serif",
            fontSize: 44,
            lineHeight: 1.05,
            margin: '0 0 14px',
            letterSpacing: '0.02em',
          }}
        >
          Oversize Escort Hub
        </h1>

        <p style={{ fontSize: 16, lineHeight: 1.5, color: '#bbb', margin: '0 0 8px' }}>
          The verified marketplace for oversize carriers and P/EVO escorts.
        </p>
        <p style={{ fontSize: 13, lineHeight: 1.5, color: '#888', margin: '0 0 32px' }}>
          Official Evergreen Safety Council Member.
        </p>

        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            marginBottom: 24,
          }}
        >
          <input
            type="email"
            required
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={status === 'loading'}
            style={{
              width: '100%',
              padding: '12px 14px',
              fontSize: 15,
              background: '#111',
              border: '1px solid #2a2a2a',
              borderRadius: 6,
              color: '#fff',
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
          <button
            type="submit"
            disabled={status === 'loading' || !email}
            style={{
              width: '100%',
              padding: '12px 14px',
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              background: status === 'loading' ? '#444' : '#f0a500',
              color: '#000',
              border: 'none',
              borderRadius: 6,
              cursor: status === 'loading' || !email ? 'not-allowed' : 'pointer',
              fontFamily: "'Bebas Neue', Impact, sans-serif",
            }}
          >
            {status === 'loading' ? 'Saving…' : 'Notify Me at Launch'}
          </button>
          {msg && (
            <div
              style={{
                fontSize: 12,
                color: status === 'ok' ? '#7cd97c' : '#ff8080',
                marginTop: 4,
              }}
            >
              {msg}
            </div>
          )}
        </form>

        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', fontSize: 13 }}>
          <Link href="/pricing" style={{ color: '#f0a500', textDecoration: 'none' }}>
            Preview pricing →
          </Link>
          <Link href="/getting-started" style={{ color: '#f0a500', textDecoration: 'none' }}>
            How to get started →
          </Link>
        </div>

        <div style={{ marginTop: 40, fontSize: 11, color: '#555', letterSpacing: '0.1em' }}>
          OVERSIZE-ESCORT-HUB.COM
        </div>
      </div>
    </div>
  );
}
