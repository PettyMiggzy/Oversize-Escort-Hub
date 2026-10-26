import type { Metadata } from 'next'
import SiteHeader from '@/components/SiteHeader'
import PageTitle from '@/components/PageTitle'

export const metadata: Metadata = { title: 'Not live yet', description: 'What Oversize Escort Hub does not do today, and ideas we may or may not build.' }

const ITEMS: [string, string][] = [
  ['Verification badges', 'A background-check badge and a "certificate reviewed" badge on profiles. Not live. We may never offer them: right now nobody here checks or verifies anyone.'],
  ['Document review', 'Us looking at a certificate or insurance paper and marking it. Not live. Escorts can upload their own papers and show them on their profile, and we do not check them.'],
  ['Vehicle and insurance checks', 'Checking a vehicle or an insurance policy. Not live and not planned.'],
  ['Carrier checks', 'A "verified carrier" tick from FMCSA records. Not live.'],
  ['Text-message alerts', 'Load alerts by text. Waiting on carrier approval.'],
  ['Mini-sites for escorts and companies', 'A page of your own with a few templates. An idea.'],
]

export default function ComingLater() {
  return (
    <div className="ui-page">
      <SiteHeader />
      <div className="ui-wrap" style={{ maxWidth: 760 }}>
        <PageTitle eyebrow="Honest list" title="Not live yet" lead="Things people ask about that we do not do today. Some may never happen." />
        <div className="ui-card" style={{ marginBottom: 16 }}>
          <p style={{ margin: 0, lineHeight: 1.65 }}>
            <strong>What that means for you:</strong> Oversize Escort Hub is a place to find each other. We do not check or vouch for anyone, any document, or any load. Check licenses, insurance and permits yourself before you hire or accept work, the same as you would anywhere else.
          </p>
        </div>
        <div className="ui-stack">
          {ITEMS.map(([t, d]) => (
            <div key={t} className="ui-card">
              <h2 style={{ margin: '0 0 6px', fontSize: 18 }}>{t}</h2>
              <p className="ui-note" style={{ margin: 0 }}>{d}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
