'use client'
import { useState, useEffect, Fragment } from 'react'
import { createClient } from '@/lib/supabase/client'
import { isAdminEmail } from '@/lib/supabase'

const TABS = ['users', 'bgc', 'certs', 'verification', 'sponsored', 'disputes', 'loads', 'revenue', 'sms']

export default function AdminPage() {
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState('users')
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  // Users tab
  const [users, setUsers] = useState<any[]>([])
  const [userSearch, setUserSearch] = useState('')
  const [tierFilter, setTierFilter] = useState<string>('all')
  const [expandedUser, setExpandedUser] = useState<string | null>(null)

  // Revenue tab
  const [revenue, setRevenue] = useState<any>({})
  const [recentUpgrades, setRecentUpgrades] = useState<any[]>([])

  // SMS tab
  const [smsMsg, setSmsMsg] = useState('')
  const [smsAudience, setSmsAudience] = useState('all')
  const [smsSending, setSmsSending] = useState(false)
  const [smsResult, setSmsResult] = useState('')
  // BGC Queue
  const [bgcQueue, setBgcQueue] = useState<any[]>([])
  // Certs Queue
  const [certsQueue, setCertsQueue] = useState<any[]>([])
  // Verification Queue
  const [verificationQueue, setVerificationQueue] = useState<any[]>([])
  // Sponsored Zones
  const [sponsoredZonesList, setSponsoredZonesList] = useState<any[]>([])
  // Disputes
  const [disputesList, setDisputesList] = useState<any[]>([])
  // Loads
  const [loadsList, setLoadsList] = useState<any[]>([])
  const [loadsStatusFilter, setLoadsStatusFilter] = useState('')

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (p?.role !== 'admin' && !isAdminEmail(user.email ?? '')) { setLoading(false); return }
      setIsAdmin(true)

      // Load users
      const { data: usersData } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, tier, bgc_verified, created_at, suspended, phone, stripe_customer_id, tier_updated_at, sms_opt_in')
        .order('created_at', { ascending: false })
      setUsers(usersData || [])

      // Revenue
      const all = usersData || []
      const member = all.filter(u => u.tier === 'member').length
      const pro = all.filter(u => u.tier === 'pro').length
      const fleetPro = all.filter(u => u.tier === 'fleet_pro').length
      const bgcCount = all.filter(u => u.bgc_verified).length

      const { data: zones } = await supabase.from('sponsored_zones').select('id').eq('active', true)
      const zoneCount = zones?.length ?? 0
      const mrr = (member * 19.99) + (pro * 29.99) + (fleetPro * 99.99) + (zoneCount * 29.99)

      setRevenue({ member, pro, fleetPro, bgcCount, zoneCount, mrr: mrr.toFixed(2) })

      const recent = all.filter(u => u.tier && u.tier_updated_at).sort((a, b) => new Date(b.tier_updated_at).getTime() - new Date(a.tier_updated_at).getTime()).slice(0, 20)
      setRecentUpgrades(recent)

      setLoading(false)
    }
    init()

    // Fetch BGC queue
    supabase.from('certifications').select('*, profiles(full_name, email)').eq('type', 'bgc').eq('status', 'pending').then(({data}) => setBgcQueue(data || []))
    // Fetch Certs queue
    supabase.from('certifications').select('*, profiles(full_name, email)').neq('type', 'bgc').eq('status', 'pending').then(({data}) => setCertsQueue(data || []))
    // Fetch Verification queue
    supabase.from('certifications').select('*, profiles(full_name, email)').eq('status', 'pending').then(({data}) => setVerificationQueue(data || []))
    // Fetch Sponsored Zones
    supabase.from('sponsored_zones').select('*, profiles(full_name, email)').then(({data}: {data: any}) => setSponsoredZonesList(data || []))
    // Fetch Disputes
    supabase.from('disputes').select('*').then(({data}: {data: any}) => setDisputesList(data || []))
    // Fetch Loads
    supabase.from('loads').select('*').order('created_at', {ascending: false}).then(({data}: {data: any}) => setLoadsList(data || []))
  }, [])

  const suspendUser = async (userId: string, suspended: boolean) => {
    await supabase.from('profiles').update({ suspended: !suspended }).eq('id', userId)
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, suspended: !suspended } : u))
  }

  const approveBgc = async (certId: string) => {
    if (!confirm('Approve this BGC submission? This will mark the user as BGC verified.')) return
    const res = await fetch('/api/bgc/approve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cert_id: certId }) })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) { alert('Approve failed: ' + (data.error || res.statusText)); return }
    setBgcQueue(prev => prev.filter((c: any) => c.id !== certId))
  }

  const rejectBgc = async (certId: string) => {
    const reason = prompt('Reason for rejection (optional):') || ''
    if (!confirm('Reject this BGC submission?')) return
    const res = await fetch('/api/bgc/reject', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cert_id: certId, reason }) })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) { alert('Reject failed: ' + (data.error || res.statusText)); return }
    setBgcQueue(prev => prev.filter((c: any) => c.id !== certId))
  }

  const approveCert = async (certId: string) => {
    if (!confirm('Approve this certification submission?')) return
    const res = await fetch('/api/bgc/approve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cert_id: certId }) })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) { alert('Approve failed: ' + (data.error || res.statusText)); return }
    setCertsQueue(prev => prev.filter((c: any) => c.id !== certId))
  }

  const rejectCert = async (certId: string) => {
    const reason = prompt('Reason for rejection (optional):') || ''
    if (!confirm('Reject this certification submission?')) return
    const res = await fetch('/api/bgc/reject', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cert_id: certId, reason }) })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) { alert('Reject failed: ' + (data.error || res.statusText)); return }
    setCertsQueue(prev => prev.filter((c: any) => c.id !== certId))
  }

  const expireLoad = async (loadId: string) => {
    if (!confirm('Mark this load as expired?')) return
    const { error } = await supabase.from('loads').update({ status: 'expired' }).eq('id', loadId)
    if (error) { alert('Expire failed: ' + error.message); return }
    setLoadsList(prev => prev.map((l: any) => l.id === loadId ? { ...l, status: 'expired' } : l))
  }

  const changeRole = async (userId: string, role: string) => {
    const supabase = createClient()
    await supabase.from('profiles').update({ role }).eq('id', userId)
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u))
  }

  const sendBlast = async () => {
    if (!smsMsg.trim()) return
    setSmsSending(true)
    setSmsResult('')
    try {
      const res = await fetch('/api/sms/blast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: smsMsg, audience: smsAudience })
      })
      const data = await res.json()
      setSmsResult(data.error ? `Error: ${data.error}` : `Sent to ${data.sent} of ${data.total} recipients`)
    } catch (e) {
      setSmsResult('Error sending blast')
    }
    setSmsSending(false)
  }

  const estimateRecipients = () => {
    if (smsAudience === 'all') return users.filter(u => u.phone && u.sms_opt_in).length
    if (smsAudience === 'pro') return users.filter(u => (u.tier === 'pro' || u.tier === 'fleet_pro') && u.phone && u.sms_opt_in).length
    if (smsAudience === 'carriers') return users.filter(u => u.role === 'carrier' && u.phone && u.sms_opt_in).length
    if (smsAudience === 'members') return users.filter(u => u.tier === 'member' && u.phone && u.sms_opt_in).length
    return 0
  }

  const filteredUsers = users.filter(u => {
    const q = userSearch.toLowerCase()
    const matchesSearch = !q || u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
    const matchesTier = tierFilter === 'all' || (u.tier ?? 'free') === tierFilter
    return matchesSearch && matchesTier
  })

  const bg = '#0a0f1a'
  const card = { background: '#0f1a2e', border: '1px solid #1e3a5f', borderRadius: 10, padding: '16px 20px', marginBottom: 16 }
  const th = { textAlign: 'left' as const, padding: '8px 12px', fontSize: 11, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase' as const, borderBottom: '1px solid #1e3a5f' }
  const td = { padding: '10px 12px', fontSize: 13, color: '#e2e8f0', borderBottom: '1px solid rgba(30,58,95,0.5)' }
  const btn = { background: '#1e3a5f', color: '#e2e8f0', border: 'none', borderRadius: 4, padding: '4px 10px', fontSize: 12, cursor: 'pointer', marginRight: 4 }
  const inp = { background: '#0f1a2e', border: '1px solid #1e3a5f', borderRadius: 6, color: '#e2e8f0', padding: '8px 12px', fontSize: 13 }

  if (loading) return <div style={{ background: bg, minHeight: '100vh', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>
  if (!isAdmin) return <div style={{ background: bg, minHeight: '100vh', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Admin access required.</div>

  return (
    <div style={{ minHeight: '100vh', background: bg, color: '#fff' }}>
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Admin Panel</h1>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid #1e3a5f', paddingBottom: 0 }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setActiveTab(t)} style={{ background: 'none', border: 'none', color: activeTab === t ? '#f60' : '#9ca3af', fontSize: 14, fontWeight: activeTab === t ? 700 : 400, padding: '8px 16px', cursor: 'pointer', borderBottom: activeTab === t ? '2px solid #f60' : '2px solid transparent' }}>
              {t === 'bgc' ? 'BGC' : t === 'sms' ? 'SMS Blast' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600 }}>Users ({filteredUsers.length})</h2>
              <input style={{ ...inp, flex: 1, maxWidth: 300 }} placeholder="Search by name or email..." value={userSearch} onChange={e => setUserSearch(e.target.value)} />
            </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
          {(['all','free','trial','member','pro','fleet_starter','fleet_plus','fleet_pro'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTierFilter(t)}
              style={{
                background: tierFilter === t ? '#f60' : '#1e3a5f',
                color: tierFilter === t ? '#fff' : '#e2e8f0',
                border: 'none',
                borderRadius: 999,
                padding: '4px 12px',
                fontSize: 12,
                fontWeight: tierFilter === t ? 700 : 500,
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {t === 'all' ? 'All' : t.replace('_', ' ')}
            </button>
          ))}
        </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', background: '#0f1a2e', borderRadius: 10, overflow: 'hidden' }}>
                <thead>
                  <tr>
                    {['Name', 'Email', 'Role', 'Membership', 'BGC', 'Suspended', 'Joined', 'Actions'].map(h => <th key={h} style={th}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <Fragment key={u.id}>
                      <tr onClick={() => setExpandedUser(expandedUser === u.id ? null : u.id)} style={{ cursor: 'pointer', background: expandedUser === u.id ? '#16213a' : 'transparent' }}>
                        <td style={td}>{u.full_name ?? '—'}</td>
                        <td style={td}>{u.email ?? '—'}</td>
                        <td style={td}><span style={{ background: '#1e3a5f', borderRadius: 4, padding: '2px 6px', fontSize: 11 }}>{u.role ?? '—'}</span></td>
                        <td style={td}>{u.tier ?? '—'}</td>
                        <td style={td}>{u.bgc_verified ? '✅' : '—'}</td>
                        <td style={td}>{u.suspended ? '🔴' : '—'}</td>
                        <td style={td}>{new Date(u.created_at).toLocaleDateString()}</td>
                        <td style={td}>
                          <button style={btn} onClick={e => { e.stopPropagation(); suspendUser(u.id, u.suspended) }}>
                            {u.suspended ? 'Unsuspend' : 'Suspend'}
                          </button>
                          <select style={{ ...btn, cursor: 'pointer' }} value={u.role ?? ''} onChange={e => { e.stopPropagation(); changeRole(u.id, e.target.value) }}>
                            <option value="escort">Escort</option>
                            <option value="carrier">Carrier</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                      </tr>
                      {expandedUser === u.id && (
                        <tr>
                          <td colSpan={8} style={{ ...td, background: '#16213a', padding: '12px 20px' }}>
                            <strong>Full Profile</strong><br />
                            ID: {u.id}<br />
                            Phone: {u.phone ?? '—'}<br />
                            Stripe Customer: {u.stripe_customer_id ?? '—'}<br />
                            Tier: {u.tier ?? '—'} | BGC Verified: {String(u.bgc_verified)}<br />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* BGC Tab */}
          {activeTab === 'bgc' && (
            <div style={card}>
              <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>BGC Badge Reviews <span style={{ color: '#9ca3af', fontWeight: 400, fontSize: 13 }}>({bgcQueue.length} pending)</span></h2>
              {bgcQueue.length === 0 ? (
                <p style={{ color: '#9ca3af', fontSize: 13 }}>No pending BGC submissions.</p>
              ) : (
                <div style={{ display: 'grid', gap: 12 }}>
                  {bgcQueue.map((c: any) => {
                    const prof = c.profiles || {}
                    const docUrl = c.document_url || c.file_url || c.url
                    return (
                      <div key={c.id} style={{ background: '#0f1a2e', border: '1px solid #1e3a5f', borderRadius: 8, padding: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 15 }}>{prof.full_name || 'Unknown user'}</div>
                            <div style={{ color: '#9ca3af', fontSize: 12 }}>{prof.email || c.user_id}</div>
                            <div style={{ color: '#9ca3af', fontSize: 12, marginTop: 4 }}>Submitted: {c.created_at ? new Date(c.created_at).toLocaleString() : '-'}</div>
                            {docUrl && (
                              <a href={docUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', fontSize: 13, textDecoration: 'underline', display: 'inline-block', marginTop: 6 }}>View document &rarr;</a>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => approveBgc(c.id)} style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 14px', fontWeight: 600, cursor: 'pointer' }}>Approve</button>
                            <button onClick={() => rejectBgc(c.id)} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 14px', fontWeight: 600, cursor: 'pointer' }}>Reject</button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

        {/* Certs Tab */}
        {activeTab === 'certs' && (
          <div style={card}>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Certifications Queue</h2>
            {certsQueue.length === 0 ? (
              <p style={{ color: '#9ca3af', fontSize: 13 }}>No pending certification submissions.</p>
            ) : (
              <div style={{ display: 'grid', gap: 12 }}>
                {certsQueue.map((c: any) => {
                  const prof = c.profiles || {}
                  const docUrl = c.document_url || c.file_url || c.url
                  return (
                    <div key={c.id} style={{ background: '#0f1a2e', border: '1px solid #1e3a5f', borderRadius: 8, padding: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 15 }}>{prof.full_name || 'Unknown user'}</div>
                          <div style={{ color: '#9ca3af', fontSize: 12 }}>{prof.email || c.user_id}</div>
                          <div style={{ color: '#9ca3af', fontSize: 12, marginTop: 4 }}>Type: {c.type || '-'} • Submitted: {c.created_at ? new Date(c.created_at).toLocaleString() : '-'}</div>
                          {docUrl && (
                            <a href={docUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', fontSize: 13, textDecoration: 'underline', display: 'inline-block', marginTop: 6 }}>View document &rarr;</a>
                          )}
                        </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => approveCert(c.id)} style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 14px', fontWeight: 600, cursor: 'pointer' }}>Approve</button>
                        <button onClick={() => rejectCert(c.id)} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 14px', fontWeight: 600, cursor: 'pointer' }}>Reject</button>
                      </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Verification Tab */}
        {activeTab === 'verification' && (
          <div style={card}>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Identity Verification Queue</h2>
            {verificationQueue.length === 0 ? (
              <p style={{ color: '#9ca3af', fontSize: 13 }}>No pending verification requests.</p>
            ) : (
              <div style={{ display: 'grid', gap: 12 }}>
                {verificationQueue.map((v: any) => {
                  const prof = v.profiles || {}
                  const docUrl = v.document_url || v.file_url || v.url
                  return (
                    <div key={v.id} style={{ background: '#0f1a2e', border: '1px solid #1e3a5f', borderRadius: 8, padding: 14 }}>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>{prof.full_name || 'Unknown user'}</div>
                      <div style={{ color: '#9ca3af', fontSize: 12 }}>{prof.email || v.user_id}</div>
                      <div style={{ color: '#9ca3af', fontSize: 12, marginTop: 4 }}>Type: {v.type || '-'} • Submitted: {v.created_at ? new Date(v.created_at).toLocaleString() : '-'}</div>
                      {docUrl && (
                        <a href={docUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', fontSize: 13, textDecoration: 'underline', display: 'inline-block', marginTop: 6 }}>View document &rarr;</a>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Sponsored Tab */}
        {activeTab === 'sponsored' && (
          <div style={card}>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Sponsored Zones</h2>
            {sponsoredZonesList.length === 0 ? (
              <p style={{ color: '#9ca3af', fontSize: 13 }}>No sponsored zones active.</p>
            ) : (
              <div style={{ display: 'grid', gap: 12 }}>
                {sponsoredZonesList.map((z: any) => {
                  const prof = z.profiles || {}
                  return (
                    <div key={z.id} style={{ background: '#0f1a2e', border: '1px solid #1e3a5f', borderRadius: 8, padding: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 15 }}>{z.zone_name || z.city || z.region || 'Zone'}</div>
                          <div style={{ color: '#9ca3af', fontSize: 12 }}>{prof.full_name || z.user_id} {prof.email ? '• ' + prof.email : ''}</div>
                          <div style={{ color: '#9ca3af', fontSize: 12, marginTop: 4 }}>Status: {z.status || '-'} • Expires: {z.expires_at ? new Date(z.expires_at).toLocaleDateString() : '-'}</div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Disputes Tab */}
        {activeTab === 'disputes' && (
          <div style={card}>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Disputes</h2>
            {disputesList.length === 0 ? (
              <p style={{ color: '#9ca3af', fontSize: 13 }}>No open disputes.</p>
            ) : (
              <div style={{ display: 'grid', gap: 12 }}>
                {disputesList.map((d: any) => (
                  <div key={d.id} style={{ background: '#0f1a2e', border: '1px solid #1e3a5f', borderRadius: 8, padding: 14 }}>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{d.subject || d.title || 'Dispute #' + d.id}</div>
                    <div style={{ color: '#9ca3af', fontSize: 12, marginTop: 4 }}>Status: {d.status || 'open'} • Opened: {d.created_at ? new Date(d.created_at).toLocaleString() : '-'}</div>
                    {d.description && (
                      <div style={{ color: '#e2e8f0', fontSize: 13, marginTop: 8, whiteSpace: 'pre-wrap' }}>{d.description}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Loads Tab */}
        {activeTab === 'loads' && (
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: 16, fontWeight: 600 }}>All Loads ({loadsList.filter((l: any) => !loadsStatusFilter || l.status === loadsStatusFilter).length})</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {[['', 'All'], ['open', 'Open'], ['filled', 'Filled'], ['expired', 'Expired'], ['cancelled', 'Cancelled']].map(([val, label]) => (
                  <button
                    key={val || 'all'}
                    onClick={() => setLoadsStatusFilter(val)}
                    style={{
                      background: loadsStatusFilter === val ? '#f60' : '#1e3a5f',
                      color: loadsStatusFilter === val ? '#fff' : '#e2e8f0',
                      border: 'none',
                      borderRadius: 999,
                      padding: '4px 12px',
                      fontSize: 12,
                      fontWeight: loadsStatusFilter === val ? 700 : 500,
                      cursor: 'pointer'
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', background: '#0f1a2e', borderRadius: 10, overflow: 'hidden' }}>
                <thead>
                  <tr>
                    {['Route', 'Position', 'Status', 'Board Type', 'Posted', 'Actions'].map(h => <th key={h} style={th}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {loadsList
                    .filter((l: any) => !loadsStatusFilter || l.status === loadsStatusFilter)
                    .map((l: any) => (
                      <tr key={l.id}>
                        <td style={td}>{(l.pu_city || l.origin_city || '-')}{l.pu_state ? ', ' + l.pu_state : ''} → {(l.dl_city || l.destination_city || '-')}{l.dl_state ? ', ' + l.dl_state : ''}</td>
                        <td style={td}>{l.position || '-'}</td>
                        <td style={td}><span style={{ background: '#1e3a5f', borderRadius: 4, padding: '2px 6px', fontSize: 11 }}>{l.status || '-'}</span></td>
                        <td style={td}>{l.board_type || '-'}</td>
                        <td style={td}>{l.created_at ? new Date(l.created_at).toLocaleDateString() : '-'}</td>
                        <td style={td}>
                          {l.status !== 'expired' && (
                            <button style={btn} onClick={() => expireLoad(l.id)}>Expire now</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  {loadsList.filter((l: any) => !loadsStatusFilter || l.status === loadsStatusFilter).length === 0 && (
                    <tr><td colSpan={6} style={{ ...td, color: '#9ca3af', textAlign: 'center' }}>No loads match the current filter.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Revenue Tab */}
        {activeTab === 'revenue' && (
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Revenue Overview</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
              {[
                { label: 'Member Escorts', value: revenue.member ?? 0, sub: `$${((revenue.member ?? 0) * 19.99).toFixed(2)}/mo` },
                { label: 'Pro Escorts', value: revenue.pro ?? 0, sub: `$${((revenue.pro ?? 0) * 29.99).toFixed(2)}/mo` },
                { label: 'Fleet Pro', value: revenue.fleetPro ?? 0, sub: `$${((revenue.fleetPro ?? 0) * 99.99).toFixed(2)}/mo` },
                { label: 'BGC Badges', value: revenue.bgcCount ?? 0, sub: 'one-time $9.99' },
                { label: 'Sponsored Zones', value: revenue.zoneCount ?? 0, sub: `$${((revenue.zoneCount ?? 0) * 29.99).toFixed(2)}/mo` },
                { label: 'Est. MRR', value: `$${revenue.mrr ?? '0.00'}`, sub: 'monthly recurring', accent: true },
              ].map(item => (
                <div key={item.label} style={{ background: '#0f1a2e', border: `1px solid ${item.accent ? '#f60' : '#1e3a5f'}`, borderRadius: 8, padding: '14px 16px' }}>
                  <p style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>{item.label}</p>
                  <p style={{ fontSize: 22, fontWeight: 700, color: item.accent ? '#f60' : '#fff' }}>{item.value}</p>
                  <p style={{ fontSize: 11, color: '#4a5568', marginTop: 4 }}>{item.sub}</p>
                </div>
              ))}
            </div>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Recent Upgrades (last 20)</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: '#0f1a2e', borderRadius: 8 }}>
              <thead>
                <tr>
                  {['Name', 'Email', 'Tier', 'Joined'].map(h => <th key={h} style={th}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {recentUpgrades.map(u => (
                  <tr key={u.id}>
                    <td style={td}>{u.full_name ?? '—'}</td>
                    <td style={td}>{u.email ?? '—'}</td>
                    <td style={td}>{u.tier ?? '—'}</td>
                    <td style={td}>{new Date(u.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* SMS Blast Tab */}
        {activeTab === 'sms' && (
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>SMS Blast</h2>
            <div style={card}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, color: '#9ca3af', marginBottom: 6, fontWeight: 600 }}>AUDIENCE</label>
                <select style={{ ...inp, width: 240 }} value={smsAudience} onChange={e => setSmsAudience(e.target.value)}>
                  <option value="all">All Users</option>
                  <option value="pro">Pro Escorts Only</option>
                  <option value="carriers">Carriers Only</option>
                  <option value="members">Members Only</option>
                </select>
                <span style={{ marginLeft: 12, fontSize: 13, color: '#9ca3af' }}>~{estimateRecipients()} recipients with phone</span>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, color: '#9ca3af', marginBottom: 6, fontWeight: 600 }}>MESSAGE ({smsMsg.length}/160)</label>
                <textarea
                  style={{ ...inp, width: '100%', minHeight: 80, resize: 'vertical', boxSizing: 'border-box' }}
                  maxLength={160}
                  value={smsMsg}
                  onChange={e => setSmsMsg(e.target.value)}
                  placeholder="Type your SMS message here (max 160 chars)..."
                />
              </div>
              <div style={{ marginBottom: 12, padding: '10px 14px', background: '#16213a', borderRadius: 6, fontSize: 12, color: '#9ca3af' }}>
                Preview: <span style={{ color: '#e2e8f0' }}>{smsMsg || '(empty)'}</span>
              </div>
              <button
                onClick={sendBlast}
                disabled={smsSending || !smsMsg.trim()}
                style={{ background: smsSending ? '#1e3a5f' : '#f60', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 24px', fontWeight: 700, cursor: smsSending ? 'not-allowed' : 'pointer' }}
              >
                {smsSending ? 'Sending...' : 'Send Blast'}
              </button>
              {smsResult && <p style={{ marginTop: 12, fontSize: 13, color: smsResult.startsWith('Error') ? '#ef4444' : '#22c55e' }}>{smsResult}</p>}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
