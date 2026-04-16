'use client';
import { useState } from 'react';
import SiteHeader from '@/components/SiteHeader';

const bgColor = '#060b16';
const surfaceColor = '#0d1117';
const orangeColor = '#f0a500';

const features = [
  { id: 1, name: 'Load Board', who: 'All', tier: 'Free', desc: 'Browse and claim oversize escort loads posted by verified carriers. Filter by state, date, load type, and pay.', access: 'Available after sign-in. Go to Find Escorts or the Load Board in your dashboard.' },
  { id: 2, name: 'Bid Board', who: 'P/EVO', tier: 'Free/Pro', desc: 'Bid on loads posted by carriers. Pro members get 5-min early access before Member-tier escorts see new listings.', access: 'Sign in as P/EVO escort. Member tier sees loads after 5-min delay; Pro sees instantly.' },
  { id: 3, name: 'Post a Load', who: 'Carrier', tier: 'Free', desc: 'Post oversize loads in under 2 minutes. Set pay, route, dates, and requirements. Auto-matched to available escorts.', access: 'Sign in as Carrier/Operator. Post Load button available in your Carrier Hub dashboard.' },
  { id: 4, name: 'Pro Auto-Match SMS', who: 'P/EVO', tier: 'Pro', desc: 'Get texted instantly when a load matching your availability zones is posted. No need to check the board manually.', access: 'Upgrade to Pro ($29.99/mo). Set your availability zones in profile settings to activate.' },
  { id: 5, name: 'BGC Badge', who: 'P/EVO', tier: '$9.99', desc: 'Verified background check badge displayed prominently on your profile. Carriers can filter for BGC-verified escorts only.', access: 'Purchase BGC verification for $9.99 one-time from your profile page. Badge appears within 24-48 hours.' },
  { id: 6, name: 'Availability Zones', who: 'P/EVO', tier: 'Member+', desc: 'Set the states and regions you cover. Used for auto-matching and helps carriers find local escorts faster.', access: 'Available to Member and Pro tiers. Set in Profile > Availability Zones.' },
  { id: 7, name: 'Escort Profiles', who: 'All', tier: 'Free', desc: 'View escort certifications, ratings, BGC badge status, and availability. Carriers use this to evaluate and select escorts.', access: 'Visible to all logged-in users. Update your own profile from the Profile tab in your dashboard.' },
  { id: 8, name: 'Carrier Hub', who: 'Carrier', tier: 'Free', desc: 'Manage active loads, view match history, track escort assignments, and post new loads from one central dashboard.', access: 'Sign in as Carrier/Operator. The Carrier Hub is your default dashboard view.' },
  { id: 9, name: 'Fleet Dashboard', who: 'Fleet', tier: 'Fleet Pro', desc: 'Manage multiple escort operators under one Fleet Manager account. Assign jobs, monitor zones, and view performance.', access: 'Requires Fleet Manager subscription ($99.99/mo). Access from your Fleet Dashboard after subscribing.' },
  { id: 10, name: 'Sponsored Zone', who: 'P/EVO', tier: '$29.99/mo', desc: 'Featured placement on the Find Escorts page for your coverage area. Carriers searching your zone see you first.', access: 'Included with Pro subscription ($29.99/mo). Activate in Profile > Sponsored Zone settings.' },
  { id: 11, name: 'Veteran Discount', who: 'P/EVO', tier: 'Coming Soon', desc: '30% off monthly subscription with DD-214 military verification. Honor veterans in the escort industry.', access: 'Coming soon. Will require DD-214 upload for verification. Check back for launch announcement.' },
  { id: 12, name: 'Deadhead Minimizer', who: 'P/EVO', tier: 'Coming Soon Pro', desc: 'AI-powered tool to find loads near your return route, reducing empty miles and maximizing earnings.', access: 'Coming soon for Pro members. Will integrate with your availability zones and load history.' },
  { id: 13, name: 'Referral Rewards', who: 'All', tier: 'Coming Soon', desc: 'Refer other escorts or carriers to OEH and earn credit toward your subscription or cash rewards.', access: 'Coming soon. A referral link will be provided in your profile once launched.' },
  { id: 14, name: 'Permit Cost Calculator', who: 'Carrier', tier: 'Coming Soon', desc: 'Estimate permit costs by state for oversize loads. Helps carriers budget accurately before posting.', access: 'Coming soon for Carrier accounts. Will be accessible from the Post a Load workflow.' },
  { id: 15, name: 'Map Feature', who: 'All', tier: 'Coming Soon', desc: 'Visual load and escort mapping. See active loads, escort locations, and route overlays on an interactive map.', access: 'Coming soon. Will be integrated into the Load Board and Carrier Hub dashboards.' },
];

type Feature = typeof features[0];

export default function Features() {
  const [search, setSearch] = useState('');
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);

  const filtered = features.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.who.toLowerCase().includes(search.toLowerCase()) ||
    f.tier.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', background: bgColor, color: '#eee' }}>
      <SiteHeader />
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 20px' }}>
        <h1 style={{ textAlign: 'center', fontSize: '32px', fontWeight: 800, color: orangeColor, marginBottom: '8px' }}>
          Platform Features
        </h1>
        <p style={{ textAlign: 'center', color: '#888', marginBottom: '32px' }}>
          Click any feature card to learn more
        </p>

        <input
          type="text"
          placeholder="Search features, roles, or tiers..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            display: 'block',
            margin: '0 auto 32px',
            width: '100%',
            maxWidth: '400px',
            padding: '10px 16px',
            background: surfaceColor,
            border: `1px solid #2a3040`,
            borderRadius: '8px',
            color: '#eee',
            fontSize: '14px',
          }}
        />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {filtered.map((feature) => (
            <div
              key={feature.id}
              onClick={() => setSelectedFeature(feature)}
              style={{
                background: surfaceColor,
                padding: '20px',
                borderRadius: '8px',
                borderLeft: `4px solid ${orangeColor}`,
                cursor: 'pointer',
                transition: 'transform 0.2s',
              }}
              onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-4px)')}
              onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <h3 style={{ margin: '0 0 8px', color: orangeColor, fontSize: '18px' }}>{feature.name}</h3>
              <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#888' }}>
                {feature.who} • {feature.tier}
              </p>
              <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5' }}>{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Modal */}
        {selectedFeature && (
          <div
            onClick={() => setSelectedFeature(null)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.75)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '20px',
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#0d1117',
                padding: '32px',
                borderRadius: '12px',
                borderLeft: `4px solid ${orangeColor}`,
                maxWidth: '520px',
                width: '90%',
                position: 'relative',
              }}
            >
              <button
                onClick={() => setSelectedFeature(null)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'transparent',
                  border: 'none',
                  color: '#888',
                  fontSize: '20px',
                  cursor: 'pointer',
                  lineHeight: 1,
                }}
              >
                ✕
              </button>

              <h2 style={{ margin: '0 0 16px', color: orangeColor, paddingRight: '32px' }}>
                {selectedFeature.name}
              </h2>

              <div style={{ display: 'inline-block', background: '#1e2533', color: orangeColor, padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, marginBottom: '16px' }}>
                {selectedFeature.tier}
              </div>

              <p style={{ margin: '0 0 12px', fontSize: '14px' }}>
                <strong style={{ color: '#ccc' }}>For:</strong>{' '}
                <span style={{ color: '#aaa' }}>{selectedFeature.who}</span>
              </p>

              <p style={{ margin: '0 0 16px', fontSize: '15px', lineHeight: '1.6', color: '#ddd' }}>
                {selectedFeature.desc}
              </p>

              <div style={{ background: '#060b16', borderRadius: '8px', padding: '16px', borderLeft: `2px solid ${orangeColor}` }}>
                <p style={{ margin: 0, fontSize: '13px', color: '#aaa', lineHeight: '1.6' }}>
                  <strong style={{ color: '#ccc', display: 'block', marginBottom: '4px' }}>How to access:</strong>
                  {selectedFeature.access}
                </p>
              </div>

              <button
                onClick={() => setSelectedFeature(null)}
                style={{
                  marginTop: '20px',
                  background: orangeColor,
                  color: bgColor,
                  padding: '10px 24px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '14px',
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
