'use client'
import '@/app/globals.css'
import SiteHeader from '@/components/SiteHeader';
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { isAdminEmail } from '@/lib/supabase'
import { getAccessLevel, secondsUntilClaimable, type AccessLevel } from '@/lib/board-access'
import { effectiveTier } from '@/lib/free-launch'
import { BoardAdSidebar } from '@/components/BoardAdSidebar';
import PageTitle from '@/components/PageTitle'
import BoardTabs from '@/components/BoardTabs'
import EmptyState from '@/components/EmptyState'
import { VERIFICATION_LIVE } from '@/lib/verification'

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
  return <span style={{ color: remaining === 'Expired' ? '#ff5a5a' : 'inherit' }}>{remaining}</span>
}

export function OpenLoadsBoardClient() {
  const [loads, setLoads] = useState<any[]>([])
  const [bids, setBids] = useState<Record<string, any[]>>({})
  const [loading, setLoading] = useState(true)
  const [accessLevel, setAccessLevel] = useState<AccessLevel>('none')
  const [viewerRole, setViewerRole] = useState<string | null>(null)
  // Tick once a second so per-load Member countdowns re-render in real time.
  const [now, setNow] = useState<number>(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  const [userId, setUserId] = useState<string | null>(null)
  const [bidModal, setBidModal] = useState<{ loadId: string; loadRate: number } | null>(null)
  const [bidRate, setBidRate] = useState('')
  const [bidStatus, setBidStatus] = useState('')

  const [windowWidth, setWindowWidth] = useState(1200);
  useEffect(() => {
    setWindowWidth(window.innerWidth);
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const isMobile = windowWidth < 768;

  const supabase = createClient()

  useEffect(() => {
    const loadUser = async (uid: string, email?: string | null): Promise<boolean> => {
      setUserId(uid)
      const { data: p } = await supabase.from('profiles').select('tier, role').eq('id', uid).single()
      setViewerRole(p?.role ?? null)
      const admin = isAdminEmail(email)
      const level = getAccessLevel(effectiveTier(p?.tier, p?.role), admin)
      setAccessLevel(level)
      return level === 'instant'
    }
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      let pro = false
      if (user) pro = await loadUser(user.id, user.email)
      await fetchLoads(pro)
      setLoading(false)
    }
    init()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadUser(session.user.id, session.user.email)
      } else {
        setUserId(null)
        setAccessLevel('none')
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const fetchLoads = async (_proFlag?: boolean) => {
    // Tier gating is enforced in the per-load button UI (see Place Bid block),
    // not at the query level. Every authenticated escort sees every open load.
    let query = supabase
      .from('loads')
      .select('*')
      .in('board_type', ['open-bid'])
      .eq('status', 'open')
      .gt('expires_at', new Date().toISOString())
    // (cutoff filter removed: tier gating now lives in the button UI)
    const { data } = await query.order('expires_at', { ascending: true })
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
    const res = await fetch('/api/bids', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ load_id: bidModal.loadId, rate: parseFloat(bidRate) }),
    })
    const result = await res.json().catch(() => ({} as any))
    if (!res.ok) { setBidStatus('Error: ' + (result.error || 'Could not place the bid')); return }
    setBidStatus('Bid placed!')
    await fetchLoads()
    setTimeout(() => { setBidModal(null); setBidStatus(''); setBidRate('') }, 1500)
  }

  if (loading) {
    return (
      <>
        <SiteHeader />
        <div className="ui-page"><div className="ui-wrap" style={{ textAlign: 'center', color: '#9aa3b2' }}>Loading&hellip;</div></div>
      </>
    );
  }

  const bidBtn = (load: any) => (
    <button className="ui-btn block" onClick={() => { setBidModal({ loadId: load.id, loadRate: load.per_mile_rate }); setBidRate('') }}>Place bid</button>
  )

  return (
    <>
      <SiteHeader />
      <div className="ui-page">
        <div className="ui-wrap">
          <PageTitle eyebrow="Find loads" title="Open bid board" lead="Loads sorted by time remaining. Escorts bid, carriers see every bid on their dashboard." />
          <BoardTabs active="open" />
          <div className={loads.length === 0 ? undefined : "ui-two"}>
            <main style={{ minWidth: 0 }}>
              {loads.length === 0 ? (
                <EmptyState
                  title="No open loads right now"
                  text="New loads show up here the moment a carrier posts them. Check back soon, or post one yourself."
                  action={<Link href={userId ? "/post-load" : "/quick-post"} className="ui-btn">Post a load</Link>}
                />
              ) : (
                <div className="ui-grid" style={isMobile ? { gridTemplateColumns: '1fr' } : undefined}>
                  {loads.map((load: any) => {
                    const loadBids = bids[load.id] || []
                    const highestBid = loadBids[0]?.rate
                    return (
                      <div key={load.id} className="ui-load">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="ui-route">{load.pu_city}, {load.pu_state} &rarr; {load.dl_city}, {load.dl_state}</div>
                            <div className="ui-meta" style={{ marginTop: 6 }}>
                              <span style={{ color: '#ffc46b', fontWeight: 600 }}>{load.escort_type || 'Position TBD'}</span>
                              {(load.load_type || load.board_type) && <> &middot; {load.load_type || ''}{load.load_type && load.board_type ? ' · ' : ''}{load.board_type || ''}</>}
                            </div>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 10 }}>
                              {VERIFICATION_LIVE && load.bgc_verified && <span className="ui-badge green">&#10003; BGC</span>}
                              {VERIFICATION_LIVE && load.fmcsa_verified && <span className="ui-badge blue">&#10003; FMCSA</span>}
                              {load.poster_rating && <span className="ui-meta" style={{ color: '#ffc46b' }}>&#9733; {Number(load.poster_rating).toFixed(1)} ({load.poster_jobs || 0} jobs)</span>}
                              <span className="ui-meta">{load.start_date ? `Needed ${load.start_date}` : `Posted ${new Date(load.created_at).toLocaleDateString()}`}</span>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', minWidth: 80 }}>
                            <div className="ui-k">Time left</div>
                            <div className="ui-v gr" style={{ fontSize: 16 }}><TimeRemaining expiresAt={load.expires_at} /></div>
                          </div>
                        </div>
                        <div className="ui-stats">
                          <div><div className="ui-k">Posted rate</div><div className="ui-v or">${load.per_mile_rate != null ? Number(load.per_mile_rate).toLocaleString() : 'TBD'}</div></div>
                          <div><div className="ui-k">Highest bid</div><div className="ui-v">{highestBid ? `$${Number(highestBid).toLocaleString()}` : 'No bids'}</div></div>
                          <div><div className="ui-k">Bids</div><div className="ui-v">{loadBids.length}</div></div>
                        </div>
                        <div>
                          {!userId ? (
                            <a href={`/signin?redirect=/open-loads`} className="ui-btn block ghost">Sign in to bid</a>
                          ) : accessLevel === 'instant' ? (
                            bidBtn(load)
                          ) : accessLevel === 'delayed' ? (
                            // Member: 60s countdown gated on load.created_at, then Place Bid unlocks.
                            (() => {
                              const remaining = secondsUntilClaimable(load.created_at, now)
                              if (remaining > 0) return <button className="ui-btn block dim" disabled>{`Available in ${remaining}s...`}</button>
                              return bidBtn(load)
                            })()
                          ) : viewerRole === 'carrier' || viewerRole === 'broker' ? (
                            <div className="ui-meta" style={{ textAlign: 'center' }}>Escorts bid on loads from here</div>
                          ) : (
                            <Link href="/pricing" className="ui-btn block ghost">Upgrade to Member &rarr;</Link>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </main>
            {loads.length > 0 && <BoardAdSidebar />}
          </div>
        </div>

        {bidModal && (
          <div className="ui-modal-back">
            <div className="ui-modal">
              <h3>Place your bid</h3>
              <p className="ui-meta" style={{ margin: '0 0 16px' }}>Posted rate: <strong style={{ color: '#fff' }}>${bidModal.loadRate}</strong></p>
              <label className="ui-label" htmlFor="bid-rate">Your rate</label>
              <input id="bid-rate" type="number" className="ui-input" placeholder="e.g. 450" value={bidRate} onChange={e => setBidRate(e.target.value)} />
              {bidStatus && <p className="ui-meta" style={{ margin: '10px 0 0', color: bidStatus.startsWith('Error') ? '#ff8a8a' : '#35d489' }}>{bidStatus}</p>}
              <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                <button className="ui-btn" style={{ flex: 1 }} onClick={submitBid}>Submit bid</button>
                <button className="ui-btn ghost" style={{ flex: 1 }} onClick={() => setBidModal(null)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
