'use client'
import '@/app/globals.css'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isAdminEmail } from '@/lib/supabase'


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

  const bg = '#0a0f1a'
  const card = { background: '#0f1a2e', border: '1px solid #1e3a5f', borderRadius: 10, padding: '20px 24px', marginBottom: 16 }
  const inp = { background: '#0f1a2e', border: '1px solid #1e3a5f', borderRadius: 6, color: '#e2e8f0', padding: '8px 12px', fontSize: 13 }
  const th = { textAlign: 'left' as const, padding: '8px 12px', fontSize: 11, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase' as const, borderBottom: '1px solid #1e3a5f' }
  const td = { padding: '10px 12px', fontSize: 13, color: '#e2e8f0', borderBottom: '1px solid rgba(30,58,95,0.4)' }

  if (loading) return <div style={{ background: bg, minHeight: '100vh', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>

  return (
    <div style={{ minHeight: '100vh', background: bg, color: '#fff' }}>
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Fleet Dashboard</h1>

        {deadheadOpps.length > 0 && (
          <div style={{ ...card, borderColor: '#f59e0b' }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#f59e0b', marginBottom: 12 }}>🚛 Deadhead Opportunities</h2>
            <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 12 }}>Exclusive 5-minute window — claim before Members see these loads.</p>
            {deadheadOpps.map((load: any) => (
              <div key={load.id} style={{ background: '#0a0f1a', borderRadius: 8, padding: 12, marginBottom: 8, border: '1px solid #1e3a5f' }}>
                <p style={{ margin: 0, fontWeight: 600 }}>{load.pu_city}, {load.pu_state} → {load.dl_city}, {load.dl_state}</p>
                <p style={{ margin: '4px 0 0', color: '#9ca3af', fontSize: 13 }}>${load.per_mile_rate ?? '—'}{load.per_mile_rate != null ? '/mi' : ''} · {load.escort_type}</p>
                <a href={`/loads/${load.id}`} style={{ color: '#f59e0b', fontSize: 13, display: 'inline-block', marginTop: 6 }}>Claim load →</a>
              </div>
            ))}
          </div>
        )}

        {/* Fleet Escorts */}
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600 }}>Fleet Escorts ({fleetEscorts.length})</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              <input style={{ ...inp, width: 220 }} placeholder="Escort email to add..." value={addEmail} onChange={e => setAddEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && addEscort()} />
              <button onClick={addEscort} style={{ background: '#f60', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>Add Escort</button>
            </div>
          </div>
          {addStatus && <p style={{ fontSize: 12, color: addStatus.startsWith('Error') ? '#ef4444' : '#22c55e', marginBottom: 8 }}>{addStatus}</p>}
          {fleetEscorts.length === 0 ? (
            <p style={{ color: '#9ca3af', fontSize: 13 }}>No escorts in your fleet yet. Add them by email above.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>{['Name', 'Tier', 'BGC', 'Actions'].map(h => <th key={h} style={th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {fleetEscorts.map((e: any) => (
                  <tr key={e.escort_id}>
                    <td style={td}>{e.profiles?.full_name ?? '—'}</td>
                    <td style={td}>{e.profiles?.tier ?? '—'}</td>
                    <td style={td}>{e.profiles?.bgc_verified ? '✅' : '—'}</td>
                    <td style={td}>
                      <button onClick={() => removeEscort(e.escort_id)} style={{ background: '#7f1d1d', color: '#fca5a5', border: 'none', borderRadius: 4, padding: '4px 10px', fontSize: 12, cursor: 'pointer' }}>Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Active Loads */}
        <div style={card}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Active Loads ({activeLoads.length})</h2>
          {activeLoads.length === 0 ? (
            <p style={{ color: '#9ca3af', fontSize: 13 }}>No active loads for your fleet escorts.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>{['Route', 'Type', 'Status', 'Rate', 'Date'].map(h => <th key={h} style={th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {activeLoads.map((l: any) => (
                  <tr key={l.id}>
                    <td style={td}>{l.pu_city}, {l.pu_state} → {l.dl_city}, {l.dl_state}</td>
                    <td style={td}>{l.escort_type ?? '—'}</td>
                    <td style={td}><span style={{ background: '#1e3a5f', borderRadius: 4, padding: '2px 8px', fontSize: 11 }}>{l.status}</span></td>
                    <td style={td}>${l.per_mile_rate ?? '—'}</td>
                    <td style={td}>{l.start_date ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Fleet Earnings Summary */}
        <div style={card}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Fleet Earnings Summary</h2>
          <p style={{ color: '#9ca3af', fontSize: 13 }}>Completed loads: <strong style={{ color: '#f60' }}>{activeLoads.filter(l => l.status === 'filled').length}</strong></p>
          <p style={{ color: '#9ca3af', fontSize: 13 }}>Est. total earned: <strong style={{ color: '#f60' }}>${activeLoads.filter(l => l.status === 'filled').reduce((s: number, l: any) => s + (l.per_mile_rate ?? 0), 0).toFixed(2)}</strong></p>
        </div>
      </main>
    </div>
  )
}
