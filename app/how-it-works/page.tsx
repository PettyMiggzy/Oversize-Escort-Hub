'use client';
import { useState } from 'react';
import SiteHeader from '@/components/SiteHeader';
import PageHero from '@/components/PageHero';

const TABS = [
  {
    key: 'escort', label: 'Pilot car / P/EVO', color: '#f0a500', cta: 'Join as an escort', href: '/signin?mode=signup&role=escort',
    steps: [
      ['Create a free account', 'Pick pilot car / P/EVO as your role.'],
      ['Build your profile', 'Add your certifications, the states you cover, your vehicle and your verification badges.'],
      ['Browse the boards', 'Flat-rate, open-bid and 5-minute bid boards. Every account sees new loads the moment they post.'],
      ['Claim a load or place a bid', 'Pick a load that matches your certifications. The load is held for you while the carrier decides.'],
      ['Get matched', 'The carrier reviews your profile and accepts. You both get an alert and each other’s contact details.'],
      ['Get home faster', 'The Deadhead Minimizer finds return loads near your drop-off so you do not drive home empty.'],
      ['Leave a review', 'Rate each other after the job. Good reviews win you more work.'],
    ],
  },
  {
    key: 'carrier', label: 'Oversize carrier', color: '#ff6a13', cta: 'Post your first load', href: '/signin?mode=signup&role=carrier',
    steps: [
      ['Create a free account', 'Pick oversize carrier as your role.'],
      ['Post a load in about two minutes', 'Pickup, drop-off, escort type, your rate and any certifications you need.'],
      ['Choose how it posts', 'Flat rate, open bid, or the 5-minute bid board.'],
      ['Get alerts', 'You get an email and an in-app alert when an escort claims or bids on your load.'],
      ['Review the escort', 'Check their profile, certifications, ratings and verification badges.'],
      ['Accept or decline', 'Accept and you both get contact details. Decline and the load goes back on the board.'],
    ],
  },
  {
    key: 'broker', label: 'Freight broker', color: '#c1c8d4', cta: 'Join as a broker', href: '/signin?mode=signup&role=broker',
    steps: [
      ['Create a free account', 'Pick freight broker as your role.'],
      ['Post loads for your shipments', 'Add each oversize move and the escort positions it needs.'],
      ['Compare escorts', 'See each bidder’s certifications, rating and verification badges before you decide.'],
      ['Accept and confirm', 'Accept the escort you want. You both get an alert and contact details.'],
      ['Keep track', 'Follow every job from your dashboard.'],
    ],
  },
  {
    key: 'fleet', label: 'Fleet manager', color: '#4f8cff', cta: 'Set up a fleet', href: '/join?role=fleet',
    steps: [
      ['Create a fleet manager account', 'Free while we launch.'],
      ['Add your escort drivers', 'Put every driver in one place.'],
      ['Set coverage for the whole fleet', 'Choose the states and zones your fleet works.'],
      ['Get alerts for any driver in a zone', 'Know about loads the moment they post.'],
      ['Track the work', 'Jobs, invoices and earnings from the fleet dashboard, with unlimited escorts under one account.'],
    ],
  },
] as const;

export default function HowItWorks() {
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('escort');
  const current = TABS.find((t) => t.key === tab)!;

  return (
    <div style={{ background: '#0a0b0d', color: '#e6e9ef', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <SiteHeader />
      <PageHero image="/photos/band-how.webp" position="50% 62%" title="How it works" lead="From sign-up to a confirmed job. Everything is free while we launch." />
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '36px 20px 70px' }}>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 28, flexWrap: 'wrap' }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: '11px 20px', borderRadius: 999, cursor: 'pointer', fontSize: 14, fontWeight: 700,
                background: tab === t.key ? t.color : '#12141a', color: tab === t.key ? '#120800' : '#c9ced8',
                border: `1px solid ${tab === t.key ? t.color : '#2a2f3c'}`,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          {current.steps.map(([title, text], i) => (
            <div key={title} style={{ display: 'flex', gap: 16, background: '#12141a', border: '1px solid #232733', borderRadius: 14, padding: '18px 20px' }}>
              <div className="bb" style={{ fontSize: 40, lineHeight: 1, color: current.color, minWidth: 34 }}>{i + 1}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 2 }}>{title}</div>
                <div style={{ color: '#9aa3b2', fontSize: 15, lineHeight: 1.55 }}>{text}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: 34 }}>
          <a href={current.href} style={{ display: 'inline-block', background: '#ff6a13', color: '#120800', fontWeight: 800, fontSize: 16, padding: '15px 28px', borderRadius: 10, textDecoration: 'none' }}>
            {current.cta} &rarr;
          </a>
        </div>
      </div>
    </div>
  );
}
