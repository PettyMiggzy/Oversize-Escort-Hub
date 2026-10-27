import { createClient } from '@/lib/supabase/server'
import { FREE_LAUNCH } from '@/lib/free-launch'
import SiteHeader from '@/components/SiteHeader'
import PageTitle from '@/components/PageTitle'

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
    isPaid = FREE_LAUNCH || !!(profile?.tier && paidTiers.includes(profile.tier))
  }

  const certs = [
    {
      name: 'P/EVO Certification',
      color: 'var(--ui-or)',
      icon: '🚗',
      desc: 'Requirements differ by state, so check with the state you will work in. Washington State cert through Evergreen Safety Council. The foundational credential for oversize escort work.',
      link: 'https://www.esc.org/courses',
    },
    {
      name: 'WITPAC',
      color: 'var(--ui-green)',
      icon: '🗺️',
      desc: 'Western Interstate Traffic Patrol Association Certification. Some western states recognize it. Check each state rules before a multi-state run.',
      link: 'https://www.esc.org/courses',
    },
    {
      name: 'Flagger Certification',
      color: 'var(--ui-blue)',
      icon: '🚩',
      desc: 'WA, Idaho, Federal online options available. Valid for 3 years. Accepted in WA, OR, ID, and MT. Required for many oversize moves.',
      link: 'https://www.esc.org/courses',
    },
    {
      name: 'Traffic Control Supervisor',
      color: 'var(--ui-amber)',
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
    <>
      <SiteHeader />
      <div className="ui-page">
      <div className="ui-wrap">
        <PageTitle
          eyebrow="Career guide"
          title="How to become a pilot car / P/EVO escort"
          lead="Everything you need to know to start your career in oversize load escort — certifications, equipment, standard rates, and where to find your first load."
        />
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
          <a href="/join" className="ui-btn">Join OEH — Find Loads</a>
          <a href="#certifications" className="ui-btn ghost">View Certifications ↓</a>
        </div>
        <div className="ui-stack">

        <div className="ui-card">
          <h2>What Is a P/EVO Escort?</h2>
          <p className="ui-note">
            Pilot car operators (also called Pilot/Escort Vehicle Operators, or P/EVOs) guide oversize loads safely through traffic.
            They drive ahead of or behind loads that exceed legal road dimensions — wide loads, tall structures, heavy equipment, manufactured homes, and more.
            Escorts are essential for any move that needs flagging, route scouting, or height clearance verification.
          </p>
          <p className="ui-note" style={{ marginTop: 12 }}>
            It's a career you can start with just a vehicle, proper certification, and the right equipment.
            Most escorts work independently, setting their own schedules and routes.
            OEH connects pilot car operators with carriers who need them — no middlemen, no commissions.
          </p>
        </div>

        {/* Certifications */}
        <div id="certifications" className="ui-card">
          <h2>What Certifications Do You Need?</h2>
          <p className="ui-note" style={{ marginBottom: 18 }}>
            Requirements vary by state and load type. These are the core certifications for escorts in the western US.
          </p>
          <div className="ui-fit">
            {certs.map(cert => (
              <div key={cert.name} className="ui-card" style={{ boxShadow: 'none', borderColor: cert.color }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>{cert.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{cert.name}</div>
                <p className="ui-note" style={{ marginBottom: 12 }}>{cert.desc}</p>
                <a href={cert.link} target="_blank" rel="noopener noreferrer" style={{ color: cert.color, fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
                  View at ESC →
                </a>
              </div>
            ))}
          </div>
        </div>

        <div className="ui-card good">
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 260px', minWidth: 0 }}>
              <div className="ui-k" style={{ color: 'var(--ui-green)' }}>ESC Member</div>
              <h2>Training: Evergreen Safety Council</h2>
              <p className="ui-note" style={{ marginBottom: 16 }}>
                OEH is a member of the Evergreen Safety Council (INV14545). Evergreen does not endorse OEH.
                ESC offers P/EVO, WITPAC, Flagger, TCS, and more — all the certs you need to work in the western US.
              </p>
              <a href="https://www.esc.org/courses" target="_blank" rel="noopener noreferrer" className="ui-btn" style={{ background: 'var(--ui-green)', boxShadow: 'none' }}>
                Browse ESC Courses →
              </a>
            </div>

            <div style={{ flex: '1 1 220px', minWidth: 0 }}>
              {isPaid ? (
                <div className="ui-card" style={{ textAlign: 'center', boxShadow: 'none' }}>
                  <div className="ui-k">Your Member Discount</div>
                  <div className="ui-v or">OSEH2026</div>
                  <div className="ui-ok" style={{ margin: '4px 0' }}>Save 5% on all courses</div>
                  <div className="ui-meta">Valid through Apr 30, 2027</div>
                </div>
              ) : (
                <div className="ui-card" style={{ textAlign: 'center', position: 'relative', overflow: 'hidden', boxShadow: 'none', minHeight: 140 }}>
                  <div style={{ filter: 'blur(6px)', userSelect: 'none', pointerEvents: 'none' }}>
                    <div className="ui-k">Member Discount Code</div>
                    <div className="ui-v or">XXXXXXXX</div>
                    <div className="ui-ok">Save 5% on all courses</div>
                  </div>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(6,8,10,.8)', padding: 12 }}>
                    <div style={{ fontSize: 16, marginBottom: 6 }}>🔒</div>
                    <div className="ui-note" style={{ marginBottom: 10, textAlign: 'center' }}>Sign in to see the member code</div>
                    <a href="/signin" className="ui-btn">Sign in →</a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="ui-card">
          <h2>Equipment You'll Need</h2>
          <p className="ui-note" style={{ marginBottom: 16 }}>Standard escort vehicle requirements in most western states:</p>
          <div className="ui-fit">
            {equipment.map(e => (
              <div key={e.item} className="ui-card" style={{ padding: 16, boxShadow: 'none', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ color: 'var(--ui-or)', fontSize: 16 }}>✓</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{e.item}</div>
                  <div className="ui-meta" style={{ marginTop: 2 }}>{e.note}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="ui-card">
          <h2>Example Rates</h2>
          <p className="ui-note" style={{ marginBottom: 16 }}>Examples of what some pilot car drivers quote. OEH does not set rates: you and the other side agree on pay directly.</p>
          <div className="ui-fit">
            {rates.map(r => (
              <div key={r.label} className="ui-card" style={{ boxShadow: 'none' }}>
                <div className="ui-k">{r.label}</div>
                <div className="ui-v or">{r.rate}</div>
                <div className="ui-meta">{r.note}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="ui-card">
          <h2>Frequently Asked Questions</h2>
          <div className="ui-stack">
            {faqs.map(faq => (
              <div key={faq.q} className="ui-card" style={{ padding: 16, boxShadow: 'none' }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{faq.q}</div>
                <div className="ui-note">{faq.a}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="ui-card good">
          <h3>Verify an Escort Certification</h3>
          <p className="ui-note" style={{ marginBottom: 12 }}>
            Need to verify a P/EVO, WITPAC, or Flagger cert? Use the official ESC lookup tool.
          </p>
          <a href="https://www.esc.org/resources/certification-verification" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--ui-green)', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
            esc.org/resources/certification-verification →
          </a>
        </div>

        <div className="ui-card" style={{ textAlign: 'center' }}>
          <h2>Ready to Get Started?</h2>
          <p className="ui-note" style={{ margin: '0 auto 18px' }}>
            Join OEH and access the load board, bid on jobs, and connect with carriers across the western US.
            No commissions. No middlemen. Just loads.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/join" className="ui-btn">Join OEH — Start Free</a>
            <a href="/pricing" className="ui-btn ghost">View Pricing</a>
          </div>
        </div>

        </div>
      </div>
      </div>
    </>
  )
}
