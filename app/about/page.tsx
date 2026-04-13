'use client'
export default function AboutPage() {
  return (
    <main style={{ background: '#0a0a0a', color: '#fff', minHeight: '100vh', fontFamily: 'monospace' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '60px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <img src="/logo.png" alt="OEH" style={{ width: 200, marginBottom: 20 }} />
          <h1 style={{ fontSize: 36, fontWeight: 900, letterSpacing: '.05em', margin: '0 0 16px', color: '#fff' }}>
            Built by the Industry.<br />For the Industry.
          </h1>
          <p style={{ fontSize: 14, color: '#888', maxWidth: 560, margin: '0 auto', lineHeight: 1.8 }}>
            Oversize Escort Hub exists to eliminate the chaos of finding verified escorts — and to give escorts the tools to run a real business.
          </p>
        </div>
        <div style={{ background: '#111', border: '1px solid #222', borderLeft: '4px solid #ff6600', borderRadius: 10, padding: 32, marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, color: '#ff6600' }}>Why OEH Exists</h2>
          <p style={{ fontSize: 14, color: '#ccc', lineHeight: 1.9, margin: '0 0 16px' }}>
            Brian Ahmed spent years in law enforcement, then transitioned to trucking before becoming a licensed P/EVO operator. After experiencing firsthand the frustration of last-minute escort scrambles, unverified drivers, and zero transparency in the industry, he built the platform he always wished existed.
          </p>
          <p style={{ fontSize: 14, color: '#ccc', lineHeight: 1.9, margin: 0 }}>
            OEH is not a dispatch service. It&apos;s not a middleman. It&apos;s a verified marketplace — where carriers find credentialed escorts and escorts find consistent work. No commissions. No job fees. Ever.
          </p>
        </div>
        <div style={{ background: '#111', border: '1px solid #222', borderRadius: 10, padding: 32, marginBottom: 32, textAlign: 'center' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Mission</h2>
          <p style={{ fontSize: 16, color: '#ff6600', fontWeight: 600, lineHeight: 1.7, margin: 0 }}>
            &quot;OEH exists to eliminate the chaos of finding verified escorts — and to give escorts the tools to run a real business.&quot;
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
          {[
            { stat: '$870M', label: 'US Oversize Escort Market' },
            { stat: '50,000+', label: 'Licensed P/EVO Operators' },
            { stat: '0', label: 'Verified Marketplaces Before OEH' },
          ].map(s => (
            <div key={s.stat} style={{ background: '#111', border: '1px solid #222', borderRadius: 10, padding: 24, textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#ff6600', marginBottom: 6 }}>{s.stat}</div>
              <div style={{ fontSize: 12, color: '#888' }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ background: '#111', border: '1px solid #222', borderRadius: 10, padding: 32, marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Team</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#ff6600', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 900, flexShrink: 0 }}>BA</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Brian Ahmed</div>
              <div style={{ fontSize: 12, color: '#ff6600', marginBottom: 6 }}>Founder & CEO</div>
              <div style={{ fontSize: 12, color: '#888', lineHeight: 1.6 }}>Former law enforcement · Truck driver · Licensed P/EVO operator · Builder</div>
            </div>
          </div>
        </div>
        <div style={{ background: '#111', border: '1px solid #222', borderRadius: 10, padding: 32, textAlign: 'center' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Contact</h2>
          <p style={{ color: '#888', fontSize: 13, marginBottom: 16 }}>Questions, partnerships, or feedback:</p>
          <a href="mailto:support@oversize-escort-hub.com" style={{ color: '#ff6600', fontSize: 14, fontWeight: 600 }}>
            support@oversize-escort-hub.com
          </a>
        </div>
      </div>
    </main>
  );
}
