'use client';
import { useState } from 'react';

const bgColor = '#060b16';
const surfaceColor = '#0d1117';
const orangeColor = '#f0a500';
const textColor = '#e0e0e0';

const features = [
  { id: 1, name: 'Load Board', who: 'All', tier: 'Free', desc: 'Browse and claim oversize escort loads' },
  { id: 2, name: 'Bid Board', who: 'P/EVO', tier: 'Free/Pro', desc: 'Bid on loads — Pro gets 5-min early access' },
  { id: 3, name: 'Post a Load', who: 'Carrier', tier: 'Free', desc: 'Post loads in under 2 minutes' },
  { id: 4, name: 'Pro Auto-Match SMS', who: 'P/EVO', tier: 'Pro', desc: 'Get texted instantly when matching load posts' },
  { id: 5, name: 'BGC Badge', who: 'P/EVO', tier: '$9.99', desc: 'Verified background check badge on profile' },
  { id: 6, name: 'Availability Zones', who: 'P/EVO', tier: 'Member+', desc: 'Set states you cover for auto-matching' },
  { id: 7, name: 'Escort Profiles', who: 'All', tier: 'Free', desc: 'View escort certs, ratings, BGC badge, availability' },
  { id: 8, name: 'Carrier Hub', who: 'Carrier', tier: 'Free', desc: 'Manage active loads, matches, post history' },
  { id: 9, name: 'Fleet Dashboard', who: 'Fleet', tier: 'Fleet Pro', desc: 'Manage escorts, zones, jobs under one account' },
  { id: 10, name: 'Sponsored Zone', who: 'P/EVO', tier: '$29.99/mo', desc: 'Featured placement on Find Escorts page' },
  { id: 11, name: 'Veteran Discount', who: 'P/EVO', tier: 'Coming Soon', desc: '30% off with DD-214 verification' },
  { id: 12, name: 'Deadhead Minimizer', who: 'P/EVO', tier: 'Coming Soon Pro', desc: 'Find loads near your return route' },
  { id: 13, name: 'Referral Rewards', who: 'All', tier: 'Coming Soon', desc: 'Refer users and earn rewards' },
  { id: 14, name: 'Permit Cost Calculator', who: 'Carrier', tier: 'Coming Soon', desc: 'Estimate permit costs by state' },
  { id: 15, name: 'Map Feature', who: 'All', tier: 'Coming Soon', desc: 'Visual load and escort mapping' },
];

export default function Features() {
  const [search, setSearch] = useState('');
  const [selectedFeature, setSelectedFeature] = useState<(typeof features)[0] | null>(null);

  const filtered = features.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.who.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ background: bgColor, color: textColor, minHeight: '100vh', padding: '40px 20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '20px', color: orangeColor }}>
          Features
        </h1>

        <input
          type="text"
          placeholder="Search features..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            marginBottom: '32px',
            background: surfaceColor,
            border: `1px solid ${orangeColor}`,
            borderRadius: '8px',
            color: textColor,
            fontSize: '16px',
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

        {selectedFeature && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
            onClick={() => setSelectedFeature(null)}
          >
            <div
              style={{
                background: surfaceColor,
                padding: '32px',
                borderRadius: '12px',
                borderLeft: `4px solid ${orangeColor}`,
                maxWidth: '500px',
                width: '90%',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ margin: '0 0 16px', color: orangeColor }}>{selectedFeature.name}</h2>
              <p style={{ margin: '0 0 12px', fontSize: '14px' }}><strong>For:</strong> {selectedFeature.who}</p>
              <p style={{ margin: '0 0 12px', fontSize: '14px' }}><strong>Tier:</strong> {selectedFeature.tier}</p>
              <p style={{ margin: '0 0 24px', fontSize: '16px', lineHeight: '1.6' }}>{selectedFeature.desc}</p>
              <button
                onClick={() => setSelectedFeature(null)}
                style={{
                  background: orangeColor,
                  color: bgColor,
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 600,
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
