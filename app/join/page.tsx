'use client';
import { useState } from 'react';

const bg = '#060b16';
const surface = '#0d1117';
const orange = '#f0a500';

export default function JoinPage() {
  const [loading, setLoading] = useState<string | null>(null);

  async function checkout(priceId: string) {
    setLoading(priceId);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(null);
    }
  }

  const btn: React.CSSProperties = {
    display: 'block',
    width: '100%',
    padding: '12px 0',
    border: 'none',
    borderRadius: '6px',
    fontWeight: 700,
    fontSize: '15px',
    cursor: 'pointer',
    marginTop: '12px',
    transition: 'opacity 0.2s',
  };

  const card: React.CSSProperties = {
    background: surface,
    border: `1px solid #1e2533`,
    borderRadius: '12px',
    padding: '32px 28px',
    flex: '1 1 280px',
    maxWidth: '360px',
  };

  return (
    <div style={{ minHeight: '100vh', background: bg, color: '#eee', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '60px 20px' }}>
        <h1 style={{ textAlign: 'center', fontSize: '36px', fontWeight: 800, marginBottom: '8px' }}>
          Join <span style={{ color: orange }}>Oversize Escort Hub</span>
        </h1>
        <p style={{ textAlign: 'center', color: '#888', marginBottom: '48px', fontSize: '16px' }}>
          Choose the plan that fits your role
        </p>

        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', justifyContent: 'center' }}>

          {/* Card 1 — P/EVO Escort */}
          <div style={{ ...card, borderTop: `4px solid ${orange}` }}>
            <h2 style={{ color: orange, fontSize: '22px', fontWeight: 700, margin: '0 0 8px' }}>
              P/EVO Escort
            </h2>
            <p style={{ color: '#aaa', fontSize: '14px', marginBottom: '20px', lineHeight: '1.5' }}>
              Pilot/escort vehicle operators. Access load matching, escort profiles, BGC badge, and more.
            </p>

            <div style={{ borderTop: '1px solid #1e2533', paddingTop: '20px' }}>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', color: '#888', marginBottom: '4px' }}>MEMBER</div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff' }}>$19.99<span style={{ fontSize: '14px', color: '#888', fontWeight: 400 }}>/mo</span></div>
                <div style={{ fontSize: '13px', color: '#aaa', marginTop: '4px' }}>Load board access, basic matching</div>
                <button
                  style={{ ...btn, background: '#1e2533', color: '#fff', border: `1px solid ${orange}` }}
                  disabled={loading === 'price_1TF0D4LmfugPCRbAd4hMO22R'}
                  onClick={() => checkout('price_1TF0D4LmfugPCRbAd4hMO22R')}
                >
                  {loading === 'price_1TF0D4LmfugPCRbAd4hMO22R' ? 'Redirecting...' : 'Get Member — $19.99/mo'}
                </button>
              </div>

              <div>
                <div style={{ fontSize: '13px', color: '#888', marginBottom: '4px' }}>PRO</div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: orange }}>$29.99<span style={{ fontSize: '14px', color: '#888', fontWeight: 400 }}>/mo</span></div>
                <div style={{ fontSize: '13px', color: '#aaa', marginTop: '4px' }}>Auto-match SMS, sponsored zone, BGC badge, all Pro features</div>
                <button
                  style={{ ...btn, background: orange, color: bg }}
                  disabled={loading === 'price_1TF0DiLmfugPCRbAPWsN2K5x'}
                  onClick={() => checkout('price_1TF0DiLmfugPCRbAPWsN2K5x')}
                >
                  {loading === 'price_1TF0DiLmfugPCRbAPWsN2K5x' ? 'Redirecting...' : 'Get Pro — $29.99/mo'}
                </button>
              </div>
            </div>
          </div>

          {/* Card 2 — Carrier / Operator */}
          <div style={{ ...card }}>
            <h2 style={{ color: '#fff', fontSize: '22px', fontWeight: 700, margin: '0 0 8px' }}>
              Carrier / Operator
            </h2>
            <p style={{ color: '#aaa', fontSize: '14px', marginBottom: '20px', lineHeight: '1.5' }}>
              Trucking companies and load operators. Post loads, access the carrier hub, and manage matches — always free.
            </p>
            <div style={{ borderTop: '1px solid #1e2533', paddingTop: '20px' }}>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#4ade80' }}>FREE</div>
              <div style={{ fontSize: '13px', color: '#aaa', marginTop: '4px' }}>No subscription required</div>
              <a href="/signin" style={{ textDecoration: 'none' }}>
                <button style={{ ...btn, background: '#1e2533', color: '#fff', border: '1px solid #333' }}>
                  Sign In / Register Free
                </button>
              </a>
            </div>
          </div>

          {/* Card 3 — Fleet Manager */}
          <div style={{ ...card, borderTop: `4px solid ${orange}` }}>
            <h2 style={{ color: orange, fontSize: '22px', fontWeight: 700, margin: '0 0 8px' }}>
              Fleet Manager
            </h2>
            <p style={{ color: '#aaa', fontSize: '14px', marginBottom: '20px', lineHeight: '1.5' }}>
              Manage an entire fleet of escorts under one account. Zones, jobs, dashboards, and multi-escort coordination.
            </p>
            <div style={{ borderTop: '1px solid #1e2533', paddingTop: '20px' }}>
              <div style={{ fontSize: '28px', fontWeight: 800, color: orange }}>$99.99<span style={{ fontSize: '14px', color: '#888', fontWeight: 400 }}>/mo</span></div>
              <div style={{ fontSize: '13px', color: '#aaa', marginTop: '4px' }}>Full fleet dashboard, all Pro features for all escorts</div>
              <button
                style={{ ...btn, background: orange, color: bg }}
                disabled={loading === 'price_1TMT9fLmfugPCRbA0Tu65Ui0'}
                onClick={() => checkout('price_1TMT9fLmfugPCRbA0Tu65Ui0')}
              >
                {loading === 'price_1TMT9fLmfugPCRbA0Tu65Ui0' ? 'Redirecting...' : 'Get Fleet Manager — $99.99/mo'}
              </button>
            </div>
          </div>

        </div>

        <p style={{ textAlign: 'center', color: '#666', marginTop: '40px', fontSize: '13px' }}>
          Already have an account?{' '}
          <a href="/signin" style={{ color: orange }}>Sign in here</a>
        </p>
      </div>
    </div>
  );
}
