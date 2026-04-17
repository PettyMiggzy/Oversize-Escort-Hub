'use client'
import SiteHeader from '@/components/SiteHeader';
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

function TimeRemaining({ expiresAt }: { expiresAt: string }) {
  const [remaining, setRemaining] = useState('')
  useEffect(() => {
    const calc = () => {
      const diff = new Date(expiresAt).getTime() - Date.now()
      if (diff <= 0) { setRemaining('Expired'); return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      setRemaining(`${h}h ${m}m`)
    }
    calc()
    const i = setInterval(calc, 60000)
    return () => clearInterval(i)
  }, [expiresAt])
  return <span style={{ color: remaining === 'Expired' ? '#ef4444' : '#f60' }}>{remaining}</span>
}

export default function OpenLoadsPage() {
  const [loads, setLoads] = useState<any[]>([])
  const [bids, setBids] = useState<Record<string, any[]>>({})
  const [loading, setLoading] = useState(true)
  const [isPro, setIsPro] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [bidModal, setBidModal] = useState<{ loadId: string; loadRate: number } | null>(null)
  const [bidRate, setBidRate] = useState('')
  const [bidStatus, setBidStatus] = useState('')

  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        const { data: p } = await supabase.from('profiles').select('tier').eq('id', user.id).single()
        setIsPro(p?.tier === 'pro' || p?.tier === 'fleet_pro')
      }
      await fetchLoads()
      setLoading(false)
    }
    init()
  }, [])

  const fetchLoads = async () => {
    const { data } = await supabase
      .from('loads')
      .select('*')
      .in('board_type', ['open-bid', 'bid'])
      .eq('status', 'open')
      .gt('expires_at', new Date().toISOString())
      .order('expires_at', { ascending: true })
    setLoads(data || [])

    // Fetch bids for each load
    if (data && data.length > 0) {
      const loadIds = data.map((l: any) => l.id)
      const { data: allBids } = await supabase
        .from('bids')
        .select('*')
        .in('load_id', loadIds)
        .order('rate', { ascending: false })
      
      const grouped: Record<string, any[]> = {}
      for (const b of (allBids || [])) {
        if (!grouped[b.load_id]) grouped[b.load_id] = []
        grouped[b.load_id].push(b)
      }
      setBids(grouped)
    }
  }

  const submitBid = async () => {
    if (!bidModal || !userId || !bidRate) return
    setBidStatus('Submitting...')
    const { error } = await supabase.from('bids').insert({
      load_id: bidModal.loadId,
      escort_id: userId,
      rate: parseFloat(bidRate)
    })
    if (error) { setBidStatus('Error: ' + error.message); return }
    setBidStatus('Bid placed!')
    await fetchLoads()
    setTimeout(() => { setBidModal(null); setBidStatus(''); setBidRate('') }, 1500)
  }

  const card = { background: '#0f1a2e', border: '1px solid #1e3a5f', borderRadius: 10, padding: '16px 20px', marginBottom: 12 }

  if (loading) return <div style={{ background: '#0a0f1a', minHeight: '100vh', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>

  return (
      <>
      <SiteHeader />
    <div style={{ minHeight: '100vh', background: '#0a0f1a', color: '#fff' }}>
      <main style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Open Bid Board</h1>
        <p style={{ color: '#9ca3af', fontSize: 13, marginBottom: 24 }}>Loads sorted by time remaining. Pro escorts can bid. Carriers see all bids in their dashboard.</p>

        {loads.length === 0 ? (
          <div style={{ ...card, textAlign: 'center', padding: 40 }}>
            <p style={{ color: '#9ca3af' }}>No open bid loads available right now.</p>
          </div>
        ) : loads.map((load: any) => {
          const loadBids = bids[load.id] || []
          const highestBid = loadBids[0]?.rate
          return (
            <div key={load.id} style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
                    {load.pickup_city}, {load.pickup_state} → {load.destination_city}, {load.destination_state}
                  </h3>
                  <p style={{ fontSize: 13, color: '#9ca3af' }}>{load.escort_type} · {load.load_type} · {load.board_type}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 12, color: '#9ca3af' }}>Time remaining</p>
                  <TimeRemaining expiresAt={load.expires_at} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 24, marginBottom: 12 }}>
                <div>
                  <p style={{ fontSize: 11, color: '#9ca3af' }}>POSTED RATE</p>
                  <p style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>${load.rate}</p>
                </div>
                <div>
                  <p style={{ fontSize: 11, color: '#9ca3af' }}>HIGHEST BID</p>
                  <p style={{ fontSize: 16, fontWeight: 700, color: '#f60' }}>{highestBid ? `$${highestBid}` : 'No bids yet'}</p>
                </div>
                <div>
                  <p style={{ fontSize: 11, color: '#9ca3af' }}>BIDS PLACED</p>
                  <p style={{ fontSize: 16, fontWeight: 700 }}>{loadBids.length}</p>
                </div>
                {load.date_needed && (
                  <div>
                    <p style={{ fontSize: 11, color: '#9ca3af' }}>DATE NEEDED</p>
                    <p style={{ fontSize: 14 }}>{load.date_needed}</p>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <Link href={`/loads/${load.id}`} style={{ textDecoration: 'none' }}>
                  <button style={{ background: '#1e3a5f', color: '#e2e8f0', border: 'none', borderRadius: 6, padding: '7px 14px', fontSize: 13, cursor: 'pointer' }}>View Details</button>
                </Link>
                {isPro && userId && (
                  <button
                    onClick={() => { setBidModal({ loadId: load.id, loadRate: load.rate }); setBidRate('') }}
                    style={{ background: '#f60', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Place Bid
                  </button>
                )}
                {!isPro && userId && (
                  <span style={{ fontSize: 12, color: '#9ca3af', alignSelf: 'center' }}>Pro membership required to bid</span>
                )}
              </div>
            </div>
          )
        })}
      </main>

      {/* Bid Modal */}
      {bidModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#0f1a2e', border: '1px solid #1e3a5f', borderRadius: 12, padding: 32, width: 320 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Place Your Bid</h3>
            <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 16 }}>Posted rate: <strong style={{ color: '#fff' }}>${bidModal.loadRate}</strong></p>
            <input
              type="number"
              style={{ background: '#16213a', border: '1px solid #1e3a5f', borderRadius: 6, color: '#e2e8f0', padding: '10px 12px', fontSize: 15, width: '100%', marginBottom: 16, boxSizing: 'border-box' }}
              placeholder="Your rate (e.g. 450)"
              value={bidRate}
              onChange={e => setBidRate(e.target.value)}
            />
            {bidStatus && <p style={{ fontSize: 12, color: bidStatus.startsWith('Error') ? '#ef4444' : '#22c55e', marginBottom: 8 }}>{bidStatus}</p>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={submitBid} style={{ flex: 1, background: '#f60', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 0', fontWeight: 700, cursor: 'pointer' }}>Submit Bid</button>
              <button onClick={() => setBidModal(null)} style={{ flex: 1, background: '#1e3a5f', color: '#e2e8f0', border: 'none', borderRadius: 6, padding: '10px 0', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

    </div>
      </>
  )
}
