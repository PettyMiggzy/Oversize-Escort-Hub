'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const TABS = ['users', 'bgc', 'certs', 'verification', 'sponsored', 'disputes', 'loads', 'revenue', 'sms']

export default function AdminPage() {
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState('users')
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  // Users tab
  const [users, setUsers] = useState<any[]>([])
  const [userSearch, setUserSearch] = useState('')
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
      if (p?.role !== 'admin') { setLoading(false); return }
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
    const s = userSearch.toLowerCase()
    return !s || u.full_name?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s)
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
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', background: '#0f1a2e', borderRadius: 10, overflow: 'hidden' }}>
                <thead>
                  <tr>
                    {['Name', 'Email', 'Role', 'Membership', 'BGC', 'Suspended', 'Joined', 'Actions'].map(h => <th key={h} style={th}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <>
                      <tr key={u.id} onClick={() => setExpandedUser(expandedUser === u.id ? null : u.id)} style={{ cursor: 'pointer', background: expandedUser === u.id ? '#16213a' : 'transparent' }}>
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
                        <tr key={u.id + '-exp'}>
                          <td colSpan={8} style={{ ...td, background: '#16213a', padding: '12px 20px' }}>
                            <strong>Full Profile</strong><br />
                            ID: {u.id}<br />
                            Phone: {u.phone ?? '—'}<br />
                            Stripe Customer: {u.stripe_customer_id ?? '—'}<br />
                            Tier: {u.tier ?? '—'} | BGC Verified: {String(u.bgc_verified)}<br />
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* BGC Tab */}
        {activeTab === 'bgc' && (
          <div style={card}>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>BGC Badge Reviews</h2>
            <p style={{ color: '#9ca3af', fontSize: 13 }}>BGC submissions appear here. Use Supabase dashboard to review and approve uploads in the bgc_submissions table.</p>
          </div>
        )}

        {/* Loads Tab */}
        {activeTab === 'loads' && (
          <div style={card}>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>All Loads</h2>
            <p style={{ color: '#9ca3af', fontSize: 13 }}>Use the main load board pages to manage loads, or filter from Users tab.</p>
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
