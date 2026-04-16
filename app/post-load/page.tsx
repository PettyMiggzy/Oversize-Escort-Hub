'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const ESCORT_TYPES = [
  'Lead', 'Chase', 'High Pole', 'Lineman', 'Rear Steer',
  'Survey', 'Flagger', 'NY Cert', 'CSE Ontario MTO',
  'BC Pilot Car', 'WITPAC', 'TWIC', 'AZ Cert'
]

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY'
]

export default function PostLoadPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [allowed, setAllowed] = useState(false)
  const [roleMsg, setRoleMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [permitFile, setPermitFile] = useState<File | null>(null)
  const permitRef = useRef<HTMLInputElement>(null)

  const [pickupCity, setPickupCity] = useState('')
  const [pickupState, setPickupState] = useState('')
  const [sponsoredEscorts, setSponsoredEscorts] = useState<any[]>([])
  const [destCity, setDestCity] = useState('')
  const [destState, setDestState] = useState('')
  const [dateNeeded, setDateNeeded] = useState('')
  const [escortType, setEscortType] = useState('Lead')
  const [escortQty, setEscortQty] = useState(1)
  const [loadType, setLoadType] = useState('oversize')
  const [boardType, setBoardType] = useState('flat-rate')
  const [notes, setNotes] = useState('')

  // Auto-calculate rate based on a rough mileage estimate
  // Simple heuristic: same state ~150mi, different region ~400mi
  const estimatedRate = pickupState && destState
    ? (pickupState === destState ? 250 : 500)
    : 0

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setRoleMsg('Please sign in to post a load.'); setLoading(false); return }
      const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (p?.role === 'carrier' || p?.role === 'admin') {
        setAllowed(true)
      } else {
        setRoleMsg('Only carriers can post loads.')
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
        .select('escort_id, profiles(id, full_name, membership, bgc_verified, certifications(type, status))')
        .eq('state', pickupState)
        .eq('active', true)
      if (data && data.length > 0) {
        setSponsoredEscorts(data.map((sz: any) => sz.profiles).filter(Boolean))
      } else {
        setSponsoredEscorts([])
      }
    }
    fetchSponsored()
  }, [pickupState])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pickupCity || !pickupState || !destCity || !destState || !dateNeeded) {
      alert('Please fill all required fields.')
      return
    }
    setSubmitting(true)
    try {
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      const res = await fetch('/api/loads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickupCity, pickupState,
          destinationCity: destCity,
          destinationState: destState,
          dateNeeded,
          escortType, escortQty,
          loadType, boardType,
          rate: estimatedRate,
          notes,
          expiresAt,
        }),
      })
      const data = await res.json()
      if (res.ok) {
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

  const inp: React.CSSProperties = {
    width: '100%', padding: '10px 12px', background: '#0f1a2e',
    border: '1px solid #1e3a5f', borderRadius: 6, color: '#e2e8f0',
    fontSize: 14, boxSizing: 'border-box'
  }
  const lbl: React.CSSProperties = { display: 'block', fontSize: 12, color: '#9ca3af', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }
  const grp: React.CSSProperties = { marginBottom: 16 }

  if (loading) return <div style={{ background: '#0a0f1a', minHeight: '100vh', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>

  return (
    <div style={{ minHeight: '100vh', background: '#0a0f1a', color: '#fff' }}>
      <main style={{ maxWidth: 560, margin: '0 auto', padding: '40px 24px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Post a Load</h1>
        <p style={{ color: '#9ca3af', fontSize: 13, marginBottom: 24 }}>Complete in under 2 minutes. Expires in 24 hours.</p>

        {!allowed ? (
          <div style={{ background: '#16213a', borderRadius: 8, padding: 24, color: '#9ca3af' }}>{roleMsg}</div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ background: '#0f1a2e', border: '1px solid #1e3a5f', borderRadius: 10, padding: '20px 24px', marginBottom: 16 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#f60', textTransform: 'uppercase', marginBottom: 16 }}>Pickup Location</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: 12 }}>
                <div style={grp}>
                  <label style={lbl}>City *</label>
                  <input style={inp} value={pickupCity} onChange={e => setPickupCity(e.target.value)} placeholder="e.g. Houston" required />
                </div>
                <div style={grp}>
                  <label style={lbl}>State *</label>
                  <select style={inp} value={pickupState} onChange={e => setPickupState(e.target.value)} required>
                    <option value="">--</option>
                    {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div style={{ background: '#0f1a2e', border: '1px solid #1e3a5f', borderRadius: 10, padding: '20px 24px', marginBottom: 16 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#f60', textTransform: 'uppercase', marginBottom: 16 }}>Destination</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: 12 }}>
                <div style={grp}>
                  <label style={lbl}>City *</label>
                  <input style={inp} value={destCity} onChange={e => setDestCity(e.target.value)} placeholder="e.g. Dallas" required />
                </div>
                <div style={grp}>
                  <label style={lbl}>State *</label>
                  <select style={inp} value={destState} onChange={e => setDestState(e.target.value)} required>
                    <option value="">--</option>
                    {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div style={{ background: '#0f1a2e', border: '1px solid #1e3a5f', borderRadius: 10, padding: '20px 24px', marginBottom: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={grp}>
                  <label style={lbl}>Date Needed *</label>
                  <input type="date" style={inp} value={dateNeeded} onChange={e => setDateNeeded(e.target.value)} required />
                </div>
                <div style={grp}>
                  <label style={lbl}>Escort Qty</label>
                  <select style={inp} value={escortQty} onChange={e => setEscortQty(Number(e.target.value))}>
                    {[...Array(10)].map((_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
                  </select>
                </div>
                <div style={grp}>
                  <label style={lbl}>Escort Type *</label>
                  <select style={inp} value={escortType} onChange={e => setEscortType(e.target.value)}>
                    {ESCORT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div style={grp}>
                  <label style={lbl}>Load Type</label>
                  <select style={inp} value={loadType} onChange={e => setLoadType(e.target.value)}>
                    <option value="oversize">Oversize</option>
                    <option value="overweight">Overweight</option>
                    <option value="both">Both</option>
                  </select>
                </div>
                <div style={grp}>
                  <label style={lbl}>Board Type</label>
                  <select style={inp} value={boardType} onChange={e => setBoardType(e.target.value)}>
                    <option value="flat-rate">Flat Rate</option>
                    <option value="open-bid">Open Bid</option>
                    <option value="bid">Bid</option>
                  </select>
                </div>
                <div style={grp}>
                  <label style={lbl}>Rate (auto-calculated)</label>
                  <div style={{ ...inp, color: '#f60', fontWeight: 700 }}>
                    {estimatedRate > 0 ? `Suggested: $${estimatedRate.toLocaleString()} ${estimatedMiles >= 250 ? `($2.00/mi × ~${estimatedMiles}mi)` : '($500 flat day rate — under 250mi)'}` : 'Enter pickup & destination to auto-calculate'}
                  {estimatedRate > 0 && <div style={{ color: '#9ca3af', fontSize: 11, marginTop: 4 }}>$250 no-go fee standard · $100–120 overnight standard</div>}
                  </div>
                </div>
              </div>
              <div style={grp}>
                <label style={lbl}>Notes (optional)</label>
                <textarea style={{ ...inp, minHeight: 60, resize: 'vertical' }} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Special instructions, access notes, etc." />
              </div>
              <div style={grp}>
                <label style={lbl}>Permit Upload (optional PDF)</label>
                <input ref={permitRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => setPermitFile(e.target.files?.[0] ?? null)} />
                <button type="button" onClick={() => permitRef.current?.click()} style={{ ...inp, cursor: 'pointer', textAlign: 'left', color: permitFile ? '#f60' : '#4a5568' }}>
                  {permitFile ? permitFile.name : 'Click to upload permit PDF'}
                </button>
              </div>
            </div>

            <button type="submit" disabled={submitting} style={{ width: '100%', padding: '12px 0', background: submitting ? '#1e3a5f' : '#f60', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer' }}>
              {submitting ? 'Posting...' : 'Post Load'}
            </button>
          </form>
        )}
      </main>
    </div>
  )
}
