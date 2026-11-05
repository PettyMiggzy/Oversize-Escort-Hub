'use client'
import SiteHeader from '@/components/SiteHeader';
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { isAdminEmail } from '@/lib/supabase'
import PageTitle from '@/components/PageTitle'
import EmptyState from '@/components/EmptyState'
import { EQUIPMENT, REGULARS_MINUTES } from '@/lib/quality'

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY'
]

const CA_PROVINCES = ['AB','BC','MB','NB','NL','NS','NT','NU','ON','PE','QC','SK','YT']

export function PostLoadPageClient() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [allowed, setAllowed] = useState(false)
  const [roleMsg, setRoleMsg] = useState('')
  const [postingAsPilot, setPostingAsPilot] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [permitFile, setPermitFile] = useState<File | null>(null)
  const permitRef = useRef<HTMLInputElement>(null)

  const [pickupCity, setPickupCity] = useState('')
  const [pickupState, setPickupState] = useState('')
  const [sponsoredEscorts, setSponsoredEscorts] = useState<any[]>([])
  const [destCity, setDestCity] = useState('')
  const [destState, setDestState] = useState('')
  const [dateNeeded, setDateNeeded] = useState('')
  const [positions, setPositions] = useState<string[]>([])
  const [certTypes, setCertTypes] = useState<string[]>([])
  const [loadType, setLoadType] = useState('oversize')
  const [boardType, setBoardType] = useState('flat-rate')
  const [notes, setNotes] = useState('')
  const [rate, setRate] = useState<number>(2.00)
  const [urgent, setUrgent] = useState(false)
  const [holdHours, setHoldHours] = useState(24)
  const [regMinutes, setRegMinutes] = useState(0)
  const [requiredEquip, setRequiredEquip] = useState<string[]>([])
  const [regularsCount, setRegularsCount] = useState(0)
  const [typical, setTypical] = useState<{ median: number; low: number; high: number; count: number } | null>(null)

  // Auto-calculate rate based on a rough mileage estimate
  // Simple heuristic: same state ~150mi, different region ~400mi

  const toggle = (arr: string[], val: string) => arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]
  const estimatedMiles = pickupState && destState ? (pickupState === destState ? 250 : 500) : 0
  const estimatedRate = pickupState && destState
    ? (pickupState === destState ? 250 : 500)
    : 0

  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setRoleMsg('Please sign in to post a load.'); setLoading(false); return }
      const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (p?.role === 'carrier' || p?.role === 'broker' || p?.role === 'escort' || p?.role === 'fleet_manager' || p?.role === 'admin' || isAdminEmail(user?.email)) {
        setAllowed(true)
        setPostingAsPilot(p?.role === 'escort' || p?.role === 'fleet_manager')
        fetch('/api/regulars').then(r => r.json()).then(d => setRegularsCount(Array.isArray(d?.regulars) ? d.regulars.length : 0)).catch(() => {})
      } else {
        setRoleMsg('Sign in with a carrier, broker or pilot car account to post a load.')
      }
      setLoading(false)
    }
    init()
  }, [])

  // Fetch sponsored escorts when pickupState changes
  useEffect(() => {
    if (!pickupState) { setSponsoredEscorts([]); return }
    const fetchSponsored = async () => {
      const { data } = await supabase
        .from('sponsored_zones')
        .select('user_id, profiles:user_id(id, full_name, tier, bgc_verified, certifications(type, status))')
        .eq('zone', pickupState)
        .eq('active', true)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      if (data && data.length > 0) {
        setSponsoredEscorts(data.map((sz: any) => sz.profiles).filter(Boolean))
      } else {
        setSponsoredEscorts([])
      }
    }
    fetchSponsored()
  }, [pickupState])

  // what open loads pay in the pickup state right now (needs at least 3 loads)
  useEffect(() => {
    setTypical(null)
    if (!pickupState) return
    let off = false
    fetch(`/api/rates?state=${pickupState}`).then(r => r.json()).then(d => { if (!off && d?.rate) setTypical(d.rate) }).catch(() => {})
    return () => { off = true }
  }, [pickupState])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pickupCity || !pickupState || !destCity || !destState || !dateNeeded) {
      alert('Please fill all required fields.')
      return
    }
    if (positions.length === 0) {
      alert('Select at least one escort position.')
      return
    }
    setSubmitting(true)
    try {
      let permitUrl: string | null = null
      if (permitFile) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { alert('Please sign in.'); setSubmitting(false); return }
        const path = `${user.id}/${Date.now()}_${permitFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
        const { error: upErr } = await supabase.storage.from('permits').upload(path, permitFile, { upsert: true })
        if (upErr) { alert('Permit upload failed: ' + upErr.message); setSubmitting(false); return }
        const { data: urlData } = supabase.storage.from('permits').getPublicUrl(path)
        permitUrl = urlData.publicUrl
      }
      const expiresAt = boardType === 'bid'
      ? new Date(Date.now() + 5 * 60 * 1000).toISOString()
      : new Date(Date.now() + holdHours * 60 * 60 * 1000).toISOString()
      const res = await fetch('/api/loads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickupCity, pickupState,
          destinationCity: destCity,
          destinationState: destState,
          dateNeeded,
          escortType: positions.join(', '),
          cert_types: certTypes,
          escort_count: positions.length || 1,
          loadType, boardType,
          rate: rate,
          notes,
          expiresAt,
          permitUrl,
          urgent,
          required_equipment: requiredEquip,
          regulars_minutes: boardType === 'bid' ? 0 : regMinutes,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        // Member web-push after the Pro early-access window (broadcast enforces the 5-min gate)
        try {
          setTimeout(() => {
            fetch('/api/push/broadcast', { method: 'POST' }).catch(() => {})
          }, 5 * 60 * 1000)
        } catch {}
        router.push('/dashboard')
      } else {
        alert(data.error || 'Failed to post load.')
      }
    } catch (err) {
      alert('An error occurred. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (<><SiteHeader /><div className="ui-page"><div className="ui-wrap" style={{ textAlign: 'center' }}><p className="ui-meta">Loading...</p></div></div></>)

  return (
      <>
      <SiteHeader />
    <div className="ui-page">
      <div className="ui-wrap" style={{ maxWidth: 720 }}>
        <PageTitle eyebrow="Loads" title="Post a load" lead="Complete in under 2 minutes. You choose how long it stays posted." />

        {!allowed ? (
          <EmptyState title="Posting is closed" text={roleMsg || 'Please sign in to post a load.'} />
        ) : (
          <form onSubmit={handleSubmit} className="ui-stack">
            {postingAsPilot && (
              <div className="ui-card">
                <h2 style={{ margin: '0 0 4px', fontSize: 18, color: '#fff' }}>Need cover for a job?</h2>
                <p className="ui-note" style={{ margin: 0 }}>You are posting as a pilot car. Other pilot cars can claim it or bid, and you pick who gets it. You can&apos;t claim your own load.</p>
              </div>
            )}
            <div className="ui-card">
              <p className="ui-label">Pickup Location</p>
              <div className="ui-city">
                <div>
                  <label className="ui-label" htmlFor="pu-city">City *</label>
                  <input id="pu-city" className="ui-input" value={pickupCity} onChange={e => setPickupCity(e.target.value)} placeholder="e.g. Houston" required />
                </div>
                <div>
                  <label className="ui-label" htmlFor="pu-state">State *</label>
                  <select id="pu-state" className="ui-select" value={pickupState} onChange={e => setPickupState(e.target.value)} required>
                    <option value="">--</option>
                    <optgroup label="US States">
                      {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </optgroup>
                    <optgroup label="Canadian Provinces">
                      {CA_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                    </optgroup>
                  </select>
                </div>
              </div>
            </div>

            <div className="ui-card">
              <p className="ui-label">Destination</p>
              <div className="ui-city">
                <div>
                  <label className="ui-label" htmlFor="dl-city">City *</label>
                  <input id="dl-city" className="ui-input" value={destCity} onChange={e => setDestCity(e.target.value)} placeholder="e.g. Dallas" required />
                </div>
                <div>
                  <label className="ui-label" htmlFor="dl-state">State *</label>
                  <select id="dl-state" className="ui-select" value={destState} onChange={e => setDestState(e.target.value)} required>
                    <option value="">--</option>
                    <optgroup label="US States">
                      {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </optgroup>
                    <optgroup label="Canadian Provinces">
                      {CA_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                    </optgroup>
                  </select>
                </div>
              </div>
            </div>

            <div className="ui-card">
              <div className="ui-form-grid">
                <div>
                  <label className="ui-label" htmlFor="date-needed">Date Needed *</label>
                  <input id="date-needed" type="date" className="ui-input" value={dateNeeded} onChange={e => setDateNeeded(e.target.value)} required />
                </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ marginBottom: 16 }}>
                  <label className="ui-label">Position *</label>
                  <div className="ui-chips">
                    {['Lead','Chase','High Pole','Lineman','Rear Steer','Survey','Flagger'].map(opt => (
                      <label key={opt} className={positions.includes(opt) ? 'ui-chip on' : 'ui-chip'}>
                        <input type="checkbox" checked={positions.includes(opt)} onChange={() => setPositions(prev => toggle(prev, opt))} style={{ accentColor: 'var(--ui-or)' }} />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label className="ui-label">Equipment required (optional)</label>
                  <div className="ui-chips">
                    {EQUIPMENT.map(opt => (
                      <label key={opt.key} className={requiredEquip.includes(opt.key) ? 'ui-chip on' : 'ui-chip'}>
                        <input type="checkbox" checked={requiredEquip.includes(opt.key)} onChange={() => setRequiredEquip(prev => toggle(prev, opt.key))} style={{ accentColor: 'var(--ui-or)' }} />
                        {opt.short}
                      </label>
                    ))}
                  </div>
                  <div className="ui-meta" style={{ marginTop: 6 }}>Pilot cars list their own equipment and confirm it when they claim. We do not check it.</div>
                </div>
                {boardType !== 'bid' && (
                  <div style={{ marginBottom: 16 }}>
                    <label className="ui-label" htmlFor="hold-hours">Keep it posted for</label>
                    <select id="hold-hours" className="ui-select" value={holdHours} onChange={e => setHoldHours(Number(e.target.value))}>
                      <option value={24}>24 hours</option>
                      <option value={48}>2 days</option>
                      <option value={72}>3 days</option>
                      <option value={120}>5 days</option>
                      <option value={168}>7 days (a week)</option>
                    </select>
                    <div className="ui-meta" style={{ marginTop: 6 }}>Posting for a job next week? Pick the days you need. You can close it any time.</div>
                  </div>
                )}
                <div style={{ marginBottom: 16 }}>
                  <label className="ui-label">Speed</label>
                  <label className={urgent ? 'ui-chip on' : 'ui-chip'} style={{ display: 'inline-flex' }}>
                    <input type="checkbox" checked={urgent} onChange={() => setUrgent(v => !v)} style={{ accentColor: 'var(--ui-or)' }} />
                    Urgent: I need an escort now
                  </label>
                  <div className="ui-meta" style={{ marginTop: 6 }}>Pilot cars who said they are available in your pickup state are alerted right away.</div>
                </div>
                {boardType !== 'bid' && (
                  <div style={{ marginBottom: 16 }}>
                    <label className="ui-label" htmlFor="regulars-first">Regulars first</label>
                    <select id="regulars-first" className="ui-select" value={regMinutes} disabled={regularsCount === 0} onChange={e => setRegMinutes(Number(e.target.value))}>
                      <option value={0}>No, open to everyone now</option>
                      {REGULARS_MINUTES.map(m => <option key={m} value={m}>{m} minutes for my regulars</option>)}
                    </select>
                    <div className="ui-meta" style={{ marginTop: 6 }}>{regularsCount === 0 ? 'Star pilot cars on Find Escorts to make a regulars list.' : `You have ${regularsCount} regular${regularsCount === 1 ? '' : 's'}. They get the first look, then everyone else.`}</div>
                  </div>
                )}
                <div>
                  <label className="ui-label">Required Certifications</label>
                  <div className="ui-chips">
                    {['NY Cert','CSE (Ontario MTO)','BC Pilot Car','WITPAC','TWIC','AZ Cert','CTTS BC','CTTS AB','OAPC','Saskatchewan'].map(opt => (
                      <label key={opt} className={certTypes.includes(opt) ? 'ui-chip on' : 'ui-chip'}>
                        <input type="checkbox" checked={certTypes.includes(opt)} onChange={() => setCertTypes(prev => toggle(prev, opt))} style={{ accentColor: 'var(--ui-or)' }} />
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
                <div>
                  <label className="ui-label" htmlFor="load-type">Load Type</label>
                  <select id="load-type" className="ui-select" value={loadType} onChange={e => setLoadType(e.target.value)}>
                    <option value="oversize">Oversize</option>
                    <option value="overweight">Overweight</option>
                    <option value="both">Both</option>
                  </select>
                </div>
                <div>
                  <label className="ui-label" htmlFor="board-type">Board Type</label>
                  <select id="board-type" className="ui-select" value={boardType} onChange={e => setBoardType(e.target.value)}>
                    <option value="flat-rate">Flat Rate</option>
                    <option value="open-bid">Open Bid (24–48hr)</option>
                    <option value="bid">5-Min Bid</option>
                  </select>
                </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label className="ui-label" htmlFor="rate">Rate Per Mile (USD)</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span className="ui-v or" style={{ fontSize: 18 }}>$</span>
            <input
              id="rate"
              type="number"
              min="0.50"
              max="99.99"
              step="0.25"
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              className="ui-input"
              style={{ width: 140, flex: '0 1 140px' }}
              placeholder="2.00"
            />
            <span className="ui-meta">/mi</span>
          </div>
          <div className="ui-meta" style={{ marginTop: 6 }}>
            Standard: $2.00/mi · No-go: $250 · Overnight: $100
          </div>
          {typical && (
            <div className="ui-meta" style={{ marginTop: 6, color: '#ffc46b' }}>
              Open loads picking up in {pickupState} pay about ${typical.median.toFixed(2)}/mi right now (${typical.low.toFixed(2)} to ${typical.high.toFixed(2)}, {typical.count} loads). Just a guide, not advice.
            </div>
          )}
        </div>
              </div>
              <div style={{ marginTop: 16 }}>
                <label className="ui-label" htmlFor="notes">Notes (optional)</label>
                <textarea id="notes" className="ui-textarea" style={{ minHeight: 80, resize: 'vertical' }} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Special instructions, access notes, etc." />
              </div>
              <div style={{ marginTop: 16 }}>
                <label className="ui-label">Permit Upload (optional PDF)</label>
                <input ref={permitRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => setPermitFile(e.target.files?.[0] ?? null)} />
                <button type="button" onClick={() => permitRef.current?.click()} className="ui-btn ghost block">
                  {permitFile ? permitFile.name : 'Click to upload permit PDF'}
                </button>
              </div>
            </div>

            <button type="submit" disabled={submitting} className={submitting ? 'ui-btn block dim' : 'ui-btn block'}>
              {submitting ? 'Posting...' : 'Post Load'}
            </button>
          </form>
        )}
      </div>
    </div>
      </>
  )
}
