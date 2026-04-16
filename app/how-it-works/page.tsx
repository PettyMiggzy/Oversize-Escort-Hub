'use client';
import { useState } from 'react';
import SiteHeader from '@/components/SiteHeader';


const bgColor = '#060b16';
const surfaceColor = '#0d1117';
const orangeColor = '#f0a500';
const textColor = '#e0e0e0';

export default function HowItWorks() {
  const [activeTab, setActiveTab] = useState('pevo');

  const content = {
    pevo: {
      title: 'P/EVO Escort',
      steps: [
        { num: 1, desc: 'Create free account' },
        { num: 2, desc: 'Complete profile — certs, availability zones, BGC badge' },
        { num: 3, desc: 'Browse board or get Pro SMS alerts' },
        { num: 4, desc: 'Click a load matching your certs' },
        { num: 5, desc: 'Confirm requirements — load held for you' },
        { num: 6, desc: 'Carrier reviews your profile and accepts' },
        { num: 7, desc: 'Both get contact info' },
        { num: 8, desc: 'Leave review after job' },
      ]
    },
    carrier: {
      title: 'Carrier',
      steps: [
        { num: 1, desc: 'Create free account — always free' },
        { num: 2, desc: 'Post load in under 2 min — pickup, destination, escort type, rate' },
        { num: 3, desc: 'Choose flat rate, open bid, or 5-min bid' },
        { num: 4, desc: 'Get notified when escort claims load' },
        { num: 5, desc: 'Review escort profile, certs, ratings, BGC badge' },
        { num: 6, desc: 'Accept or decline — declined loads return to board' },
        { num: 7, desc: 'Both get contact info on acceptance' },
      ]
    },
    fleet: {
      title: 'Fleet Manager',
      steps: [
        { num: 1, desc: 'Sign up Fleet Pro $99.99/mo' },
        { num: 2, desc: 'Add escort drivers to fleet' },
        { num: 3, desc: 'Set availability zones for entire fleet' },
        { num: 4, desc: 'Receive load notifications for any driver in zone' },
        { num: 5, desc: 'Track jobs, invoices, earnings from fleet dashboard' },
        { num: 6, desc: 'Unlimited escorts under one account' },
      ]
    }
  };

  const current = content[activeTab as keyof typeof content];

  return (
    <div style={{ background: bgColor, color: textColor, minHeight: '100vh', padding: '40px 20px' }}>
      <SiteHeader />
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '40px', textAlign: 'center', color: orangeColor }}>
          How It Works
        </h1>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginBottom: '40px', flexWrap: 'wrap' }}>
          {['pevo', 'carrier', 'fleet'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '12px 24px',
                background: activeTab === tab ? orangeColor : surfaceColor,
                color: activeTab === tab ? bgColor : textColor,
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
              }}
            >
              {tab === 'pevo' ? 'P/EVO' : tab === 'carrier' ? 'Carrier' : 'Fleet Manager'}
            </button>
          ))}
        </div>

        <div style={{ background: surfaceColor, borderRadius: '12px', padding: '32px', borderLeft: `4px solid ${orangeColor}` }}>
          <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '24px', color: orangeColor }}>
            {current.title}
          </h2>

          <div style={{ display: 'grid', gap: '20px' }}>
            {current.steps.map((step) => (
              <div key={step.num} style={{ display: 'flex', gap: '16px' }}>
                <div
                  style={{
                    background: orangeColor,
                    color: bgColor,
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '16px',
                    flexShrink: 0,
                  }}
                >
                  {step.num}
                </div>
                <p style={{ margin: 0, fontSize: '16px', lineHeight: '1.6', color: textColor }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
