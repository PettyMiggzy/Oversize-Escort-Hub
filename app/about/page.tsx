import type { Metadata } from 'next'
import SiteHeader from '@/components/SiteHeader'

export const metadata: Metadata = {
  title: 'About',
  description: 'Founded by Brian Ahmed, OEH connects oversize carriers with licensed, verified P/EVO escorts across the US.',
  openGraph: {
    title: 'About | Oversize Escort Hub',
    description: 'Founded by Brian Ahmed, OEH connects oversize carriers with licensed, verified P/EVO escorts.',
    url: 'https://www.oversize-escort-hub.com/about',
    siteName: 'Oversize Escort Hub',
  },
}

export default function AboutPage() {
  const bg = '#0a0f1a'
  const card = { background: '#0f1a2e', border: '1px solid #1e3a5f', borderRadius: 12, padding: '24px 28px', marginBottom: 20 }

  return (
    <div style={{ minHeight: '100vh', background: bg, color: '#fff' }}>
      <SiteHeader />
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '60px 24px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>About Oversize Escort Hub</h1>
        <p style={{ color: '#9ca3af', fontSize: 15, marginBottom: 40, lineHeight: 1.6 }}>
          Building the future of oversize transport logistics.
        </p>

        <div style={card}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f60', marginBottom: 16 }}>Our Story</h2>
          <p style={{ color: '#cbd5e1', fontSize: 14, lineHeight: 1.8, marginBottom: 12 }}>
            Oversize Escort Hub was founded by Brian Ahmed — a former law enforcement officer turned semi driver and licensed P/EVO escort. After years on both sides of the oversize transport industry, Brian identified a critical gap: escorts and carriers had no reliable, verified marketplace to connect.
          </p>
          <p style={{ color: '#cbd5e1', fontSize: 14, lineHeight: 1.8 }}>
            Too many escorts were finding loads through informal channels, and too many carriers were hiring unverified pilots without proper credentials. Brian built OEH to solve this — a platform where trust, verification, and reliability come first.
          </p>
        </div>

        <div style={card}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f60', marginBottom: 16 }}>Our Mission</h2>
          <p style={{ color: '#cbd5e1', fontSize: 14, lineHeight: 1.8 }}>
            To connect oversize carriers with licensed, verified P/EVO escorts — making every haul safer, more professional, and more efficient. We believe that when the right people are matched with the right loads, the entire industry improves.
          </p>
        </div>

        <div style={card}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f60', marginBottom: 16 }}>Our Values</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            {[
              { icon: '🛡️', name: 'Safety', desc: 'Every escort on OEH is verified before going live.' },
              { icon: '✅', name: 'Verification', desc: 'BGC badges and license checks keep the platform clean.' },
              { icon: '⚡', name: 'Reliability', desc: 'Fast matching, clear communication, no guesswork.' },
            ].map(v => (
              <div key={v.name} style={{ background: '#16213a', borderRadius: 8, padding: '16px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{v.icon}</div>
                <p style={{ fontWeight: 700, marginBottom: 4 }}>{v.name}</p>
                <p style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.5 }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={card}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f60', marginBottom: 20 }}>The Team</h2>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <div style={{ width: 64, height: 64, background: '#1e3a5f', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>👤</div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 16 }}>Brian Ahmed</p>
              <p style={{ color: '#f60', fontSize: 13, marginBottom: 4 }}>Founder & CEO</p>
              <p style={{ color: '#9ca3af', fontSize: 13 }}>Precision Pilot Services LLC · Former Law Enforcement · Licensed P/EVO Escort · CDL Driver</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
