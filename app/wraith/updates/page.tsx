import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'
import PageTitle from '@/components/PageTitle'
import HideInApp from '@/components/HideInApp'
import { wraithLive } from '@/lib/wraith'

export const metadata: Metadata = {
  title: 'Wraith: updates and what is coming',
  description: 'Wraith is the voice assistant inside Oversize Escort Hub. What it does today, what we plan next, and a dated list of changes.',
  alternates: { canonical: '/wraith/updates' },
}

const LIVE: [string, string][] = [
  ['What is new', 'Pilot car drivers: loads posted in the last 24 hours in your states. Carriers and brokers: new bids today on your own loads.'],
  ['Find loads', 'Search the open loads on the boards. Wraith leaves out loads from people you blocked and your own loads.'],
  ['Your bids and your loads', 'Where your bids stand and what you have posted.'],
  ['Paperwork dates', 'Which documents you uploaded are close to expiring. We do not check your documents; this only reads the dates you entered.'],
  ['Fleet managers', 'Which of your own escorts are free right now, and which are on a job. Names only.'],
  ['Bid by voice, you confirm', 'Say the amount. Wraith puts a button on screen, the bid box on the load page is filled in, and you press the final button. Wraith never bids, claims or posts for you.'],
  ['Type instead', 'Voice listening depends on your browser, so there is always a box to type in.'],
]

const NEXT: [string, string][] = [
  ['Talk to Wraith inside the phone apps', 'Needs an app update and a store review, so it comes after the current apps are approved.'],
  ['A more natural voice', 'We are testing a more natural voice for Wraith. Today it uses your phone or browser voice.'],
  ['More by voice, always with a confirm step', 'Starting a load post by voice. You would still press the final button.'],
  ['A live view of your fleet', 'Seeing where your escorts are. Needs location sharing from each driver, so it is an early idea.'],
  ['A plug-in box for vehicles', 'Reading engine data and warnings by voice. Research stage only, no date, and not promised.'],
]

const LOG: { date: string; title: string; items: string[] }[] = [
  {
    date: 'October 31, 2026',
    title: 'Wraith is live on the website',
    items: [
      'Ask by voice or by typing about new loads, open loads, your bids, your posted loads, document dates and your fleet.',
      'Bid by voice with a confirm button. You always press the final button.',
      'Five free questions a day for everyone. Wraith Pro removes the daily limit, and accounts on a paid plan have it included.',
    ],
  },
]

const ul = { margin: '10px 0 0', paddingLeft: 20, lineHeight: 1.7, color: 'var(--ui-text)' } as const

export default function WraithUpdates() {
  const live = wraithLive()
  return (
    <>
      <SiteHeader />
      <div className="ui-page">
        <div className="ui-wrap" style={{ maxWidth: 820 }}>
          <PageTitle
            eyebrow="Wraith"
            title="Updates and what is coming"
            lead="Wraith is the voice assistant inside Oversize Escort Hub. Ask it about your loads, bids and paperwork. This page says what it does today and what we plan next."
          />

          <div className="ui-card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap', alignItems: 'center' }}>
              <Image src="/wraith-preview.jpg" alt="The Wraith screen on a phone: a glowing orb, a fleet manager signed in, and the answer 'Three of your six escorts are free'. Sample account." width={600} height={1067} style={{ width: 210, height: 'auto', borderRadius: 16, border: '1px solid var(--ui-line)' }} priority />
              <div style={{ flex: '1 1 280px', minWidth: 0 }}>
                <h2 style={{ margin: '0 0 8px', fontSize: 20, color: '#fff' }}>What Wraith is</h2>
                <p className="ui-note" style={{ margin: 0 }}>
                  Tap Talk, ask a question, and Wraith looks it up in your own account and answers out loud and on screen. It is read only. It cannot post, bid, claim or message anyone for you. When you want to act, it shows a button and you press it.
                </p>
                <p className="ui-note" style={{ margin: '10px 0 0' }}>The screen shown is a sample account, not a real person.</p>
                <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                  {live ? (
                    <Link href="/wraith" className="ui-btn">Open Wraith</Link>
                  ) : (
                    <span className="ui-note">Wraith is switched off right now.</span>
                  )}
                  <span className="ui-note">Sign in required. Free to try.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="ui-stack">
            <div className="ui-card">
              <h2 style={{ margin: '0 0 4px', fontSize: 20, color: '#fff' }}>Live now</h2>
              <ul style={ul}>
                {LIVE.map(([t, d]) => (<li key={t}><strong style={{ color: '#fff' }}>{t}.</strong> {d}</li>))}
              </ul>
              <p className="ui-note" style={{ margin: '14px 0 0' }}>
                Everyone gets five free questions a day. Wraith Pro removes the daily limit, and accounts on a paid plan have it included.
              </p>
              <HideInApp>
                <p className="ui-note" style={{ margin: '8px 0 0' }}>
                  Wraith Pro is $9.99 a month, sold on our website only. The price will go up as Wraith learns more. People who join early keep their price.
                </p>
              </HideInApp>
            </div>

            <div className="ui-card">
              <h2 style={{ margin: '0 0 4px', fontSize: 20, color: '#fff' }}>Coming next</h2>
              <p className="ui-note" style={{ margin: '0 0 4px' }}>Plans, not promises. There are no dates, and some of these may change or never ship.</p>
              <ul style={ul}>
                {NEXT.map(([t, d]) => (<li key={t}><strong style={{ color: '#fff' }}>{t}.</strong> {d}</li>))}
              </ul>
              <p className="ui-note" style={{ margin: '14px 0 0' }}>
                Have an idea or a problem? Write to <a href="mailto:support@oversize-escort-hub.com" style={{ color: 'var(--ui-or)' }}>support@oversize-escort-hub.com</a>.
              </p>
            </div>

            <div className="ui-card">
              <h2 style={{ margin: '0 0 4px', fontSize: 20, color: '#fff' }}>Update log</h2>
              {LOG.map((e) => (
                <div key={e.date} style={{ marginTop: 12 }}>
                  <div className="ui-k">{e.date}</div>
                  <div style={{ fontWeight: 700, color: '#fff', marginTop: 2 }}>{e.title}</div>
                  <ul style={ul}>{e.items.map((i) => (<li key={i}>{i}</li>))}</ul>
                </div>
              ))}
            </div>

            <div className="ui-card">
              <h2 style={{ margin: '0 0 4px', fontSize: 20, color: '#fff' }}>Good to know</h2>
              <ul style={ul}>
                <li>Voice listening works best in Chrome and on Android. On iPhone and inside the apps it may not work yet, so type instead.</li>
                <li>Wraith can be wrong or out of date. Check the load page before you act.</li>
                <li>Wraith does not check or verify any person, company, load or document, and it gives no legal, permit or insurance advice. Check licenses, insurance and permits yourself.</li>
                <li>Your question is sent to an outside AI service to write the answer. Wraith only reads your own account, and never gives it other people&apos;s contact details. Read the details in the <Link href="/privacy" style={{ color: 'var(--ui-or)' }}>Privacy Policy</Link> and the <Link href="/terms" style={{ color: 'var(--ui-or)' }}>Terms</Link>.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
