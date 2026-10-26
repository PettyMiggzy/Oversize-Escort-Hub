import type { Metadata } from 'next'
import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'
import PageTitle from '@/components/PageTitle'
import { GUIDE_CHECKED, GUIDE_FAQ, GUIDE_SECTIONS, SOURCES } from '@/lib/guide-content'

const URL = 'https://www.oversize-escort-hub.com/pilot-car-guide'

export const metadata: Metadata = {
  title: { absolute: 'New to pilot car work? A plain-words guide for P/EVO drivers | Oversize Escort Hub' },
  description: 'What pilot car (P/EVO) drivers do, who needs certification, what gear to carry, how to stay safe, and where to check each state\'s rules, with links to the public sources.',
  alternates: { canonical: '/pilot-car-guide' },
}

export default function PilotCarGuide() {
  const used = [...new Set(GUIDE_SECTIONS.flatMap((s) => s.sources))].map((id) => SOURCES[id])
  const ld = [
    {
      '@context': 'https://schema.org', '@type': 'Article',
      headline: 'New to pilot car work? A plain-words guide for P/EVO drivers',
      dateModified: GUIDE_CHECKED, datePublished: GUIDE_CHECKED, mainEntityOfPage: URL,
      author: { '@type': 'Organization', name: 'Oversize Escort Hub' }, publisher: { '@type': 'Organization', name: 'Oversize Escort Hub' },
      citation: used.map((s) => s.url),
    },
    {
      '@context': 'https://schema.org', '@type': 'FAQPage',
      mainEntity: GUIDE_FAQ.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
  ]
  return (
    <div className="ui-page">
      <SiteHeader />
      <div className="ui-wrap guide" style={{ maxWidth: 860 }}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
        <PageTitle eyebrow="Start here" title="New to pilot car work?" lead="A plain-words summary of what the public sources say, with a link for every claim." />

        <div className="ui-card" style={{ marginBottom: 16 }}>
          <p style={{ margin: 0, lineHeight: 1.6 }}>
            <strong>Read this first.</strong> Pilot car rules are set by each state and they change. This page is a starting point, not legal advice, and it is not a substitute for the state permit office. Our sources are mostly from 2016, so check the state before you drive in it. Last checked {new Date(GUIDE_CHECKED + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.
          </p>
        </div>

        <nav className="ui-card" aria-label="On this page" style={{ marginBottom: 16 }}>
          <div className="ui-k" style={{ marginBottom: 8 }}>On this page</div>
          <ol style={{ margin: 0, paddingLeft: 20, lineHeight: 1.9 }}>
            {GUIDE_SECTIONS.map((s) => <li key={s.id}><a href={`#${s.id}`}>{s.title}</a></li>)}
            <li><a href="#faq">Quick answers</a></li>
            <li><a href="#sources">Sources</a></li>
          </ol>
        </nav>

        {GUIDE_SECTIONS.map((s) => (
          <section key={s.id} id={s.id} className="ui-card" style={{ marginBottom: 16, scrollMarginTop: 80 }}>
            <h2 style={{ margin: '0 0 10px', fontSize: 22 }}>{s.title}</h2>
            {s.body.map((p, i) => <p key={i} style={{ margin: '0 0 12px', lineHeight: 1.65 }}>{p}</p>)}
            {s.bullets && <ul style={{ margin: '0 0 12px', paddingLeft: 20, lineHeight: 1.65 }}>{s.bullets.map((b, i) => <li key={i} style={{ marginBottom: 8 }}>{b}</li>)}</ul>}
            {s.sources.length > 0 && (
              <p style={{ margin: 0, fontSize: 13, color: 'var(--ui-muted, #9aa1ad)' }}>
                Sources: {s.sources.map((id, i) => <span key={id}>{i > 0 && '; '}<a href={SOURCES[id].url} target="_blank" rel="noopener noreferrer">{SOURCES[id].short}</a></span>)}
              </p>
            )}
            {s.id === 'finding-work' && (
              <p style={{ margin: '14px 0 0', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Link className="ui-btn" href="/signin?mode=signup&role=escort">Join as an escort</Link>
                <Link className="ui-btn ghost" href="/how-it-works">How it works</Link>
              </p>
            )}
          </section>
        ))}

        <section id="faq" className="ui-card" style={{ marginBottom: 16, scrollMarginTop: 80 }}>
          <h2 style={{ margin: '0 0 10px', fontSize: 22 }}>Quick answers</h2>
          {GUIDE_FAQ.map((f) => (
            <div key={f.q} style={{ marginBottom: 14 }}>
              <h3 style={{ margin: '0 0 4px', fontSize: 16 }}>{f.q}</h3>
              <p style={{ margin: 0, lineHeight: 1.6 }}>{f.a}</p>
            </div>
          ))}
        </section>

        <section id="sources" className="ui-card" style={{ marginBottom: 32, scrollMarginTop: 80 }}>
          <h2 style={{ margin: '0 0 10px', fontSize: 22 }}>Sources</h2>
          <p style={{ margin: '0 0 10px', fontSize: 14, lineHeight: 1.6 }}>Everything above is our own summary of these pages. Read the originals for the full detail. Evergreen Safety Council is a training company, not a government agency.</p>
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.7 }}>
            {used.map((s) => <li key={s.id}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a>, {s.publisher}</li>)}
          </ul>
        </section>
      </div>
    </div>
  )
}
