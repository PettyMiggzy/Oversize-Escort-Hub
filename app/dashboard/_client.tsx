'use client'

import '@/app/globals.css'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { isAdminEmail } from '@/lib/supabase'
const BG = '#060b16'
const SURFACE = '#0d1117'
const ORANGE = '#f0a500'
const TEXT = '#e2e8f0'
const MUTED = '#6b7280'

interface Profile {
  membership?: string;
  email?: string;
  id: string
  role: string
  full_name: string | null
  company_name: string | null
  stripe_customer_id: string | null
  fmcsa_verified?: boolean | null
}

interface Load {
  id: string
  title: string
  pu_city: string
  pu_state: string
  dl_city: string
  dl_state: string
  date_needed: string
  status: string
}

interface Match {
  id: string
  load_id: string
  status: string
  loads: Load | null
}

export function DashboardPageClient() {
  const supabase = createClient()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loads, setLoads] = useState<Load[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [completedLoads, setCompletedLoads] = useState<Load[]>([])
  const [bids, setBids] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [actionMsg, setActionMsg] = useState('')
  const [deadheadModal, setDeadheadModal] = useState<{loadId: string} | null>(null)
  const [dhCity, setDhCity] = useState('')
  const [dhState, setDhState] = useState('')
  const [dhSubmitting, setDhSubmitting] = useState(false)
  const [deadheadOpps, setDeadheadOpps] = useState<any[]>([])

  useEffect(() => {
    const init = async () => {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search)
    if (params.get('upgraded') === 'true') {
      setActionMsg('Subscription activated! Your account has been upgraded.')
      setTimeout(() => setActionMsg(''), 5000)
      window.history.replaceState({}, '', window.location.pathname)
    }
  }
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/signin')
        return
      }
      const uid = user.id

      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .single()

      if (!prof) {
        setLoading(false)
        return
      }
      setProfile(prof)

      const { count } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', uid)
        .eq('read', false)
      setUnreadCount(count ?? 0)

      if (prof.role === 'carrier' || prof.role === 'admin') {
        const { data: openLoads } = await supabase
          .from('loads')
          .select('*')
          .eq('carrier_id', uid)
          .eq('status', 'open')
          .order('created_at', { ascending: false })
        setLoads(openLoads ?? [])

        // Fetch pending bids for carrier's open loads
        const loadIds = (openLoads ?? []).map((l: any) => l.id)
        if (loadIds.length > 0) {
          const { data: bidsData } = await supabase
            .from('bids')
            .select('*, profiles!escort_id(full_name, bgc_verified, rating, phone)')
            .in('load_id', loadIds)
            .eq('status', 'pending')
            .order('rate', { ascending: false })
          setBids(bidsData ?? [])
        } else {
          setBids([])
        }

        const { data: pendingMatches } = await supabase
          .from('matches')
          .select('*, loads(*)')
          .eq('carrier_id', uid)
          .eq('status', 'pending_match')
          .order('created_at', { ascending: false })
        setMatches(pendingMatches ?? [])

        const { data: done } = await supabase
          .from('loads')
          .select('*')
          .eq('carrier_id', uid)
          .eq('status', 'matched')
          .order('created_at', { ascending: false })
          .limit(10)
        setCompletedLoads(done ?? [])
      }

      setLoading(false)
    }
    init()
  }, [router])

  const refreshBids = async () => {
    const loadIds = loads.map(l => l.id)
    if (loadIds.length === 0) { setBids([]); return }
    const { data } = await supabase
      .from('bids')
      .select('*, profiles!escort_id(full_name, bgc_verified, rating, phone)')
      .in('load_id', loadIds)
      .eq('status', 'pending')
      .order('rate', { ascending: false })
    setBids(data ?? [])
  }

  const handleBidAccept = async (bid: any) => {
    setActionMsg('')
    const res = await fetch('/api/bids/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ load_id: bid.load_id, bid_id: bid.id, escort_id: bid.escort_id }),
    })
    if (res.ok) {
      setActionMsg('Bid accepted — escort notified.')
      await refreshBids()
    } else {
      const data = await res.json().catch(() => ({}))
      setActionMsg('Error: ' + (data.error || 'Failed to accept bid'))
    }
  }

  const handleBidReject = async (bid: any) => {
    setActionMsg('')
    const res = await fetch('/api/bids/reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bid_id: bid.id, load_id: bid.load_id }),
    })
    if (res.ok) {
      setActionMsg('Bid rejected.')
      await refreshBids()
    } else {
      const data = await res.json().catch(() => ({}))
      setActionMsg('Error: ' + (data.error || 'Failed to reject bid'))
    }
  }

  const handleMatchAction = async (matchId: string, action: 'accept' | 'decline', loadId?: string) => {
    setActionMsg('')
    const res = await fetch('/api/matches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchId, action }),
    })
    if (res.ok) {
      const data = await res.json()
      setMatches(prev => prev.filter(m => m.id !== matchId))
      setActionMsg(`Match ${action}ed.`)
      if (action === 'accept' && data.requiresDeadheadDestination && loadId) {
        setDeadheadModal({ loadId })
      }
    } else {
      setActionMsg('Action failed. Please try again.')
    }
  }

  const handleStripePortal = async () => {
    const res = await fetch('/api/stripe/portal', { method: 'POST' })
    if (res.ok) {
      const { url } = await res.json()
      if (url) window.location.href = url
    }
  }

  // DOT lookup (E2)
  const [dotInput, setDotInput] = useState('')
  const [dotLoading, setDotLoading] = useState(false)
  const [dotResult, setDotResult] = useState<any>(null)
  const [dotErr, setDotErr] = useState<string | null>(null)
  const [fmcsaVerifying, setFmcsaVerifying] = useState(false)

  const handleDotLookup = async () => {
    const dot = dotInput.trim()
    if (!dot) { setDotErr('Enter a DOT number.'); return }
    setDotLoading(true); setDotErr(null); setDotResult(null)
    try {
      const res = await fetch(`/api/fmcsa?dot=${encodeURIComponent(dot)}`)
      const data = await res.json()
      if (!res.ok || data?.verified === false) {
        setDotErr(data?.reason || data?.error || 'Lookup failed')
      } else {
        setDotResult(data)
      }
    } catch (e: any) {
      setDotErr(e?.message || 'Lookup failed')
    } finally {
      setDotLoading(false)
    }
  }

  const handleMarkFmcsaVerified = async () => {
    if (!profile) return
    setFmcsaVerifying(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          fmcsa_verified: true,
          dot_number: dotResult?.dotNumber ?? null,
          mc_number: dotResult?.mcNumber ?? null,
          company_name: profile.company_name || dotResult?.legalName || null,
        })
        .eq('id', profile.id)
      if (error) { setDotErr(error.message); return }
      setProfile({ ...profile, company_name: profile.company_name || dotResult?.legalName || null, fmcsa_verified: true })
      setActionMsg('FMCSA verified — profile updated.')
    } finally {
      setFmcsaVerifying(false)
    }
  }

  // Invoice download (E3)
  const handleDownloadInvoice = async (loadId: string) => {
    try {
      const res = await fetch('/api/invoices/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ load_id: loadId }),
      })
      const { pdf, error } = await res.json()
      if (!res.ok || !pdf) { setActionMsg(error || 'Invoice failed'); return }
      const link = document.createElement('a')
      link.href = pdf
      link.download = `OEH-Invoice-${loadId.slice(0, 8)}.pdf`
      link.click()
    } catch (e: any) {
      setActionMsg(e?.message || 'Invoice failed')
    }
  }

  // ==== ESCORT DASHBOARD STATE ====
  const [escortJobs, setEscortJobs] = useState<any[]>([])
  const [earnings, setEarnings] = useState<{month: number; lifetime: number; jobsCount: number} | null>(null)
  const [expenses, setExpenses] = useState<any[]>([])
  const [expKind, setExpKind] = useState<'mileage'|'fuel'|'lodging'|'meal'|'toll'|'other'>('mileage')
  const [expAmount, setExpAmount] = useState('')
  const [expMiles, setExpMiles] = useState('')
  const [expNote, setExpNote] = useState('')
  const [expSubmitting, setExpSubmitting] = useState(false)
  const [breakdownOn, setBreakdownOn] = useState<boolean>(false)
  const [breakdownSaving, setBreakdownSaving] = useState(false)

  useEffect(() => {
    if (!profile) return
    if (!(profile.role === 'escort' || profile.role === 'pro')) return
    const loadEscort = async () => {
      const { data: acceptedBids } = await supabase
        .from('bids')
        .select('id, rate, created_at, load_id, status, loads:load_id(id, title, pu_city, pu_state, dl_city, dl_state, date_needed, status)')
        .eq('escort_id', profile.id)
        .eq('status', 'accepted')
        .order('created_at', { ascending: false })
      setEscortJobs(acceptedBids ?? [])
      try {
        const r = await fetch('/api/escort/earnings'); const d = await r.json()
        if (r.ok) setEarnings({ month: d.month, lifetime: d.lifetime, jobsCount: d.jobsCount })
      } catch {}
      try {
        const r = await fetch('/api/expenses'); const d = await r.json()
        if (r.ok) setExpenses(d.expenses ?? [])
      } catch {}
      setBreakdownOn(Boolean((profile as any).breakdown_protocol_enabled))
    }
    loadEscort()
  }, [profile])

  const handleAddExpense = async () => {
    setActionMsg('')
    if (!expAmount) { setActionMsg('Amount required'); return }
    setExpSubmitting(true)
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: expKind, amount: Number(expAmount), miles: expMiles || null, note: expNote || null }),
      })
      const d = await res.json()
      if (!res.ok) { setActionMsg(d.error || 'Failed to add expense'); return }
      setExpenses(prev => [d.expense, ...prev])
      setExpAmount(''); setExpMiles(''); setExpNote('')
      setActionMsg('Expense saved.')
    } finally { setExpSubmitting(false) }
  }

  const handleDeleteExpense = async (id: string) => {
    const res = await fetch('/api/expenses?id=' + encodeURIComponent(id), { method: 'DELETE' })
    if (res.ok) setExpenses(prev => prev.filter(e => e.id !== id))
  }

  const handleToggleBreakdown = async () => {
    setBreakdownSaving(true)
    const next = !breakdownOn
    try {
      const res = await fetch('/api/escort/breakdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: next }),
      })
      if (res.ok) setBreakdownOn(next)
      else setActionMsg('Failed to update breakdown protocol')
    } finally { setBreakdownSaving(false) }
  }


  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: MUTED }}>Loading dashboard…</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: MUTED }}>Profile not found.</p>
      </div>
    )
  }

  const isCarrier = profile.role === 'carrier' || profile.role === 'admin'
  const isEscort = profile.role === 'escort' || profile.role === 'pro'

  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT, padding: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: ORANGE, margin: 0 }}>
            Dashboard
          </h1>
          <p style={{ color: MUTED, margin: '4px 0 0', fontSize: '0.875rem' }}>
            {profile.full_name || profile.company_name || 'Welcome'} &mdash; {profile.role}
          </p>
        </div>
        {unreadCount > 0 && (
          <div style={{ background: ORANGE, color: '#000', borderRadius: '9999px', padding: '4px 12px', fontWeight: 700, fontSize: '0.875rem' }}>
            {unreadCount} unread
          </div>
        )}
      </div>

      {actionMsg && (
        <div style={{ background: SURFACE, border: `1px solid ${ORANGE}`, borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1.5rem', color: ORANGE }}>
          {actionMsg}
        </div>
      )}

      {/* CARRIER VIEW */}
      {isCarrier && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Verify DOT Number (E2) */}
          <section style={{ background: SURFACE, borderRadius: 8, padding: '1rem', border: '1px solid #1e2736' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: ORANGE, marginBottom: '0.75rem' }}>Verify DOT Number</h2>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <input
                value={dotInput}
                onChange={(e) => setDotInput(e.target.value)}
                placeholder="Enter DOT number"
                style={{ flex: 1, minWidth: 180, background: BG, border: '1px solid #1e2736', borderRadius: 6, color: TEXT, padding: '8px 12px', fontSize: 13 }}
              />
              <button
                onClick={handleDotLookup}
                disabled={dotLoading}
                style={{ background: ORANGE, color: '#000', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 700, cursor: dotLoading ? 'default' : 'pointer', fontSize: 13 }}
              >
                {dotLoading ? 'Looking up…' : 'Look Up'}
              </button>
            </div>
            {dotErr && <p style={{ color: '#fca5a5', fontSize: 12, marginTop: '0.5rem' }}>{dotErr}</p>}
            {dotResult && (
              <div style={{ marginTop: '0.75rem', fontSize: 13, color: TEXT, display: 'grid', gap: 4 }}>
                <div><strong>{dotResult.legalName || '—'}</strong></div>
                <div style={{ color: MUTED }}>DOT: {dotResult.dotNumber || '—'} | MC: {dotResult.mcNumber || '—'}</div>
                <div style={{ color: MUTED }}>Status: {dotResult.operatingStatus || '—'}{dotResult.outOfService ? ` (OOS since ${dotResult.outOfService})` : ''}</div>
                {dotResult.operatingStatus === 'active' && !profile?.fmcsa_verified && (
                  <button
                    onClick={handleMarkFmcsaVerified}
                    disabled={fmcsaVerifying}
                    style={{ marginTop: 6, background: 'transparent', color: ORANGE, border: `1px solid ${ORANGE}`, borderRadius: 6, padding: '6px 12px', cursor: fmcsaVerifying ? 'default' : 'pointer', fontSize: 12, fontWeight: 600, alignSelf: 'flex-start' }}
                  >
                    {fmcsaVerifying ? 'Updating…' : 'Mark as FMCSA Verified'}
                  </button>
                )}
                {profile?.fmcsa_verified && (
                  <div style={{ color: '#22c55e', fontSize: 12, marginTop: 4 }}>✓ Already FMCSA verified</div>
                )}
              </div>
            )}
          </section>
          {/* Active Loads */}
          <section>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: ORANGE, marginBottom: '1rem' }}>
              Active Loads ({loads.length})
            </h2>
            {loads.length === 0 ? (
              <p style={{ color: MUTED }}>No active loads.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {loads.map(load => (
                  <div key={load.id} style={{ background: SURFACE, borderRadius: 8, padding: '1rem', border: '1px solid #1e2736' }}>
                    <p style={{ margin: 0, fontWeight: 600 }}>{load.title || 'Load'}</p>
                    <p style={{ margin: '4px 0 0', color: MUTED, fontSize: '0.875rem' }}>
                      {load.pu_city}, {load.pu_state} → {load.dl_city}, {load.dl_state}
                    </p>
                    <p style={{ margin: '4px 0 0', color: MUTED, fontSize: '0.875rem' }}>Needed: {load.date_needed}</p>
                    <div style={{ marginTop: 8 }}>
                      <button onClick={() => handleDownloadInvoice(load.id)} style={{ fontSize: 11, color: '#f0a500', background: 'none', border: '1px solid #f0a500', borderRadius: 4, padding: '3px 10px', cursor: 'pointer' }}>
                        📄 Invoice
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Pending Bids */}
          <section>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: ORANGE, marginBottom: '1rem' }}>
              Pending Bids ({bids.length})
            </h2>
            {bids.length === 0 ? (
              <p style={{ color: MUTED }}>No pending bids.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {bids.map((bid: any) => {
                  const load = loads.find(l => l.id === bid.load_id)
                  const prof = bid.profiles || {}
                  return (
                    <div key={bid.id} style={{ background: SURFACE, borderRadius: 8, padding: '1rem', border: '1px solid #1e2736' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                        <div>
                          <p style={{ margin: 0, fontWeight: 600 }}>
                            {prof.full_name || 'Escort'}
                            {prof.bgc_verified && (
                              <span style={{ marginLeft: 8, fontSize: 11, color: '#22c55e', border: '1px solid #22c55e', borderRadius: 4, padding: '2px 6px' }}>✓ BGC</span>
                            )}
                          </p>
                          <p style={{ margin: '4px 0 0', color: MUTED, fontSize: '0.875rem' }}>
                            {load ? (load.title || 'Load') + ' — ' + load.pu_city + ', ' + load.pu_state + ' → ' + load.dl_city + ', ' + load.dl_state : 'Load'}
                          </p>
                          {prof.rating != null && (
                            <p style={{ margin: '4px 0 0', color: MUTED, fontSize: '0.875rem' }}>★ {Number(prof.rating).toFixed(1)}</p>
                          )}
                          {bid.note && (
                            <p style={{ margin: '4px 0 0', color: TEXT, fontSize: '0.875rem', fontStyle: 'italic' }}>"{bid.note}"</p>
                          )}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ margin: 0, fontWeight: 700, fontSize: '1.25rem', color: ORANGE }}>${bid.rate}</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                        <button
                          onClick={() => handleBidAccept(bid)}
                          style={{ background: '#22c55e', color: '#000', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 700, cursor: 'pointer' }}
                        >✓ Accept</button>
                        <button
                          onClick={() => handleBidReject(bid)}
                          style={{ background: 'transparent', color: '#ef4444', border: '1px solid #ef4444', borderRadius: 6, padding: '8px 16px', fontWeight: 600, cursor: 'pointer' }}
                        >✗ Reject</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          {/* Pending Matches */}
          <section>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: ORANGE, marginBottom: '1rem' }}>
              Pending Matches ({matches.length})
            </h2>
            {matches.length === 0 ? (
              <p style={{ color: MUTED }}>No pending matches.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {matches.map(match => (
                  <div key={match.id} style={{ background: SURFACE, borderRadius: 8, padding: '1rem', border: '1px solid #1e2736' }}>
                    <p style={{ margin: 0, fontWeight: 600 }}>{match.loads?.title || 'Load'}</p>
                    {match.loads && (
                      <p style={{ margin: '4px 0 0', color: MUTED, fontSize: '0.875rem' }}>
                        {match.loads.pu_city}, {match.loads.pu_state} → {match.loads.dl_city}, {match.loads.dl_state}
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                      <button
                        onClick={() => handleMatchAction(match.id, 'accept', match.load_id)}
                        style={{ background: ORANGE, color: '#000', border: 'none', borderRadius: 6, padding: '6px 16px', fontWeight: 700, cursor: 'pointer' }}
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleMatchAction(match.id, 'decline')}
                        style={{ background: 'transparent', color: MUTED, border: `1px solid ${MUTED}`, borderRadius: 6, padding: '6px 16px', cursor: 'pointer' }}
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Completed Loads */}
          <section>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: ORANGE, marginBottom: '1rem' }}>
              Completed Loads ({completedLoads.length})
            </h2>
            {completedLoads.length === 0 ? (
              <p style={{ color: MUTED }}>No completed loads yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {completedLoads.map(load => (
                  <div key={load.id} style={{ background: SURFACE, borderRadius: 8, padding: '1rem', border: '1px solid #1e2736', opacity: 0.75 }}>
                    <p style={{ margin: 0, fontWeight: 600 }}>{load.title || 'Load'}</p>
                    <p style={{ margin: '4px 0 0', color: MUTED, fontSize: '0.875rem' }}>
                      {load.pu_city}, {load.pu_state} → {load.dl_city}, {load.dl_state}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* ESCORT / PRO VIEW */}
      {isEscort && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Earnings */}
          <section>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: ORANGE, marginBottom: '1rem' }}>Earnings</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
              <div style={{ background: SURFACE, borderRadius: 8, padding: '1rem', border: '1px solid #1e2736' }}>
                <p style={{ margin: 0, color: MUTED, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 1 }}>This Month</p>
                <p style={{ margin: '6px 0 0', fontSize: '1.5rem', fontWeight: 700, color: ORANGE }}>${earnings ? earnings.month.toFixed(2) : '0.00'}</p>
              </div>
              <div style={{ background: SURFACE, borderRadius: 8, padding: '1rem', border: '1px solid #1e2736' }}>
                <p style={{ margin: 0, color: MUTED, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 1 }}>Lifetime</p>
                <p style={{ margin: '6px 0 0', fontSize: '1.5rem', fontWeight: 700, color: ORANGE }}>${earnings ? earnings.lifetime.toFixed(2) : '0.00'}</p>
              </div>
              <div style={{ background: SURFACE, borderRadius: 8, padding: '1rem', border: '1px solid #1e2736' }}>
                <p style={{ margin: 0, color: MUTED, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 1 }}>Jobs Completed</p>
                <p style={{ margin: '6px 0 0', fontSize: '1.5rem', fontWeight: 700, color: ORANGE }}>{earnings ? earnings.jobsCount : 0}</p>
              </div>
            </div>
          </section>

          {/* Active Jobs */}
          <section>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: ORANGE, marginBottom: '1rem' }}>Active Jobs ({escortJobs.length})</h2>
            {escortJobs.length === 0 ? (
              <p style={{ color: MUTED }}>No active jobs. <a href="/loads" style={{ color: ORANGE }}>Browse available loads →</a></p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {escortJobs.map((bid: any) => {
                  const ld = bid.loads || {}
                  return (
                    <div key={bid.id} style={{ background: SURFACE, borderRadius: 8, padding: '1rem', border: '1px solid #1e2736' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                        <div>
                          <p style={{ margin: 0, fontWeight: 600 }}>{ld.title || 'Load'}</p>
                          <p style={{ margin: '4px 0 0', color: MUTED, fontSize: '0.875rem' }}>
                            {ld.pu_city || '—'}, {ld.pu_state || ''} → {ld.dl_city || '—'}, {ld.dl_state || ''}
                          </p>
                          {ld.date_needed && <p style={{ margin: '4px 0 0', color: MUTED, fontSize: '0.875rem' }}>Needed: {ld.date_needed}</p>}
                        </div>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: '1.25rem', color: ORANGE }}>${Number(bid.rate).toFixed(2)}</p>
                      </div>
                      {ld.id && (
                        <div style={{ marginTop: 8 }}>
                          <button onClick={() => handleDownloadInvoice(ld.id)} style={{ fontSize: 11, color: ORANGE, background: 'none', border: '1px solid ' + ORANGE, borderRadius: 4, padding: '3px 10px', cursor: 'pointer' }}>
                            📄 Invoice
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          {/* Mileage / Expense Tracker */}
          <section>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: ORANGE, marginBottom: '1rem' }}>Mileage &amp; Expenses</h2>
            <div style={{ background: SURFACE, borderRadius: 8, padding: '1rem', border: '1px solid #1e2736' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.5rem' }}>
                <select value={expKind} onChange={e => setExpKind(e.target.value as any)} style={{ background: BG, border: '1px solid #1e2736', borderRadius: 6, color: TEXT, padding: '8px', fontSize: 13 }}>
                  <option value="mileage">Mileage</option>
                  <option value="fuel">Fuel</option>
                  <option value="lodging">Lodging</option>
                  <option value="meal">Meal</option>
                  <option value="toll">Toll</option>
                  <option value="other">Other</option>
                </select>
                <input value={expAmount} onChange={e => setExpAmount(e.target.value)} placeholder="Amount $" type="number" step="0.01" style={{ background: BG, border: '1px solid #1e2736', borderRadius: 6, color: TEXT, padding: '8px', fontSize: 13 }} />
                <input value={expMiles} onChange={e => setExpMiles(e.target.value)} placeholder="Miles (opt)" type="number" style={{ background: BG, border: '1px solid #1e2736', borderRadius: 6, color: TEXT, padding: '8px', fontSize: 13 }} />
                <input value={expNote} onChange={e => setExpNote(e.target.value)} placeholder="Note" style={{ background: BG, border: '1px solid #1e2736', borderRadius: 6, color: TEXT, padding: '8px', fontSize: 13 }} />
                <button onClick={handleAddExpense} disabled={expSubmitting} style={{ background: ORANGE, color: '#000', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 700, cursor: expSubmitting ? 'default' : 'pointer', fontSize: 13 }}>
                  {expSubmitting ? 'Saving…' : 'Add'}
                </button>
              </div>
              {expenses.length > 0 && (
                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {expenses.map((ex: any) => (
                    <div key={ex.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: BG, borderRadius: 6, border: '1px solid #1e2736' }}>
                      <div style={{ fontSize: 13 }}>
                        <strong style={{ color: ORANGE, textTransform: 'capitalize' }}>{ex.kind}</strong>
                        <span style={{ color: MUTED, marginLeft: 8 }}>{ex.incurred_on}</span>
                        {ex.miles ? <span style={{ color: MUTED, marginLeft: 8 }}>{ex.miles}mi</span> : null}
                        {ex.note ? <span style={{ color: TEXT, marginLeft: 8, fontStyle: 'italic' }}>— {ex.note}</span> : null}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 700, color: ORANGE }}>${Number(ex.amount).toFixed(2)}</span>
                        <button onClick={() => handleDeleteExpense(ex.id)} style={{ background: 'transparent', color: '#ef4444', border: 'none', cursor: 'pointer', fontSize: 14 }}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {expenses.length === 0 && <p style={{ color: MUTED, fontSize: 13, marginTop: 12, marginBottom: 0 }}>No expenses logged yet.</p>}
            </div>
          </section>

          {/* Breakdown Protocol Toggle */}
          <section>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: ORANGE, marginBottom: '1rem' }}>Breakdown Protocol</h2>
            <div style={{ background: SURFACE, borderRadius: 8, padding: '1rem', border: '1px solid #1e2736', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <p style={{ margin: 0, fontWeight: 600 }}>{breakdownOn ? 'Enabled' : 'Disabled'}</p>
                <p style={{ margin: '4px 0 0', color: MUTED, fontSize: '0.875rem' }}>When enabled, you receive automated breakdown alerts and route safety prompts during active jobs.</p>
              </div>
              <button onClick={handleToggleBreakdown} disabled={breakdownSaving} style={{ background: breakdownOn ? '#22c55e' : 'transparent', color: breakdownOn ? '#000' : ORANGE, border: '1px solid ' + (breakdownOn ? '#22c55e' : ORANGE), borderRadius: 6, padding: '8px 20px', fontWeight: 700, cursor: breakdownSaving ? 'default' : 'pointer', fontSize: 13 }}>
                {breakdownSaving ? 'Saving…' : breakdownOn ? 'Turn Off' : 'Turn On'}
              </button>
            </div>
          </section>

          {/* Find Work */}
          <section>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: ORANGE, marginBottom: '1rem' }}>Find Work</h2>
            <a href="/loads" style={{ display: 'inline-block', background: ORANGE, color: '#000', borderRadius: 6, padding: '10px 24px', fontWeight: 700, textDecoration: 'none' }}>
              Browse Available Loads
            </a>
          </section>

          {/* Profile Summary */}
          <section>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: ORANGE, marginBottom: '1rem' }}>Profile</h2>
            <div style={{ background: SURFACE, borderRadius: 8, padding: '1rem', border: '1px solid #1e2736' }}>
              <p style={{ margin: 0 }}><span style={{ color: MUTED }}>Name:</span> {profile.full_name || '—'}</p>
              <p style={{ margin: '8px 0 0' }}><span style={{ color: MUTED }}>Role:</span> {profile.role}</p>
              <a href="/profile" style={{ display: 'inline-block', marginTop: '0.75rem', color: ORANGE, fontSize: '0.875rem' }}>Edit Profile →</a>
            </div>
          </section>

          {/* Subscription */}
          <section>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: ORANGE, marginBottom: '1rem' }}>Subscription</h2>
            <div style={{ background: SURFACE, borderRadius: 8, padding: '1rem', border: '1px solid #1e2736', textAlign: 'center', marginTop: 8 }}>
              {profile.stripe_customer_id ? (
                <button onClick={handleStripePortal} style={{ background: ORANGE, color: '#000', border: 'none', borderRadius: 6, padding: '10px 24px', fontWeight: 700, cursor: 'pointer' }}>
                  Manage Subscription
                </button>
              ) : (
                <a href="/checkout" style={{ display: 'inline-block', background: ORANGE, color: '#000', borderRadius: 6, padding: '10px 24px', fontWeight: 700, textDecoration: 'none' }}>
                  Upgrade to Pro
                </a>
              )}
            </div>
          </section>
        </div>
      )}

      {!isCarrier && !isEscort && (
        <p style={{ color: MUTED }}>Unrecognized role: {profile.role}</p>
      )}

      {/* Deadhead Destination Modal */}
      {deadheadModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#1e2736', borderRadius: 12, padding: '2rem', width: '100%', maxWidth: 400 }}>
            <h2 style={{ color: '#f59e0b', margin: '0 0 0.5rem' }}>🚛 Where do you want to end up?</h2>
            <p style={{ color: '#94a3b8', marginBottom: '1.5rem', fontSize: '0.875rem' }}>After this job — so we can match you with nearby loads.</p>
            <input
              placeholder="City"
              value={dhCity}
              onChange={e => setDhCity(e.target.value)}
              style={{ width: '100%', padding: '0.6rem', borderRadius: 6, border: '1px solid #334155', background: '#0f172a', color: '#e2e8f0', marginBottom: '0.75rem', boxSizing: 'border-box' as const }}
            />
            <input
              placeholder="State (e.g. TX)"
              value={dhState}
              onChange={e => setDhState(e.target.value)}
              style={{ width: '100%', padding: '0.6rem', borderRadius: 6, border: '1px solid #334155', background: '#0f172a', color: '#e2e8f0', marginBottom: '1rem', boxSizing: 'border-box' as const }}
            />
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                disabled={dhSubmitting || !dhCity || !dhState}
                onClick={async () => {
                  setDhSubmitting(true)
                  await fetch(`/api/loads/${deadheadModal.loadId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ deadhead_destination_city: dhCity, deadhead_destination_state: dhState }),
                  })
                  setDeadheadModal(null)
                  setDhCity('')
                  setDhState('')
                  setDhSubmitting(false)
                }}
                style={{ flex: 1, padding: '0.6rem', background: '#f59e0b', color: '#000', border: 'none', borderRadius: 6, fontWeight: 700, cursor: 'pointer' }}
              >
                {dhSubmitting ? 'Saving…' : 'Save Destination'}
              </button>
              <button onClick={() => setDeadheadModal(null)} style={{ padding: '0.6rem 1rem', background: '#334155', color: '#e2e8f0', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                Skip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deadhead Opportunities - Pro/Fleet only */}
      {(profile?.membership === 'pro' || profile?.role === 'fleet' || isAdminEmail(profile?.email)) && deadheadOpps.length > 0 && (
        <section style={{ marginTop: '2rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f59e0b', marginBottom: '1rem' }}>🚛 Deadhead Opportunities</h2>
          {deadheadOpps.map((load: any) => (
            <div key={load.id} style={{ background: '#1e2736', borderRadius: 8, padding: '1rem', marginBottom: '0.75rem', border: '1px solid #334155' }}>
              <p style={{ margin: 0, fontWeight: 600 }}>{load.pu_city}, {load.pu_state} → {load.dl_city}, {load.dl_state}</p>
              <p style={{ margin: '0.25rem 0 0', color: '#94a3b8', fontSize: '0.875rem' }}>${load.rate} &bull; {load.escort_type}</p>
              <a href={`/loads/${load.id}`} style={{ color: '#f59e0b', fontSize: '0.875rem', display: 'inline-block', marginTop: '0.5rem' }}>Claim load →</a>
            </div>
          ))}
        </section>
      )}
      {(profile?.membership !== 'pro' && profile?.role !== 'fleet' && !isAdminEmail(profile?.email)) && isEscort && (
        <section style={{ marginTop: '2rem', padding: '1rem', background: '#1e2736', borderRadius: 8, border: '1px solid #334155' }}>
          <p style={{ margin: 0, color: '#94a3b8' }}>🚛 <strong style={{ color: '#f59e0b' }}>Deadhead Opportunities</strong> — available to Pro and Fleet members. <a href="/pricing" style={{ color: '#f59e0b' }}>Upgrade to Pro</a></p>
        </section>
      )}
    </div>
  )
}
