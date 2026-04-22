'use client';
import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import SiteHeader from '@/components/SiteHeader';

const bg = '#060b16';
const surface = '#0d1117';
const orange = '#f0a500';

// ── Fleet tier definitions ───────────────────────────────────────────────────
// Fleet Starter  price_1TMT9fLmfugPCRbA0Tu65Ui0  ← existing "Fleet Pro" ID
//                (only one fleet price existed at grep time; Starter + Plus
//                 IDs must be added to .env.local once created in Stripe)
const FLEET_STARTER_PRICE_ID = process.env.NEXT_PUBLIC_FLEET_STARTER_PRICE_ID || 'price_1TMUvjLmfugPCRbAa1HHd7f3';
const FLEET_PLUS_PRICE_ID    = process.env.NEXT_PUBLIC_FLEET_PLUS_PRICE_ID    || 'price_1TMUwaLmfugPCRbAxwDBbslg';
const FLEET_PRO_PRICE_ID     = process.env.NEXT_PUBLIC_FLEET_PRO_PRICE_ID     || 'price_1TMT9fLmfugPCRbA0Tu65Ui0';

const fleetTiers = [
  {
    name: 'Fleet Starter',
    price: '$29.99',
    sub: 'per month',
    escorts: 'Up to 5 escorts',
    priceId: FLEET_STARTER_PRICE_ID,
    color: '#3d8ef8',
    popular: false,
  },
  {
    name: 'Fleet Plus',
    price: '$49.99',
    sub: 'per month',
    escorts: 'Up to 10 escorts',
    priceId: FLEET_PLUS_PRICE_ID,
    color: '#f5a200',
    popular: true,
  },
  {
    name: 'Fleet Pro',
    price: '$99.99',
    sub: 'per month',
    escorts: 'Unlimited escorts',
    priceId: FLEET_PRO_PRICE_ID,
    color: '#ff6200',
    popular: false,
  },
];

const fleetFeatures = [
  'All Escort Member features',
  'All Escort Pro features',
  'Fleet dashboard & escort management',
  'Deadhead Minimizer for all escorts',
  'Multi-escort job coordination',
  'Sponsored zone eligibility',
  'BGC badge support per escort',
];

function JoinPageInner() {
  const [loading, setLoading] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const roleParam = searchParams.get('role');
  const fleetOnly = roleParam === 'fleet';

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
    border: '1px solid #1e2533',
    borderRadius: '12px',
    padding: '32px 28px',
    flex: '1 1 280px',
    maxWidth: '360px',
  };

  return (
    <div style={{ minHeight: '100vh', background: bg, color: '#eee', fontFamily: 'sans-serif' }}>
      <SiteHeader />
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '60px 20px' }}>
        <h1 style={{ textAlign: 'center', fontSize: '36px', fontWeight: 800, marginBottom: '8px' }}>
          Join <span style={{ color: orange }}>Oversize Escort Hub</span>
        </h1>
        <p style={{ textAlign: 'center', color: '#888', marginBottom: '48px', fontSize: '16px' }}>
          {fleetOnly ? 'Choose your Fleet plan' : 'Choose the plan that fits your role'}
        </p>

        {/* ── Non-fleet cards (hidden when ?role=fleet) ── */}
        {!fleetOnly && (
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '48px' }}>

            {/* Card 1 – P/EVO Escort */}
            <div style={{ ...card, borderTop: `4px solid ${orange}` }}>
              <h2 style={{ color: orange, fontSize: '22px', fontWeight: 700, margin: '0 0 8px' }}>
                P/EVO Escort
              </h2>
              <p style={{ color: '#aaa', fontSize: '14px', marginBottom: '20px', lineHeight: '1.5' }}>
                Pilot/escort vehicle operators. Access load matching, escort profiles, BGC badge, and more.
              </p>

              <div style={{ borderTop: '1px solid #1e2533', paddingTop: '20px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '13px', color: '#aaa', marginTop: '4px' }}>Member – Free</div>
                  <div style={{ fontSize: '13px', color: '#aaa', marginTop: '4px' }}>No subscription required</div>
                  <a href="/signin" style={{ textDecoration: 'none' }}>
                    <button style={{ ...btn, background: '#1e2533', color: '#fff', border: '1px solid #333' }}>
                      Sign In / Register Free
                    </button>
                  </a>
                </div>
              </div>
            </div>

            {/* Card 2 – Escort Pro */}
            <div style={{ ...card, borderTop: `4px solid ${orange}` }}>
              <h2 style={{ color: orange, fontSize: '22px', fontWeight: 700, margin: '0 0 8px' }}>
                Escort Pro
              </h2>
              <p style={{ color: '#aaa', fontSize: '14px', marginBottom: '20px', lineHeight: '1.5' }}>
                Advanced tools for serious operators. Priority matching, Deadhead Minimizer, sponsored zones, and more.
              </p>
              <div style={{ borderTop: '1px solid #1e2533', paddingTop: '20px' }}>
                <div style={{ fontSize: '28px', fontWeight: 800, color: orange }}>$9.99<span style={{ fontSize: '14px', color: '#888', fontWeight: 400 }}>/mo</span></div>
                <div style={{ fontSize: '13px', color: '#aaa', marginTop: '4px' }}>All Pro escort features</div>
                <button
                  style={{ ...btn, background: orange, color: bg }}
                  disabled={loading === 'price_1TF021LmfugPCRbA7CGgLhC0'}
                  onClick={() => checkout('price_1TF021LmfugPCRbA7CGgLhC0')}
                >
                  {loading === 'price_1TF021LmfugPCRbA7CGgLhC0' ? 'Redirecting...' : 'Get Escort Pro – $9.99/mo'}
                </button>
              </div>
            </div>

            {/* Card 3 – Fleet Manager (legacy single card, hidden in fleet mode) */}
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
                  disabled={loading === FLEET_PRO_PRICE_ID}
                  onClick={() => checkout(FLEET_PRO_PRICE_ID)}
                >
                  {loading === FLEET_PRO_PRICE_ID ? 'Redirecting...' : 'Get Fleet Manager – $99.99/mo'}
                </button>
              </div>
            </div>

          </div>
        )}

        {/* ── Fleet tier 3-column grid (shown when ?role=fleet) ── */}
        {fleetOnly && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', maxWidth: '1060px', margin: '0 auto 48px' }}>
              {fleetTiers.map((tier) => (
                <div
                  key={tier.name}
                  style={{
                    background: surface,
                    border: tier.popular ? `2px solid ${tier.color}` : '1px solid #1e2533',
                    borderTop: `4px solid ${tier.color}`,
                    borderRadius: '12px',
                    padding: '32px 28px',
                    position: 'relative',
                  }}
                >
                  {/* Most Popular badge */}
                  {tier.popular && (
                    <div style={{
                      position: 'absolute',
                      top: '-14px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: tier.color,
                      color: '#fff',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '3px 14px',
                      borderRadius: '20px',
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      whiteSpace: 'nowrap',
                    }}>
                      Most Popular
                    </div>
                  )}

                  {/* Tier name */}
                  <h2 style={{ color: tier.color, fontSize: '20px', fontWeight: 700, margin: '0 0 6px' }}>
                    {tier.name}
                  </h2>

                  {/* Escort slots — prominent */}
                  <div style={{
                    background: `${tier.color}18`,
                    border: `1px solid ${tier.color}44`,
                    borderRadius: '8px',
                    padding: '10px 14px',
                    marginBottom: '20px',
                    textAlign: 'center',
                  }}>
                    <span style={{ color: tier.color, fontWeight: 800, fontSize: '16px' }}>
                      {tier.escorts}
                    </span>
                  </div>

                  {/* Price */}
                  <div style={{ marginBottom: '20px' }}>
                    <span style={{ fontSize: '32px', fontWeight: 800, color: '#eee' }}>{tier.price}</span>
                    <span style={{ fontSize: '14px', color: '#888', marginLeft: '4px' }}>{tier.sub}</span>
                  </div>

                  {/* Features list */}
                  <div style={{ borderTop: '1px solid #1e2533', paddingTop: '16px', marginBottom: '20px' }}>
                    {fleetFeatures.map((f) => (
                      <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                        <span style={{ color: tier.color, fontSize: '14px', marginTop: '1px', flexShrink: 0 }}>✓</span>
                        <span style={{ color: '#ccc', fontSize: '13px', lineHeight: '1.4' }}>{f}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA button */}
                  <button
                    style={{
                      ...btn,
                      background: tier.popular ? tier.color : 'transparent',
                      color: tier.popular ? bg : tier.color,
                      border: `2px solid ${tier.color}`,
                      marginTop: '0',
                    }}
                    disabled={loading === tier.priceId}
                    onClick={() => checkout(tier.priceId)}
                  >
                    {loading === tier.priceId ? 'Redirecting...' : `Get ${tier.name} – ${tier.price}/mo`}
                  </button>
                </div>
              ))}
            </div>

            <p style={{ textAlign: 'center', color: '#555', fontSize: '13px' }}>
              All Fleet plans include every Member &amp; Pro escort feature. Only escort slot count differs.
            </p>
          </>
        )}

        <p style={{ textAlign: 'center', color: '#666', marginTop: '40px', fontSize: '13px' }}>
          Already have an account?{' '}
          <a href="/signin" style={{ color: orange }}>Sign in here</a>
        </p>
      </div>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={null}>
      <JoinPageInner />
    </Suspense>
  );
}
