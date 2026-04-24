import { createClient } from '@/lib/supabase/server'

export const metadata = {
  title: 'How to Become a Pilot Car / P/EVO Escort | OEH',
  description: 'Everything you need to know to start your career in oversize load escort — certifications, equipment, rates, and more.',
}

export default async function GettingStartedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let isPaid = false
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('tier')
      .eq('id', user.id)
      .single()
    const paidTiers = ['member', 'pro', 'fleet_starter', 'fleet_plus', 'fleet_pro']
    isPaid = !!(profile?.tier && paidTiers.includes(profile.tier))
  }

  const certs = [
    {
      name: 'P/EVO Certification',
      color: '#f0a500',
      icon: '🚗',
      desc: 'Required in most states. Washington State cert through Evergreen Safety Council. The foundational credential for oversize escort work.',
      link: 'https://www.esc.org/courses',
    },
    {
      name: 'WITPAC',
      color: '#4ade80',
      icon: '🗺️',
      desc: 'Western Interstate Traffic Patrol Association Certification. Required for multi-state runs across WA, OR, ID, and MT corridors.',
      link: 'https://www.esc.org/courses',
    },
    {
      name: 'Flagger Certification',
      color: '#60a5fa',
      icon: '🚩',
      desc: 'WA, Idaho, Federal online options available. Valid for 3 years. Accepted in WA, OR, ID, and MT. Required for many oversize moves.',
      link: 'https://www.esc.org/courses',
    },
    {
      name: 'Traffic Control Supervisor',
      color: '#c084fc',
      icon: '🎖️',
      desc: 'TCS certification available through WA, Oregon, and Idaho state programs. Required when directing other flaggers on site.',
      link: 'https://www.esc.org/courses',
    },
  ]

  const equipment = [
    { item: 'Amber rotating or LED light bar', note: 'Roof-mounted, visible from all sides' },
    { item: '"OVERSIZE LOAD" sign', note: 'Front and rear — dimensions per state' },
    { item: 'Red/orange flags', note: 'Corner-mounted on sign boards' },
    { item: 'CB Radio', note: 'Channel 17 highway standard' },
    { item: 'Height pole', note: 'Required for loads over 14\'6" in most states' },
    { item: 'Two-way communication', note: 'Direct contact with pilot lead / rear' },
  ]

  const rates = [
    { label: 'Long Haul (250+ mi)', rate: '$2.00/mile', note: 'Per-vehicle, loaded direction' },
    { label: 'Short Haul (under 250 mi)', rate: '$500/day', note: 'Day rate — typically 8–10 hrs' },
    { label: 'Overnight / Layover', rate: '$100/night', note: 'When load stops mid-route' },
    { label: 'No-Go Fee', rate: '$250', note: 'Load cancelled after you mobilize' },
  ]

  const faqs = [
    { q: 'How long is a Flagger certification valid?', a: '3 years from the date of issue.' },
    { q: 'Can I use my WA Flagger card in other states?', a: 'Yes — WA Flagger cards are accepted in WA, OR, ID, and MT.' },
    { q: 'Is the WA Flagger class available online?', a: 'No. WA State law requires in-person instruction for Flagger certification.' },
    { q: 'Do I need a Driver\'s License to become a Flagger?', a: 'No. Any government-issued ID is accepted for Flagger certification.' },
    { q: 'Do I need a CDL to escort loads?', a: 'No. A standard driver\'s license is sufficient for escort vehicles.' },
    { q: 'What states require P/EVO certification?', a: 'Most western states require a state-recognized P/EVO cert. WA, OR, ID, MT, and others have specific requirements. Check your state DOT.' },
  ]

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid #222', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <a href="/" style={{ color: '#f0a500', fontWeight: 700, fontSize: 18, textDecoration: 'none' }}>OEH</a>
        <span style={{ color: '#444' }}>/</span>
        <span style={{ color: '#888', fontSize: 14 }}>Getting Started</span>
        <div style={{ marginLeft: 'auto' }}>
          {user ? (
            <a href="/dashboard" style={{ color: '#f0a500', fontSize: 13, textDecoration: 'none' }}>Dashboard →</a>
          ) : (
            <a href="/signin" style={{ background: '#f0a500', color: '#000', padding: '8px 16px', borderRadius: 6, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>Sign In</a>
          )}
        </div>
      </div>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(180deg, #111 0%, #0a0a0a 100%)', borderBottom: '1px solid #1a1a1a', padding: '64px 24px 48px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#f0a500', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 16 }}>
            Career Guide
          </div>
          <h1 style={{ fontSize: 40, fontWeight: 800, marginBottom: 16, lineHeight: 1.2 }}>
            How to Become a Pilot Car /<br />P/EVO Escort
          </h1>
          <p style={{ color: '#888', fontSize: 16, lineHeight: 1.7, marginBottom: 32, maxWidth: 600, margin: '0 auto 32px' }}>
            Everything you need to know to start your career in oversize load escort — certifications, equipment, standard rates, and where to find your first load.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/join" style={{ background: '#f0a500', color: '#000', fontWeight: 700, fontSize: 14, padding: '12px 28px', borderRadius: 8, textDecoration: 'none' }}>
              Join OEH — Find Loads
            </a>
            <a href="#certifications" style={{ background: 'transparent', color: '#fff', fontWeight: 700, fontSize: 14, padding: '12px 28px', borderRadius: 8, textDecoration: 'none', border: '1px solid #333' }}>
              View Certifications ↓
            </a>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px' }}>

        {/* What is a P/EVO */}
        <div style={{ marginBottom: 56 }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 16, borderBottom: '1px solid #222', paddingBottom: 12 }}>
            What Is a P/EVO Escort?
          </h2>
          <p style={{ color: '#aaa', fontSize: 15, lineHeight: 1.8 }}>
            Pilot car operators (also called Pilot/Escort Vehicle Operators, or P/EVOs) guide oversize loads safely through traffic.
            They drive ahead of or behind loads that exceed legal road dimensions — wide loads, tall structures, heavy equipment, manufactured homes, and more.
            Escorts are essential for any move that needs flagging, route scouting, or height clearance verification.
          </p>
          <p style={{ color: '#aaa', fontSize: 15, lineHeight: 1.8, marginTop: 12 }}>
            It's a career you can start with just a vehicle, proper certification, and the right equipment.
            Most escorts work independently, setting their own schedules and routes.
            OEH connects certified escorts with carriers who need them — no middlemen, no commissions.
          </p>
        </div>

        {/* Certifications */}
        <div id="certifications" style={{ marginBottom: 56 }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, borderBottom: '1px solid #222', paddingBottom: 12 }}>
            What Certifications Do You Need?
          </h2>
          <p style={{ color: '#888', fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>
            Requirements vary by state and load type. These are the core certifications for escorts in the western US.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 20 }}>
            {certs.map(cert => (
              <div key={cert.name} style={{ background: '#111', border: '1px solid #222', borderLeft: `3px solid ${cert.color}`, borderRadius: 12, padding: 24 }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>{cert.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8, color: '#fff' }}>{cert.name}</div>
                <p style={{ color: '#aaa', fontSize: 13, lineHeight: 1.7, marginBottom: 16 }}>{cert.desc}</p>
                <a href={cert.link} target="_blank" rel="noopener noreferrer" style={{ color: cert.color, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                  View at ESC →
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Evergreen Partner Card */}
        <div style={{ background: '#111', border: '1px solid #222', borderLeft: '3px solid #4ade80', borderRadius: 12, padding: 32, marginBottom: 56 }}>
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 260 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#4ade80', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8 }}>
                Official ESC Member
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>Training Partner: Evergreen Safety Council</h2>
              <p style={{ color: '#aaa', fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>
                OEH is an official Evergreen Safety Council member (INV14545).
                ESC offers P/EVO, WITPAC, Flagger, TCS, and more — all the certs you need to work in the western US.
              </p>
              <a
                href="https://www.esc.org/courses"
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-block', background: '#4ade80', color: '#000', fontWeight: 700, fontSize: 13, padding: '10px 20px', borderRadius: 6, textDecoration: 'none' }}
              >
                Browse ESC Courses →
              </a>
            </div>

            {/* Promo code — gated */}
            <div style={{ minWidth: 200 }}>
              {isPaid ? (
                <div style={{ background: '#0a0a0a', border: '1px solid #333', borderRadius: 10, padding: 20, textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: '#888', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Your Member Discount</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#f0a500', letterSpacing: '0.05em', marginBottom: 4 }}>OSEH2026</div>
                  <div style={{ fontSize: 12, color: '#4ade80', marginBottom: 4 }}>Save 5% on all courses</div>
                  <div style={{ fontSize: 11, color: '#555' }}>Valid through Apr 30, 2027</div>
                </div>
              ) : (
                <div style={{ background: '#0a0a0a', border: '1px solid #333', borderRadius: 10, padding: 20, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ filter: 'blur(6px)', userSelect: 'none', pointerEvents: 'none' }}>
                    <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>Member Discount Code</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#f0a500' }}>XXXXXXXX</div>
                    <div style={{ fontSize: 12, color: '#4ade80' }}>Save 5% on all courses</div>
                  </div>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(10,10,10,0.8)' }}>
                    <div style={{ fontSize: 16, marginBottom: 6 }}>🔒</div>
                    <div style={{ fontSize: 12, color: '#888', marginBottom: 10, textAlign: 'center' }}>Upgrade to Member to unlock</div>
                    <a href="/pricing" style={{ background: '#f0a500', color: '#000', fontWeight: 700, fontSize: 11, padding: '8px 14px', borderRadius: 5, textDecoration: 'none' }}>
                      Upgrade →
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Equipment */}
        <div style={{ marginBottom: 56 }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, borderBottom: '1px solid #222', paddingBottom: 12 }}>
            Equipment You'll Need
          </h2>
          <p style={{ color: '#888', fontSize: 14, marginBottom: 24 }}>Standard escort vehicle requirements in most western states:</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {equipment.map(e => (
              <div key={e.item} style={{ background: '#111', border: '1px solid #222', borderRadius: 8, padding: 16, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ color: '#f0a500', fontSize: 16, marginTop: 2 }}>✓</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{e.item}</div>
                  <div style={{ color: '#666', fontSize: 12, marginTop: 2 }}>{e.note}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Standard Rates */}
        <div style={{ marginBottom: 56 }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, borderBottom: '1px solid #222', paddingBottom: 12 }}>
            Industry Standard Rates
          </h2>
          <p style={{ color: '#888', fontSize: 14, marginBottom: 24 }}>OEH published standard rates for escort services:</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            {rates.map(r => (
              <div key={r.label} style={{ background: '#111', border: '1px solid #222', borderRadius: 12, padding: 24 }}>
                <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>{r.label}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#f0a500', marginBottom: 6 }}>{r.rate}</div>
                <div style={{ color: '#666', fontSize: 12 }}>{r.note}</div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div style={{ marginBottom: 56 }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24, borderBottom: '1px solid #222', paddingBottom: 12 }}>
            Frequently Asked Questions
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {faqs.map(faq => (
              <div key={faq.q} style={{ background: '#111', border: '1px solid #222', borderRadius: 10, padding: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, color: '#fff' }}>{faq.q}</div>
                <div style={{ color: '#aaa', fontSize: 14, lineHeight: 1.6 }}>{faq.a}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Cert Verification */}
        <div style={{ background: '#111', border: '1px solid #222', borderLeft: '3px solid #4ade80', borderRadius: 12, padding: 24, marginBottom: 48 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Verify an Escort Certification</h3>
          <p style={{ color: '#888', fontSize: 13, marginBottom: 12 }}>
            Need to verify a P/EVO, WITPAC, or Flagger cert? Use the official ESC lookup tool.
          </p>
          <a href="https://www.esc.org/resources/certification-verification" target="_blank" rel="noopener noreferrer"
            style={{ color: '#4ade80', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
            esc.org/resources/certification-verification →
          </a>
        </div>

        {/* CTA */}
        <div style={{ background: 'linear-gradient(135deg, #111 0%, #1a1200 100%)', border: '1px solid #333', borderRadius: 16, padding: 40, textAlign: 'center' }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 12 }}>Ready to Get Started?</h2>
          <p style={{ color: '#888', fontSize: 15, marginBottom: 28, lineHeight: 1.6 }}>
            Join OEH and access the load board, bid on jobs, and connect with carriers across the western US.
            No commissions. No middlemen. Just loads.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/join" style={{ background: '#f0a500', color: '#000', fontWeight: 700, fontSize: 15, padding: '14px 32px', borderRadius: 8, textDecoration: 'none' }}>
              Join OEH — Start Free
            </a>
            <a href="/pricing" style={{ background: 'transparent', color: '#fff', fontWeight: 700, fontSize: 15, padding: '14px 32px', borderRadius: 8, textDecoration: 'none', border: '1px solid #333' }}>
              View Pricing
            </a>
          </div>
        </div>

      </div>
    </div>
  )
}
