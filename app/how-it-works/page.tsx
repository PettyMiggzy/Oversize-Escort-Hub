'use client';
import { useState } from 'react';
import SiteHeader from '@/components/SiteHeader';
import PageTitle from '@/components/PageTitle';

const TABS = [
  {
    key: 'escort', label: 'Pilot car / P/EVO', color: '#ff6a13', cta: 'Join as an escort', href: '/signin?mode=signup&role=escort',
    steps: [
      ['Create a free account', 'Pick pilot car / P/EVO as your role.'],
      ['Build your profile', 'Add your certifications, the states you cover, your vehicle and any documents you choose to show.'],
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
      ['Review the escort', 'Check their profile, ratings and any documents they chose to show. We do not check them, so confirm licenses and insurance yourself.'],
      ['Accept or decline', 'Accept and you both get contact details. Decline and the load goes back on the board.'],
    ],
  },
  {
    key: 'broker', label: 'Freight broker', color: '#c1c8d4', cta: 'Join as a broker', href: '/signin?mode=signup&role=broker',
    steps: [
      ['Create a free account', 'Pick freight broker as your role.'],
      ['Post loads for your shipments', 'Add each oversize move and the escort positions it needs.'],
      ['Compare escorts', 'See each bidder’s rating and profile before you decide, and confirm licenses and insurance yourself.'],
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
    <div className="ui-page">
      <SiteHeader />
      <div className="ui-wrap" style={{ maxWidth: 860 }}>
        <PageTitle eyebrow="Start here" title="How it works" lead="From sign-up to a confirmed job. Using the site is free while we launch." />
        <p style={{ margin: '-8px 0 18px', fontSize: 15 }}>New to pilot car work? <a href="/pilot-car-guide">Read the beginner's guide</a>.</p>
        <div className="ui-chips" style={{ justifyContent: 'center', marginBottom: 28 }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="ui-chip"
              style={tab === t.key ? { background: t.color, color: '#160800', borderColor: t.color, fontWeight: 700 } : undefined}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="ui-stack">
          {current.steps.map(([title, text], i) => (
            <div key={title} className="ui-card" style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div className="ui-step" style={{ color: current.color }}>{i + 1}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 2, color: '#fff' }}>{title}</div>
                <div style={{ color: 'var(--ui-muted)', fontSize: 15, lineHeight: 1.55 }}>{text}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: 34 }}>
          <a className="ui-btn" href={current.href}>
            {current.cta} &rarr;
          </a>
        </div>
      </div>
    </div>
  );
}
