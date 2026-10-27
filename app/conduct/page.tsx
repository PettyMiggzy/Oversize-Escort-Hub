import type { Metadata } from 'next'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'

export const metadata: Metadata = {
  title: 'Code of Conduct',
  description: 'The rules for posting loads, jobs and profiles on Oversize Escort Hub, and how to report a problem.',
  alternates: { canonical: '/conduct' },
}

const RULES: { title: string; body: string }[] = [
  { title: 'Be real and be accurate', body: 'Post only loads, jobs and availability that are real and that you are able to offer. Use your own name or company. Give honest routes, dates, equipment and pay. Fake, duplicate or "just testing" posts are removed.' },
  { title: 'Keep contact details out of public posts', body: 'Phone numbers and email addresses are shared only after a carrier accepts a bid or match. Do not put them in a load, job, profile text or application to get around that.' },
  { title: 'Treat people with respect', body: 'No harassment, threats, hate, discrimination, sexual content or spam. This is a professional marketplace for trucking and pilot car work.' },
  { title: 'Follow the law and the permit', body: 'Each state and province sets its own pilot car, permit and equipment rules. You are responsible for meeting them. Do not post anything illegal or unsafe.' },
  { title: 'We do not check anyone', body: 'Oversize Escort Hub does not check or verify users, licences, certificates, insurance, vehicles or documents. Confirm them yourself before you hire or accept a job, and agree pay and terms directly with the other side.' },
  { title: 'Documents you upload', body: 'Upload only your own papers. You decide whether they show on your public profile. We do not review or endorse them.' },
]

export default function ConductPage() {
  const bg = '#0a0f1a'
  const card = { background: '#0f1a2e', border: '1px solid #1e3a5f', borderRadius: 12, padding: '20px 24px', marginBottom: 16 }
  return (
    <div style={{ minHeight: '100vh', background: bg, color: '#fff' }}>
      <SiteHeader />
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px' }}>
        <div style={{ fontSize: 11, letterSpacing: '.2em', color: '#f90', marginBottom: 8 }}>OVERSIZE ESCORT HUB</div>
        <h1 style={{ fontSize: 32, margin: '0 0 8px', fontWeight: 700 }}>Code of Conduct</h1>
        <p style={{ color: '#9ca3af', fontSize: 15, lineHeight: 1.7, margin: '0 0 28px' }}>
          Plain rules so the board stays useful for carriers, brokers and pilot car drivers. They apply to loads, jobs, profiles, bids, applications and anything else you post.
        </p>
        {RULES.map((r) => (
          <section key={r.title} style={card}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: '#f60', margin: '0 0 8px' }}>{r.title}</h2>
            <p style={{ color: '#cbd5e1', fontSize: 14, lineHeight: 1.8, margin: 0 }}>{r.body}</p>
          </section>
        ))}
        <section style={card}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: '#f60', margin: '0 0 8px' }}>Reporting a problem and what we do</h2>
          <p style={{ color: '#cbd5e1', fontSize: 14, lineHeight: 1.8, margin: '0 0 8px' }}>
            Use the Report button on a load, or email <a href="mailto:support@oversize-escort-hub.com" style={{ color: '#f90' }}>support@oversize-escort-hub.com</a> with a link and what is wrong.
            We read every report. We may remove content, limit features or suspend accounts that break these rules, with or without notice.
          </p>
          <p style={{ color: '#9ca3af', fontSize: 13, lineHeight: 1.7, margin: 0 }}>
            You can delete your own account any time at <a href="/delete-account" style={{ color: '#f90' }}>Delete my account</a>. See also our <a href="/terms" style={{ color: '#f90' }}>Terms</a> and <a href="/privacy" style={{ color: '#f90' }}>Privacy Policy</a>.
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
