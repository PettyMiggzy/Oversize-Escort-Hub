'use client'
import { useRef, useState } from 'react'
import SiteHeader from '@/components/SiteHeader'
import PageTitle from '@/components/PageTitle'

const STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','AB','BC','MB','NB','NL','NS','NT','NU','ON','PE','QC','SK','YT']
const POSITIONS = ['Lead', 'Chase', 'High Pole', 'Lineman', 'Rear Steer', 'Survey', 'Flagger']

export default function QuickPostPage() {
  const startedAt = useRef(Date.now())
  const [f, setF] = useState({ email: '', name: '', company: '', phone: '', pickupCity: '', pickupState: '', destinationCity: '', destinationState: '', escortType: 'Lead', escortCount: 1, boardType: 'flat-rate', rate: '2.00', dateNeeded: '', notes: '', website: '' })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [sent, setSent] = useState(false)
  const set = (k: string, v: string | number) => setF((p) => ({ ...p, [k]: v }))

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr(''); setBusy(true)
    try {
      const res = await fetch('/api/quick-post', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...f, rate: Number(f.rate), startedAt: startedAt.current }) })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) { setErr(d.error || 'Something went wrong. Please try again.'); return }
      setSent(true)
    } catch { setErr('Could not reach the server. Check your connection and try again.') } finally { setBusy(false) }
  }

  if (sent) {
    return (
      <>
        <SiteHeader />
        <div className="ui-page"><div className="ui-wrap" style={{ maxWidth: 560 }}>
          <div className="ui-empty">
            <h3>Check your email</h3>
            <p>We sent a link to <strong style={{ color: '#fff' }}>{f.email}</strong>. Click it to put your load on the board. The link works once and expires in 24 hours.</p>
            <a href="/open-loads" className="ui-btn ghost">See the boards</a>
          </div>
        </div></div>
      </>
    )
  }

  return (
    <>
      <SiteHeader />
      <div className="ui-page"><div className="ui-wrap" style={{ maxWidth: 720 }}>
        <PageTitle eyebrow="For carriers and brokers" title="Post a load. No account needed." lead="Fill this in, confirm from your email, and escorts see your load right away. We will set up a free account for you so you can see the bids." />
        <form onSubmit={submit} className="ui-card ui-stack" noValidate>
          {/* hidden field that only bots fill in */}
          <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}>
            <label>Website<input tabIndex={-1} autoComplete="off" value={f.website} onChange={(e) => set('website', e.target.value)} /></label>
          </div>

          <div className="ui-form-grid">
            <div><label className="ui-label" htmlFor="qp-name">Your name</label><input id="qp-name" className="ui-input" value={f.name} onChange={(e) => set('name', e.target.value)} autoComplete="name" required /></div>
            <div><label className="ui-label" htmlFor="qp-company">Company (optional)</label><input id="qp-company" className="ui-input" value={f.company} onChange={(e) => set('company', e.target.value)} autoComplete="organization" /></div>
            <div><label className="ui-label" htmlFor="qp-email">Email</label><input id="qp-email" type="email" className="ui-input" value={f.email} onChange={(e) => set('email', e.target.value)} autoComplete="email" required /></div>
            <div><label className="ui-label" htmlFor="qp-phone">Phone (optional)</label><input id="qp-phone" type="tel" className="ui-input" value={f.phone} onChange={(e) => set('phone', e.target.value)} autoComplete="tel" /></div>
          </div>

          <div className="ui-city">
            <div><label className="ui-label" htmlFor="qp-pc">Pickup city</label><input id="qp-pc" className="ui-input" value={f.pickupCity} onChange={(e) => set('pickupCity', e.target.value)} placeholder="e.g. Houston" required /></div>
            <div><label className="ui-label" htmlFor="qp-ps">State</label><select id="qp-ps" className="ui-select" value={f.pickupState} onChange={(e) => set('pickupState', e.target.value)} required><option value="">--</option>{STATES.map((s) => <option key={s}>{s}</option>)}</select></div>
          </div>
          <div className="ui-city">
            <div><label className="ui-label" htmlFor="qp-dc">Destination city</label><input id="qp-dc" className="ui-input" value={f.destinationCity} onChange={(e) => set('destinationCity', e.target.value)} placeholder="e.g. Dallas" required /></div>
            <div><label className="ui-label" htmlFor="qp-ds">State</label><select id="qp-ds" className="ui-select" value={f.destinationState} onChange={(e) => set('destinationState', e.target.value)} required><option value="">--</option>{STATES.map((s) => <option key={s}>{s}</option>)}</select></div>
          </div>

          <div className="ui-form-grid">
            <div><label className="ui-label" htmlFor="qp-pos">Escort position</label><select id="qp-pos" className="ui-select" value={f.escortType} onChange={(e) => set('escortType', e.target.value)}>{POSITIONS.map((p) => <option key={p}>{p}</option>)}</select></div>
            <div><label className="ui-label" htmlFor="qp-n">Escorts needed</label><select id="qp-n" className="ui-select" value={f.escortCount} onChange={(e) => set('escortCount', Number(e.target.value))}>{[1,2,3,4,5,6].map((n) => <option key={n} value={n}>{n}</option>)}</select></div>
            <div><label className="ui-label" htmlFor="qp-rate">Rate per mile ($)</label><input id="qp-rate" type="number" inputMode="decimal" min="0.5" max="50" step="0.05" className="ui-input" value={f.rate} onChange={(e) => set('rate', e.target.value)} required /></div>
            <div><label className="ui-label" htmlFor="qp-date">Date needed</label><input id="qp-date" type="date" className="ui-input" value={f.dateNeeded} onChange={(e) => set('dateNeeded', e.target.value)} /></div>
          </div>

          <div>
            <div className="ui-label">How should escorts respond?</div>
            <div className="ui-chips">
              <button type="button" className={`ui-chip${f.boardType === 'flat-rate' ? ' on' : ''}`} onClick={() => set('boardType', 'flat-rate')}>Flat rate: claim it</button>
              <button type="button" className={`ui-chip${f.boardType === 'open-bid' ? ' on' : ''}`} onClick={() => set('boardType', 'open-bid')}>Open bid: escorts bid</button>
            </div>
          </div>

          <div><label className="ui-label" htmlFor="qp-notes">Notes for escorts (optional)</label><textarea id="qp-notes" className="ui-textarea" rows={3} maxLength={500} value={f.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Dimensions, route, anything an escort should know. Do not put phone numbers here." /></div>

          {err && <p className="ui-err">{err}</p>}
          <button type="submit" className={busy ? 'ui-btn block dim' : 'ui-btn block'} disabled={busy}>{busy ? 'Sending…' : 'Email me the confirm link'}</button>
          <p className="ui-note">Your load goes live when you click the link in your email. It stays up for 24 hours. Escorts never see your email or phone. <a href="/post-load" className="ui-link">Already have an account? Sign in and post here.</a></p>
        </form>
      </div></div>
    </>
  )
}
