'use client'
import '@/app/globals.css'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isAdminEmail } from '@/lib/supabase'
import SiteHeader from '@/components/SiteHeader'
import PageTitle from '@/components/PageTitle'
import EmptyState from '@/components/EmptyState'
import { VERIFICATION_LIVE } from '@/lib/verification'


export function FleetDashboardPageClient() {
  const [loading, setLoading] = useState(true)
  const [fleetEscorts, setFleetEscorts] = useState<any[]>([])
  const [activeLoads, setActiveLoads] = useState<any[]>([])
  const [deadheadOpps, setDeadheadOpps] = useState<any[]>([])
  const [addEmail, setAddEmail] = useState('')
  const [addStatus, setAddStatus] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      setUserId(user.id)
      setUserEmail(user.email ?? null)
      await loadData(user.id)
      setLoading(false)
    }
    init()
  }, [])

  const loadData = async (uid: string) => {
    // Fleet escorts with profile join
    const { data: escorts } = await supabase
      .from('fleet_escorts')
      .select('*, profiles!fleet_escorts_escort_id_fkey(full_name, tier, bgc_verified, rating)')
      .eq('fleet_manager_id', uid)
    setFleetEscorts(escorts || [])

    // Active loads where matched_escort_id is in fleet
    const escortIds = (escorts || []).map((e: any) => e.escort_id).filter(Boolean)
    if (escortIds.length > 0) {
      const { data: loads } = await supabase
        .from('loads')
        .select('*')
        .in('matched_escort_id', escortIds)
        .not('status', 'eq', 'expired')
      setActiveLoads(loads || [])
    }

    // Deadhead exclusive window (boards hide these for 5 minutes)
    const since = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    const { data: dhLoads } = await supabase
      .from('loads')
      .select('id, pu_city, pu_state, dl_city, dl_state, per_mile_rate, escort_type, deadhead_notified_at')
      .eq('status', 'open')
      .not('deadhead_notified_at', 'is', null)
      .gte('deadhead_notified_at', since)
      .order('deadhead_notified_at', { ascending: false })
      .limit(20)
    setDeadheadOpps(dhLoads || [])
  }

  const addEscort = async () => {
    if (!addEmail.trim() || !userId) return
    setAddStatus('Looking up...')
    const lookupRes = await fetch('/api/contact/lookup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: addEmail.trim() }),
    })
    const lookupBody = await lookupRes.json().catch(() => ({}))
    const profile = lookupRes.ok ? lookupBody.profile : null

    if (!profile) { setAddStatus(lookupBody.error || 'User not found.'); return }
    if (profile.role !== 'escort' && !isAdminEmail(userEmail ?? undefined)) { setAddStatus('User is not an escort.'); return }

    const { error } = await supabase.from('fleet_escorts').insert({
      fleet_manager_id: userId,
      escort_id: profile.id
    })
    if (error) { setAddStatus('Error: ' + error.message); return }
    setAddStatus('Added: ' + profile.full_name)
    setAddEmail('')
    await loadData(userId)
  }

  const removeEscort = async (escortId: string) => {
    if (!userId) return
    await supabase.from('fleet_escorts').delete().eq('fleet_manager_id', userId).eq('escort_id', escortId)
    setFleetEscorts(prev => prev.filter((e: any) => e.escort_id !== escortId))
  }

  if (loading) return (<><SiteHeader /><div className="ui-page"><div className="ui-wrap" style={{ textAlign: 'center' }}><p className="ui-meta">Loading...</p></div></div></>)

  return (
    <>
      <SiteHeader />
      <div className="ui-page">
      <div className="ui-wrap">
        <PageTitle eyebrow="Fleet" title="Fleet dashboard" lead="Escorts on your fleet, the loads they are on, and a short earnings summary." />
        <div className="ui-stack">

        {deadheadOpps.length > 0 && (
          <div className="ui-card warn">
            <h2>Deadhead opportunities</h2>
            <p className="ui-note" style={{ marginBottom: 12 }}>Exclusive 5-minute window — claim before Members see these loads.</p>
            <div className="ui-stack">
            {deadheadOpps.map((load: any) => (
              <div key={load.id} className="ui-load">
                <p className="ui-route" style={{ margin: 0 }}>{load.pu_city}, {load.pu_state} → {load.dl_city}, {load.dl_state}</p>
                <p className="ui-meta" style={{ margin: '4px 0 0' }}>${load.per_mile_rate ?? '—'}{load.per_mile_rate != null ? '/mi' : ''} · {load.escort_type}</p>
                <a href={`/loads/${load.id}`} className="ui-btn" style={{ marginTop: 8 }}>Claim load →</a>
              </div>
            ))}
            </div>
          </div>
        )}

        <div className="ui-card">
          <h2>Fleet escorts ({fleetEscorts.length})</h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            <input className="ui-input" style={{ flex: '1 1 200px', minWidth: 0 }} placeholder="Escort email to add..." value={addEmail} onChange={e => setAddEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && addEscort()} />
            <button onClick={addEscort} className="ui-btn">Add Escort</button>
          </div>
          {addStatus && <p className={addStatus.startsWith('Error') ? 'ui-err' : 'ui-ok'}>{addStatus}</p>}
          {fleetEscorts.length === 0 ? (
            <EmptyState title="No escorts in your fleet yet" text="Add them by email above." />
          ) : (
            <div className="ui-stack">
              {fleetEscorts.map((e: any) => (
                <div key={e.escort_id} className="ui-load">
                  <div className="ui-route" style={{ fontSize: 16 }}>{e.profiles?.full_name ?? '—'}</div>
                  <div className="ui-meta" style={{ marginTop: 6 }}>Tier: {e.profiles?.tier ?? '—'}{VERIFICATION_LIVE ? ` · BGC: ${e.profiles?.bgc_verified ? '✅' : '—'}` : ''}</div>
                  <button onClick={() => removeEscort(e.escort_id)} className="ui-btn danger" style={{ marginTop: 10 }}>Remove</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="ui-card">
          <h2>Active loads ({activeLoads.length})</h2>
          {activeLoads.length === 0 ? (
            <EmptyState title="No active loads" text="No active loads for your fleet escorts." />
          ) : (
            <div className="ui-stack">
              {activeLoads.map((l: any) => (
                <div key={l.id} className="ui-load">
                  <div className="ui-route">{l.pu_city}, {l.pu_state} → {l.dl_city}, {l.dl_state}</div>
                  <div className="ui-meta" style={{ marginTop: 6 }}>{l.escort_type ?? '—'} · <span className="ui-badge blue">{l.status}</span></div>
                  <div className="ui-v or" style={{ fontSize: 18, marginTop: 8 }}>${l.per_mile_rate ?? '—'}</div>
                  <div className="ui-meta">{l.start_date ?? '—'}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="ui-card">
          <h2>Fleet earnings summary</h2>
          <p className="ui-note">Completed loads: <strong className="ui-v or" style={{ fontSize: 16 }}>{activeLoads.filter(l => l.status === 'filled').length}</strong></p>
          <p className="ui-note">Est. total earned: <strong className="ui-v or" style={{ fontSize: 16 }}>${activeLoads.filter(l => l.status === 'filled').reduce((s: number, l: any) => s + (l.per_mile_rate ?? 0), 0).toFixed(2)}</strong></p>
        </div>
        </div>
      </div>
      </div>
    </>
  )
}
