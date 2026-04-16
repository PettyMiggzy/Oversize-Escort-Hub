'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams } from 'next/navigation'
import Link from 'next/link'

export default function LoadDetailPage() {
  const params = useParams()
  const id = params?.id as string
  const [load, setLoad] = useState<any>(null)
  const [carrier, setCarrier] = useState<any>(null)
  const [escort, setEscort] = useState<any>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [bids, setBids] = useState<any[]>([])
  const [bidRate, setBidRate] = useState('')
  const [bidStatus, setBidStatus] = useState('')
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    if (!id) return
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)
      if (user) {
        const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        setUserProfile(p)
      }

      const { data: loadData } = await supabase.from('loads').select('*').eq('id', id).single()
      setLoad(loadData)

      if (loadData?.posted_by) {
        const { data: c } = await supabase.from('profiles').select('full_name, phone, email').eq('id', loadData.posted_by).single()
        setCarrier(c)
      }
      if (loadData?.matched_escort_id) {
        const { data: e } = await supabase.from('profiles').select('full_name, phone, email').eq('id', loadData.matched_escort_id).single()
        setEscort(e)
      }
      if (loadData?.board_type === 'bid' || loadData?.board_type === 'open-bid') {
        const { data: b } = await supabase.from('bids').select('*').eq('load_id', id).order('rate', { ascending: false })
        setBids(b || [])
      }
      setLoading(false)
    }
    init()
  }, [id])

  const submitBid = async () => {
    if (!currentUser || !bidRate) return
    setBidStatus('Submitting...')
    const { error } = await supabase.from('bids').insert({ load_id: id, escort_id: currentUser.id, rate: parseFloat(bidRate) })
    if (error) { setBidStatus('Error: ' + error.message); return }
    setBidStatus('Bid placed successfully!')
    const { data: b } = await supabase.from('bids').select('*').eq('load_id', id).order('rate', { ascending: false })
    setBids(b || [])
  }

  if (loading) return <div style={{ background: '#0a0f1a', minHeight: '100vh', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>
  if (!load) return <div style={{ background: '#0a0f1a', minHeight: '100vh', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Load not found.</div>

  const isCarrier = userProfile?.role === 'carrier'
  const isEscort = userProfile?.role === 'escort'
  const isPro = userProfile?.tier === 'pro' || userProfile?.tier === 'fleet_pro'
  const isMatchedEscort = currentUser && load.matched_escort_id === currentUser.id
  const isOwnerCarrier = currentUser && load.posted_by === currentUser.id
  const isMatched = load.status === 'matched'
  const canSeeFull = isMatched && (isMatchedEscort || isOwnerCarrier)
  const isBidType = load.board_type === 'bid' || load.board_type === 'open-bid'

  const card = { background: '#0f1a2e', border: '1px solid #1e3a5f', borderRadius: 10, padding: '20px 24px', marginBottom: 16 }
  const row = { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(30,58,95,0.4)' } as React.CSSProperties
  const label = { fontSize: 12, color: '#9ca3af', fontWeight: 600 }
  const value = { fontSize: 13, color: '#e2e8f0' }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0f1a', color: '#fff' }}>
      <main style={{ maxWidth: 680, margin: '0 auto', padding: '40px 24px' }}>
        <Link href="/open-loads" style={{ fontSize: 13, color: '#9ca3af', textDecoration: 'none', display: 'block', marginBottom: 16 }}>← Back to Board</Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>Load Details</h1>
          <span style={{ background: load.status === 'open' ? '#1e3a5f' : load.status === 'matched' ? '#14532d' : '#7f1d1d', color: '#fff', borderRadius: 6, padding: '4px 12px', fontSize: 12, fontWeight: 700 }}>
            {load.status?.toUpperCase()}
          </span>
        </div>

        <div style={card}>
          {[
            ['Route', `${load.pickup_city}, ${load.pickup_state} → ${load.destination_city}, ${load.destination_state}`],
            ['Escort Type', load.escort_type],
            ['Escort Qty', load.escort_qty ?? 1],
            ['Load Type', load.load_type],
            ['Board Type', load.board_type],
            ['Rate', `$${load.rate}`],
            ['Date Needed', load.date_needed ?? '—'],
            ['Posted', new Date(load.created_at).toLocaleDateString()],
          ].map(([k, v]) => (
            <div key={String(k)} style={row}>
              <span style={label}>{k}</span>
              <span style={value}>{String(v)}</span>
            </div>
          ))}
          {load.notes && (
            <div style={{ marginTop: 12 }}>
              <p style={label}>NOTES</p>
              <p style={{ ...value, marginTop: 4 }}>{load.notes}</p>
            </div>
          )}
        </div>

        {/* Carrier Info */}
        <div style={card}>
          <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Carrier Info</h2>
          <p style={value}>{carrier?.full_name ?? 'Anonymous Carrier'}</p>
          {canSeeFull && (
            <>
              <p style={{ ...value, marginTop: 4 }}>📞 {carrier?.phone ?? '—'}</p>
              <p style={{ ...value, marginTop: 4 }}>✉️ {carrier?.email ?? '—'}</p>
            </>
          )}
          {!canSeeFull && <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>Contact info shown after match is confirmed.</p>}
        </div>

        {/* Status for pending match */}
        {load.status === 'pending_match' && isMatchedEscort && (
          <div style={{ ...card, borderColor: '#f60' }}>
            <p style={{ color: '#f60', fontWeight: 600 }}>⏳ Awaiting carrier approval</p>
            <p style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>The carrier is reviewing your match request.</p>
          </div>
        )}

        {/* Full contact when matched */}
        {canSeeFull && escort && isOwnerCarrier && (
          <div style={{ ...card, borderColor: '#22c55e' }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#22c55e' }}>✅ Matched Escort</h2>
            <p style={value}>{escort.full_name}</p>
            <p style={{ ...value, marginTop: 4 }}>📞 {escort.phone ?? '—'}</p>
            <p style={{ ...value, marginTop: 4 }}>✉️ {escort.email ?? '—'}</p>
          </div>
        )}

        {/* Bid form for Pro escorts on bid loads */}
        {isBidType && isPro && isEscort && load.status === 'open' && (
          <div style={card}>
            <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Place a Bid</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="number"
                style={{ flex: 1, background: '#16213a', border: '1px solid #1e3a5f', borderRadius: 6, color: '#e2e8f0', padding: '10px 12px', fontSize: 14 }}
                placeholder="Your rate ($)"
                value={bidRate}
                onChange={e => setBidRate(e.target.value)}
              />
              <button onClick={submitBid} style={{ background: '#f60', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 20px', fontWeight: 700, cursor: 'pointer' }}>Bid</button>
            </div>
            {bidStatus && <p style={{ fontSize: 12, color: bidStatus.startsWith('Error') ? '#ef4444' : '#22c55e', marginTop: 8 }}>{bidStatus}</p>}
          </div>
        )}

        {/* Bids list (carrier only or when matched) */}
        {isBidType && bids.length > 0 && (isOwnerCarrier || isMatchedEscort) && (
          <div style={card}>
            <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>All Bids ({bids.length})</h2>
            {bids.map((b: any, i) => (
              <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(30,58,95,0.4)' }}>
                <span style={{ fontSize: 13, color: '#9ca3af' }}>Bid #{i + 1}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: i === 0 ? '#f60' : '#e2e8f0' }}>${b.rate}</span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
