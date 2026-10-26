import type { Metadata } from 'next'

const SITE = 'https://www.oversize-escort-hub.com'

export const metadata: Metadata = {
  title: 'Precision Pilot Services, LLC',
  description: 'Precision Pilot Services, LLC operates Oversize Escort Hub, a free online board for oversize load carriers and pilot car escorts.',
  alternates: { canonical: 'https://precisionpilotservices.com' },
}

export default function CompanyPage() {
  const gold = '#f90'
  const link = { color: gold, textDecoration: 'none' }
  return (
    <div style={{ minHeight: '100vh', background: '#0a0f1a', color: '#fff', display: 'flex', flexDirection: 'column' }}>
      <main style={{ flex: 1, maxWidth: 720, width: '100%', margin: '0 auto', padding: '72px 24px 40px', lineHeight: 1.7 }}>
        <div style={{ fontSize: 11, letterSpacing: '.2em', color: gold, marginBottom: 12 }}>PRECISION PILOT SERVICES, LLC</div>
        <h1 style={{ fontSize: 34, margin: '0 0 16px', fontWeight: 700 }}>We run Oversize Escort Hub</h1>
        <p style={{ color: '#cbd5e1', fontSize: 17, marginBottom: 28 }}>
          Oversize Escort Hub is a free online board that connects oversize load carriers and brokers with pilot car (P/EVO) escorts.
          Carriers post loads, escorts post when and where they are available, and both sides bid and accept directly.
          It is free to sign up, post, bid and accept.
        </p>
        <a href={SITE} style={{ display: 'inline-block', background: gold, color: '#000', fontWeight: 700, padding: '14px 28px', borderRadius: 10, textDecoration: 'none', fontSize: 16 }}>
          Go to Oversize Escort Hub
        </a>

        <section style={{ background: '#0f1a2e', border: '1px solid #1e3a5f', borderRadius: 12, padding: '20px 24px', marginTop: 44 }}>
          <h2 style={{ fontSize: 18, margin: '0 0 8px' }}>Good to know</h2>
          <p style={{ color: '#9ca3af', margin: 0, fontSize: 15 }}>
            Oversize Escort Hub does not check or verify users, licenses, insurance or documents. Always confirm them yourself before you hire or accept a job.
          </p>
        </section>

        <section style={{ marginTop: 36, fontSize: 15, color: '#cbd5e1' }}>
          <h2 style={{ fontSize: 18, margin: '0 0 8px', color: '#fff' }}>Contact</h2>
          <p style={{ margin: 0 }}>
            Email: <a href="mailto:support@oversize-escort-hub.com" style={link}>support@oversize-escort-hub.com</a>
          </p>
          <p style={{ margin: '6px 0 0' }}>
            Phone: <a href="tel:+13176252831" style={link}>(317) 625-2831</a>
          </p>
        </section>
      </main>
      <footer style={{ borderTop: '1px solid #1e3a5f', padding: '20px 24px', textAlign: 'center', fontSize: 13, color: '#6b7280' }}>
        <span>&copy; {new Date().getFullYear()} Precision Pilot Services, LLC, doing business as Oversize Escort Hub</span>
        <span style={{ margin: '0 10px' }}>·</span>
        <a href={`${SITE}/terms`} style={link}>Terms</a>
        <span style={{ margin: '0 10px' }}>·</span>
        <a href={`${SITE}/privacy`} style={link}>Privacy</a>
      </footer>
    </div>
  )
}
