'use client'
import '@/app/globals.css'
import SiteHeader from '@/components/SiteHeader';
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { isAdminEmail } from '@/lib/supabase'
import { BoardAdSidebar } from '@/components/BoardAdSidebar';

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

export function OpenLoadsBoardClient() {
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
    setLoads((data || [])
      .filter((load: any) => {
        if (!load.deadhead_notified_at) return true
        return new Date(load.deadhead_notified_at).getTime() + 5 * 60 * 1000 <= Date.now()
      }))

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

  const card = { background: 'var(--p1, #111)', border: '1px solid #222', borderLeft: '3px solid #f0a500', padding: '16px 20px', marginBottom: '12px', borderRadius: '4px' }

  if (loading) {
    return (
      <>
        <SiteHeader />
        <div style={{ background: '#0a0a0a', minHeight: '100vh', padding: '24px', color: '#ccc', textAlign: 'center' }}>
          Loading...
        </div>
      </>
    );
  }

  return (
      <>
      <SiteHeader />
    <div style={{ background: '#0a0a0a', minHeight: '100vh', padding: '24px', color: '#ccc' }}>
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', maxWidth: 1100, margin: '0 auto' }}>
        <main style={{ flex: 1, minWidth: 0, maxWidth: 760, padding: '40px 24px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Open Bid Board</h1>
        <p style={{ color: '#9ca3af', fontSize: 13, marginBottom: 24 }}>Loads sorted by time remaining. Pro escorts can bid. Carriers see all bids in their dashboard.</p>

        {loads.length === 0 ? (
          <div style={{ ...card, textAlign: 'center', padding: 40 }}>
            <p style={{ color: '#9ca3af' }}>No open bid loads available right now.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {loads.map((load: any) => {
          const loadBids = bids[load.id] || []
          const highestBid = loadBids[0]?.rate
          return (
            <div
              key={load.id}
              style={{
                background: '#111',
                border: '1px solid #222',
                borderLeft: '4px solid #f0a500',
                borderRadius: 8,
                padding: '20px 24px',
                marginBottom: 16,
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: 16,
                alignItems: 'start'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 6 }}>
                    {load.pu_city}, {load.pu_state} → {load.dl_city}, {load.dl_state}
                  </div>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: '#f0a500' }}>
                      {load.escort_type || 'Position TBD'}
                    </span>
                    <span style={{ fontSize: 13, color: '#9ca3af' }}>
                      {load.load_type || ''}{load.load_type && load.board_type ? ' · ' : ''}{load.board_type || ''}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
                      {load.bgc_verified && (
                        <span style={{ background: '#14532d', color: '#22c55e', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>✓ BGC</span>
                      )}
                      {load.fmcsa_verified && (
                        <span style={{ background: '#1e3a5f', color: '#60a5fa', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>✓ FMCSA</span>
                      )}
                      {load.poster_rating && (
                        <span style={{ fontSize: 11, color: '#f0a500' }}>★ {Number(load.poster_rating).toFixed(1)} ({load.poster_jobs || 0} jobs)</span>
                      )}
                    </div>
                    {load.start_date ? `Needed ${load.start_date}` : `Posted ${new Date(load.created_at).toLocaleDateString()}`}
                  </div>
                </div>
                <div style={{ textAlign: 'right', minWidth: 90 }}>
                  <div style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
                    Time Left
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#4ade80' }}>
                    <TimeRemaining expiresAt={load.expires_at} />
                  </div>
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Posted Rate</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#f0a500' }}>${load.rate != null ? Number(load.rate).toLocaleString() : 'TBD'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Highest Bid</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#f60' }}>{highestBid ? `$${Number(highestBid).toLocaleString()}` : 'No bids'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Bids</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>{loadBids.length}</div>
                  </div>
                </div>
                {!userId ? (
                  <a href={`/signin?redirect=/open-loads`} style={{
                    display: 'block', background: '#1e3a5f', color: '#e2e8f0', border: 'none', borderRadius: 6,
                    padding: '8px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer', width: '100%',
                    textAlign: 'center', textDecoration: 'none'
                  }}>Sign In to Bid</a>
                ) : isPro ? (
                  <button
                    onClick={() => { setBidModal({ loadId: load.id, loadRate: load.rate }); setBidRate('') }}
                    style={{
                      background: '#f0a500', color: '#000', border: 'none', borderRadius: 6,
                      padding: '8px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer', width: '100%'
                    }}
                  >
                    Place Bid
                  </button>
                ) : (
                  <a href="/pricing" style={{
                    display: 'block', background: '#2a2a2a', color: '#6b7280', border: '1px solid #333', borderRadius: 6,
                    padding: '8px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer', width: '100%',
                    textAlign: 'center', textDecoration: 'none'
                  }}>Pro Required</a>
                )}
              </div>
            </div>
          )
            })}
          </div>
        )}
        </main>
        <BoardAdSidebar />
      </div>

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
