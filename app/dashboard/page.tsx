'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase , isAdminEmail} from '@/lib/supabase'

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
}

interface Load {
  id: string
  title: string
  pickup_city: string
  pickup_state: string
  dest_city: string
  dest_state: string
  date_needed: string
  status: string
}

interface Match {
  id: string
  load_id: string
  status: string
  loads: Load | null
}

export default function DashboardPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loads, setLoads] = useState<Load[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [completedLoads, setCompletedLoads] = useState<Load[]>([])
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
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/signin')
        return
      }
      const uid = session.user.id

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
                      {load.pickup_city}, {load.pickup_state} → {load.dest_city}, {load.dest_state}
                    </p>
                    <p style={{ margin: '4px 0 0', color: MUTED, fontSize: '0.875rem' }}>Needed: {load.date_needed}</p>
                  </div>
                ))}
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
                        {match.loads.pickup_city}, {match.loads.pickup_state} → {match.loads.dest_city}, {match.loads.dest_state}
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
                      {load.pickup_city}, {load.pickup_state} → {load.dest_city}, {load.dest_state}
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
          {/* Available Loads */}
          <section>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: ORANGE, marginBottom: '1rem' }}>Find Work</h2>
            <a
              href="/loads"
              style={{ display: 'inline-block', background: ORANGE, color: '#000', borderRadius: 6, padding: '10px 24px', fontWeight: 700, textDecoration: 'none' }}
            >
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
                <button
                  onClick={handleStripePortal}
                  style={{ background: ORANGE, color: '#000', border: 'none', borderRadius: 6, padding: '10px 24px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Manage Subscription
                </button>
              ) : (
                <a
                  href="/checkout"
                  style={{ display: 'inline-block', background: ORANGE, color: '#000', borderRadius: 6, padding: '10px 24px', fontWeight: 700, textDecoration: 'none' }}
                >
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
              <p style={{ margin: 0, fontWeight: 600 }}>{load.pickup_city}, {load.pickup_state} → {load.dest_city}, {load.dest_state}</p>
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
