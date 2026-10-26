'use client';
import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import WebOnly from '@/components/WebOnly';
import SiteHeader from '@/components/SiteHeader';
import PageTitle from '@/components/PageTitle';

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
    popular: false,
  },
  {
    name: 'Fleet Plus',
    price: '$49.99',
    sub: 'per month',
    escorts: 'Up to 10 escorts',
    priceId: FLEET_PLUS_PRICE_ID,
    popular: true,
  },
  {
    name: 'Fleet Pro',
    price: '$99.99',
    sub: 'per month',
    escorts: 'Unlimited escorts',
    priceId: FLEET_PRO_PRICE_ID,
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
];

function JoinPageInner() {
  const [loading, setLoading] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const roleParam = searchParams.get('role');
  const fleetOnly = roleParam === 'fleet';

  async function checkout(priceId: string) {
    setLoading(priceId);
    try {
      // Paid plans must be linked to a signed-in account so the Stripe webhook can set tier.
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = `/signin?redirect=${encodeURIComponent('/join')}`;
        return;
      }
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert(data.error || 'Checkout failed');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="ui-page">
      <SiteHeader />
      <div className="ui-wrap">
        <PageTitle
          eyebrow="Account"
          title="Join Oversize Escort Hub"
          lead={fleetOnly ? 'Choose your Fleet plan' : 'Choose the plan that fits your role'}
        />

        {!fleetOnly && (
          <p className="ui-note" style={{ textAlign: 'center', marginTop: -12, marginBottom: 28 }}>
            Carrier or Freight Broker?{' '}
            <a href="/signin?role=carrier" className="ui-link">
              Sign in as Carrier →
            </a>
            <span style={{ margin: '0 10px', color: 'var(--ui-dim)' }}>•</span>
            <a href="/signin?role=broker" className="ui-link">
              Sign in as Freight Broker →
            </a>
          </p>
        )}

        {!fleetOnly && (
          <div className="ui-fit" style={{ marginBottom: 48 }}>

            <div className="ui-card" style={{ display: 'flex', flexDirection: 'column' }}>
              <h2 style={{ color: 'var(--ui-or)' }}>P/EVO Escort</h2>
              <p className="ui-note" style={{ marginBottom: 20 }}>
                Pilot/escort vehicle operators. Access load matching, escort profiles, and more.
              </p>
              <div style={{ borderTop: '1px solid var(--ui-line)', paddingTop: 20, marginTop: 'auto' }}>
                <div className="ui-note">Member – Free</div>
                <div className="ui-note">No subscription required</div>
                <a href="/signin" style={{ textDecoration: 'none' }}>
                  <button className="ui-btn ghost block" style={{ marginTop: 12 }}>
                    Sign In / Register Free
                  </button>
                </a>
              </div>
            </div>

            <div className="ui-card" style={{ display: 'flex', flexDirection: 'column' }}>
              <h2 style={{ color: 'var(--ui-or)' }}>Escort Pro</h2>
              <p className="ui-note" style={{ marginBottom: 20 }}>
                Advanced tools for serious operators. Priority matching, Deadhead Minimizer, sponsored zones, and more.
              </p>
              <div style={{ borderTop: '1px solid var(--ui-line)', paddingTop: 20, marginTop: 'auto' }}>
                <div className="ui-v or">$29.99<span style={{ fontSize: 14, color: 'var(--ui-muted)', fontWeight: 500 }}>/mo</span></div>
                <div className="ui-note">All Pro escort features</div>
                <button
                  className="ui-btn block"
                  style={{ marginTop: 12 }}
                  disabled={loading === 'price_1TF021LmfugPCRbA7CGgLhC0'}
                  onClick={() => checkout('price_1TF021LmfugPCRbA7CGgLhC0')}
                >
                  {loading === 'price_1TF021LmfugPCRbA7CGgLhC0' ? 'Redirecting...' : 'Get Escort Pro – $29.99/mo'}
                </button>
              </div>
            </div>

            <div className="ui-card" style={{ display: 'flex', flexDirection: 'column' }}>
              <h2 style={{ color: 'var(--ui-or)' }}>Fleet Manager</h2>
              <p className="ui-note" style={{ marginBottom: 20 }}>
                Manage an entire fleet of escorts under one account. Zones, jobs, dashboards, and multi-escort coordination.
              </p>
              <div style={{ borderTop: '1px solid var(--ui-line)', paddingTop: 20, marginTop: 'auto' }}>
                <div className="ui-v or">$99.99<span style={{ fontSize: 14, color: 'var(--ui-muted)', fontWeight: 500 }}>/mo</span></div>
                <div className="ui-note">Full fleet dashboard, all Pro features for all escorts</div>
                <button
                  className="ui-btn block"
                  style={{ marginTop: 12 }}
                  disabled={loading === FLEET_PRO_PRICE_ID}
                  onClick={() => checkout(FLEET_PRO_PRICE_ID)}
                >
                  {loading === FLEET_PRO_PRICE_ID ? 'Redirecting...' : 'Get Fleet Manager – $99.99/mo'}
                </button>
              </div>
            </div>

          </div>
        )}

        {fleetOnly && (
          <>
            <div className="ui-fit" style={{ marginBottom: 28 }}>
              {fleetTiers.map((tier) => (
                <div
                  key={tier.name}
                  className={tier.popular ? 'ui-card warn' : 'ui-card'}
                  style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}
                >
                  {tier.popular && (
                    <div className="ui-badge orange" style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)' }}>
                      Most Popular
                    </div>
                  )}

                  <h2 style={{ color: 'var(--ui-or)' }}>{tier.name}</h2>

                  <div className="ui-badge orange" style={{ marginBottom: 16, alignSelf: 'flex-start' }}>
                    {tier.escorts}
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <span className="ui-v">{tier.price}</span>
                    <span className="ui-note" style={{ marginLeft: 6 }}>{tier.sub}</span>
                  </div>

                  <div style={{ borderTop: '1px solid var(--ui-line)', paddingTop: 16, marginBottom: 20 }}>
                    {fleetFeatures.map((f) => (
                      <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                        <span style={{ color: 'var(--ui-or)', fontSize: 14, marginTop: 1, flexShrink: 0 }}>✓</span>
                        <span className="ui-note">{f}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    className={tier.popular ? 'ui-btn block' : 'ui-btn ghost block'}
                    style={{ marginTop: 'auto' }}
                    disabled={loading === tier.priceId}
                    onClick={() => checkout(tier.priceId)}
                  >
                    {loading === tier.priceId ? 'Redirecting...' : `Get ${tier.name} – ${tier.price}/mo`}
                  </button>
                </div>
              ))}
            </div>

            <p className="ui-note" style={{ textAlign: 'center' }}>
              All Fleet plans include every Member &amp; Pro escort feature. Only escort slot count differs.
            </p>
          </>
        )}

        <p className="ui-note" style={{ textAlign: 'center', marginTop: 40 }}>
          Already have an account?{' '}
          <a href="/signin" className="ui-link">Sign in here</a>
        </p>
      </div>
    </div>
  );
}

export default function JoinPage() {
  return (
    <WebOnly>
      <Suspense fallback={null}>
        <JoinPageInner />
      </Suspense>
    </WebOnly>
  );
}
