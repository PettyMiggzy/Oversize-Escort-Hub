'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'
import PageTitle from '@/components/PageTitle'
import EmptyState from '@/components/EmptyState'
import ReportLoad from '@/components/ReportLoad'
import BlockUser from '@/components/BlockUser'
import { isAdminEmail } from '@/lib/supabase'
import { getAccessLevel, secondsUntilClaimable } from '@/lib/board-access'
import { withFreeLaunch } from '@/lib/free-launch'

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
  const [claimStatus, setClaimStatus] = useState('')
  const [claiming, setClaiming] = useState(false)
  const [loading, setLoading] = useState(true)
  const [blockedPoster, setBlockedPoster] = useState(false)

  const supabase = createClient()
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (!id) return
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)
      let profile: any = null
      if (user) {
        const { data: p } = await supabase.from('profiles').select('id, role, tier').eq('id', user.id).single()
        profile = p ? withFreeLaunch(p) : null
        setUserProfile(profile)
      }

      const { data: loadData } = await supabase.from('loads').select('*').eq('id', id).single()
      setLoad(loadData)
      if (user && loadData?.carrier_id && loadData.carrier_id !== user.id) {
        const hidden: string[] = await fetch('/api/blocks').then((r) => r.json()).then((d) => d.hidden || []).catch(() => [])
        if (hidden.includes(loadData.carrier_id)) setBlockedPoster(true)
      }

      if (loadData?.carrier_id) {
        const { data: c } = await supabase.from('profiles').select('full_name').eq('id', loadData.carrier_id).single()
        setCarrier(c)
      }
      if (loadData?.matched_escort_id) {
        const { data: e } = await supabase.from('profiles').select('full_name').eq('id', loadData.matched_escort_id).single()
        setEscort(e)
      }

      const share = loadData && (loadData.status === 'filled' || loadData.status === 'pending_match')
      const viewer = user?.id
      const party = viewer && (viewer === loadData?.carrier_id || viewer === loadData?.matched_escort_id)
      const admin = isAdminEmail(user?.email) || profile?.role === 'admin'
      if (share && viewer && (party || admin)) {
        const pull = async (who: string, apply: (row: any) => void) => {
          if (!who) return
          if (who === viewer) {
            const res = await fetch('/api/profile/me')
            if (!res.ok) return
            const body = await res.json().catch(() => ({}))
            if (body.profile) apply(body.profile)
            return
          }
          const res = await fetch(`/api/contact/party?loadId=${encodeURIComponent(id)}&userId=${encodeURIComponent(who)}`)
          if (!res.ok) return
          const row = await res.json().catch(() => null)
          if (row) apply(row)
        }
        await pull(loadData.carrier_id, (row) => setCarrier((prev: any) => ({ ...prev, ...row })))
        await pull(loadData.matched_escort_id, (row) => setEscort((prev: any) => ({ ...prev, ...row })))
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
    const res = await fetch('/api/bids', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ load_id: id, rate: parseFloat(bidRate) }),
    })
    const result = await res.json().catch(() => ({} as any))
    if (!res.ok) { setBidStatus('Error: ' + (result.error || 'Could not place the bid')); return }
    setBidStatus('Bid placed successfully!')
    const { data: b } = await supabase.from('bids').select('*').eq('load_id', id).order('rate', { ascending: false })
    setBids(b || [])
  }

  const submitClaim = async () => {
    if (!currentUser || claiming) return
    setClaiming(true)
    setClaimStatus('')
    const res = await fetch('/api/loads/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ load_id: id }),
    })
    const result = await res.json().catch(() => ({} as any))
    setClaiming(false)
    if (!res.ok) {
      setClaimStatus('Error: ' + (result.error || 'Could not claim load'))
      return
    }
    setClaimStatus('Claim sent — awaiting carrier approval.')
    const { data: loadData } = await supabase.from('loads').select('*').eq('id', id).single()
    setLoad(loadData)
  }

  if (loading) return (<><SiteHeader /><div className="ui-page"><div className="ui-wrap" style={{ textAlign: 'center' }}><p className="ui-meta">Loading...</p></div></div></>)
  if (!load || blockedPoster) return (
    <>
      <SiteHeader />
      <div className="ui-page">
        <div className="ui-wrap">
          <EmptyState title="Load not found" text="This load is not on the board." action={<Link href="/open-loads" className="ui-btn">Back to the board</Link>} />
        </div>
      </div>
    </>
  )

  const isCarrier = userProfile?.role === 'carrier'
  const isEscort = userProfile?.role === 'escort' || userProfile?.role === 'fleet_manager'
  const isAdmin = isAdminEmail(currentUser?.email) || userProfile?.role === 'admin'
  const isMatchedEscort = currentUser && load.matched_escort_id === currentUser.id
  const isOwnerCarrier = currentUser && load.carrier_id === currentUser.id
  const contactOpen = load.status === 'filled' || load.status === 'pending_match'
  const canSeeFull = contactOpen && (isMatchedEscort || isOwnerCarrier || isAdmin)
  const isBidType = load.board_type === 'bid' || load.board_type === 'open-bid'
  const isFlatClaimable = !isBidType && load.status === 'open' && isEscort

  const statusClass = load.status === 'open' ? 'ui-badge blue' : load.status === 'filled' ? 'ui-badge green' : 'ui-badge red'

  return (
    <>
      <SiteHeader />
      <div className="ui-page">
        <div className="ui-wrap" style={{ maxWidth: 760 }}>
          <Link href="/open-loads" className="ui-back">← Back to Board</Link>
          <PageTitle
            eyebrow="Loads"
            title="Load details"
            lead={`${load.pu_city}, ${load.pu_state} → ${load.dl_city}, ${load.dl_state}`}
            right={<span className={statusClass}>{load.status?.toUpperCase()}</span>}
          />

          <div className="ui-stack">
        <div className="ui-card">
          {[
            ['Route', `${load.pu_city}, ${load.pu_state} → ${load.dl_city}, ${load.dl_state}`],
            ['Escort Type', load.escort_type],
            ['Escort Qty', load.escort_count ?? 1],
            ['Load Type', load.load_type],
            ['Board Type', load.board_type],
            ['Rate', load.per_mile_rate != null ? `$${load.per_mile_rate}/mi` : '—'],
            ['Date Needed', load.start_date ?? '—'],
            ['Posted', new Date(load.created_at).toLocaleDateString()],
          ].map(([k, v]) => (
            <div key={String(k)} className="ui-kv">
              <span className="k">{k}</span>
              <span className="v">{String(v)}</span>
            </div>
          ))}
          {load.notes && (
            <div style={{ marginTop: 12 }}>
              <p className="ui-label">Notes</p>
              <p className="ui-note" style={{ marginTop: 4 }}>{load.notes}</p>
            </div>
          )}
        </div>

        <div className="ui-card">
          <h2>Carrier Info</h2>
          <p className="ui-note" style={{ color: '#fff' }}>{carrier?.full_name ?? 'Anonymous Carrier'}</p>
          {canSeeFull && (
            <>
              <p className="ui-note" style={{ marginTop: 4, color: '#fff' }}>📞 {carrier?.phone ?? '—'}</p>
              <p className="ui-note" style={{ marginTop: 4, color: '#fff' }}>✉️ {carrier?.email ?? '—'}</p>
            </>
          )}
          {!canSeeFull && <p className="ui-note" style={{ marginTop: 4 }}>Contact info shown after match is confirmed.</p>}
        </div>

        {load.status === 'pending_match' && isMatchedEscort && (
          <div className="ui-card warn">
            <p className="ui-v or" style={{ fontSize: 16 }}>⏳ Awaiting carrier approval</p>
            <p className="ui-note" style={{ marginTop: 4 }}>The carrier is reviewing your match request.</p>
          </div>
        )}

        {canSeeFull && escort && !isMatchedEscort && (isOwnerCarrier || isAdmin) && (
          <div className="ui-card good">
            <h2 style={{ color: 'var(--ui-green)' }}>✅ Matched Escort</h2>
            <p className="ui-note" style={{ color: '#fff' }}>{escort.full_name}</p>
            <p className="ui-note" style={{ marginTop: 4, color: '#fff' }}>📞 {escort.phone ?? '—'}</p>
            <p className="ui-note" style={{ marginTop: 4, color: '#fff' }}>✉️ {escort.email ?? '—'}</p>
          </div>
        )}

        {isFlatClaimable && (() => {
          const level = getAccessLevel(userProfile?.tier, isAdmin)
          if (level === 'none') {
            return (
              <div className="ui-card">
                <h2>Claim this Load</h2>
                <p className="ui-note" style={{ marginBottom: 12 }}>Claiming requires a paid escort plan.</p>
                <Link href="/pricing" className="ui-btn">Upgrade to Member →</Link>
              </div>
            )
          }
          const dhUntil = load.deadhead_notified_at
            ? Date.parse(load.deadhead_notified_at) + 5 * 60 * 1000
            : 0
          const dhLocked = level !== 'instant' && dhUntil > now
          const secondsLeft = dhLocked
            ? Math.max(0, Math.ceil((dhUntil - now) / 1000))
            : level === 'delayed' ? secondsUntilClaimable(load.created_at, now) : 0
          const locked = secondsLeft > 0
          return (
            <div className="ui-card">
              <h2>Claim this Load</h2>
              <button
                onClick={submitClaim}
                disabled={locked || claiming}
                className={locked || claiming ? 'ui-btn dim' : 'ui-btn'}
              >
                {claiming ? 'Claiming…' : locked ? `Available in ${secondsLeft}s...` : 'Claim Load'}
              </button>
              {claimStatus && <p className={claimStatus.startsWith('Error') ? 'ui-err' : 'ui-ok'}>{claimStatus}</p>}
            </div>
          )
        })()}

        {isBidType && isEscort && load.status === 'open' && (() => {
          const level = getAccessLevel(userProfile?.tier, isAdmin)
          if (level === 'none') {
            return (
              <div className="ui-card">
                <h2>Place a Bid</h2>
                <p className="ui-note" style={{ marginBottom: 12 }}>Bidding requires a paid escort plan.</p>
                <Link href="/pricing" className="ui-btn">Upgrade to Member →</Link>
              </div>
            )
          }
          const secondsLeft = level === 'delayed' ? secondsUntilClaimable(load.created_at, now) : 0
          const locked = secondsLeft > 0
          return (
            <div className="ui-card">
              <h2>Place a Bid</h2>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                  type="number"
                  className="ui-input"
                  style={{ flex: '1 1 180px', minWidth: 0 }}
                  placeholder="Your rate ($)"
                  value={bidRate}
                  onChange={e => setBidRate(e.target.value)}
                />
                <button onClick={submitBid} disabled={locked} className={locked ? 'ui-btn dim' : 'ui-btn'}>{locked ? `Available in ${secondsLeft}s...` : 'Bid'}</button>
              </div>
              {bidStatus && <p className={bidStatus.startsWith('Error') ? 'ui-err' : 'ui-ok'}>{bidStatus}</p>}
            </div>
          )
        })()}

        {isBidType && (isOwnerCarrier || isMatchedEscort) && (
          <div className="ui-card">
            <h2>All Bids ({bids.length})</h2>
            {bids.length === 0 ? (
              <EmptyState title="No bids yet" text="Bids on this load will show up here." />
            ) : bids.map((b: any, i) => (
              <div key={b.id} className="ui-kv">
                <span className="k">Bid #{i + 1}</span>
                <span className={i === 0 ? 'ui-v or' : 'v'} style={{ fontSize: 16 }}>${b.rate}</span>
              </div>
            ))}
          </div>
        )}

        {currentUser && load.carrier_id !== currentUser.id && <ReportLoad loadId={load.id} />}
        {currentUser && load.carrier_id && load.carrier_id !== currentUser.id && <BlockUser userId={load.carrier_id} label="the poster" />}
          </div>
        </div>
      </div>
    </>
  )
}
