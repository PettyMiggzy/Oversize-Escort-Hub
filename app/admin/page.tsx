'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [loads, setLoads] = useState([]);
  const [bgcQueue, setBgcQueue] = useState([]);
  const [revenue, setRevenue] = useState({ member: 0, pro: 0, fleet: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      
      setLoading(true);

      // Fetch users
      const { data: usersData } = await supabase
        .from('profiles')
        .select('id, name, email, role, membership_level, created_at, bgc_verified');
      setUsers(usersData || []);

      // Fetch loads
      const { data: loadsData } = await supabase
        .from('loads')
        .select('id, status, carrier_id, escort_type, created_at');
      setLoads(loadsData || []);

      // Fetch BGC queue
      const { data: bgcData } = await supabase
        .from('certifications')
        .select('id, user_id, status, created_at')
        .eq('status', 'pending');
      setBgcQueue(bgcData || []);

      // Fetch revenue
      const { data: revenueData } = await supabase
        .from('profiles')
        .select('membership_level');
      
      const counts = { member: 0, pro: 0, fleet: 0 };
      revenueData?.forEach((p: any) => {
        if (p.membership_level === 'member') counts.member++;
        else if (p.membership_level === 'pro') counts.pro++;
        else if (p.membership_level === 'fleet') counts.fleet++;
      });
      setRevenue(counts);

      setLoading(false);
    };

    fetchData();
  }, []);

  const handleBgcApprove = async (id: string) => {
    
    await supabase.from('certifications').update({ status: 'approved' }).eq('id', id);
    setBgcQueue(bgcQueue.filter((b: any) => b.id !== id));
  };

  const handleBgcDeny = async (id: string) => {
    
    await supabase.from('certifications').update({ status: 'denied' }).eq('id', id);
    setBgcQueue(bgcQueue.filter((b: any) => b.id !== id));
  };

  const tabStyle = {
    padding: '12px 24px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    background: '#0d1117',
    color: '#e0e0e0',
  };

  const activeTabStyle = { ...tabStyle, background: '#f0a500', color: '#060b16' };

  return (
    <div style={{ background: '#060b16', color: '#e0e0e0', minHeight: '100vh', padding: '20px' }}>
      <h1 style={{ color: '#f0a500' }}>Admin Dashboard</h1>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {['users', 'bgc', 'loads', 'revenue'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={activeTab === tab ? activeTabStyle : tabStyle}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {loading ? <p>Loading...</p> : (
        <>
          {activeTab === 'users' && (
            <div>
              <h2>Users ({users.length})</h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #444' }}>
                      <th style={{ textAlign: 'left', padding: '8px' }}>Name</th>
                      <th style={{ textAlign: 'left', padding: '8px' }}>Email</th>
                      <th style={{ textAlign: 'left', padding: '8px' }}>Role</th>
                      <th style={{ textAlign: 'left', padding: '8px' }}>Tier</th>
                      <th style={{ textAlign: 'left', padding: '8px' }}>BGC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u: any) => (
                      <tr key={u.id} style={{ borderBottom: '1px solid #333' }}>
                        <td style={{ padding: '8px' }}>{u.name || 'N/A'}</td>
                        <td style={{ padding: '8px' }}>{u.email || 'N/A'}</td>
                        <td style={{ padding: '8px' }}>{u.role || 'user'}</td>
                        <td style={{ padding: '8px' }}>{u.membership_level || 'free'}</td>
                        <td style={{ padding: '8px', color: u.bgc_verified ? '#4ade80' : '#ff6b6b' }}>
                          {u.bgc_verified ? '✓' : '✗'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'bgc' && (
            <div>
              <h2>BGC Queue ({bgcQueue.length})</h2>
              {bgcQueue.map((bgc: any) => (
                <div key={bgc.id} style={{ background: '#0d1117', padding: '12px', marginBottom: '8px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{bgc.user_id}</span>
                  <div style={{ gap: '8px', display: 'flex' }}>
                    <button onClick={() => handleBgcApprove(bgc.id)} style={{ background: '#4ade80', color: '#000', padding: '6px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Approve</button>
                    <button onClick={() => handleBgcDeny(bgc.id)} style={{ background: '#ff6b6b', color: '#fff', padding: '6px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Deny</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'loads' && (
            <div>
              <h2>Loads ({loads.length})</h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #444' }}>
                      <th style={{ textAlign: 'left', padding: '8px' }}>ID</th>
                      <th style={{ textAlign: 'left', padding: '8px' }}>Type</th>
                      <th style={{ textAlign: 'left', padding: '8px' }}>Status</th>
                      <th style={{ textAlign: 'left', padding: '8px' }}>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loads.map((l: any) => (
                      <tr key={l.id} style={{ borderBottom: '1px solid #333' }}>
                        <td style={{ padding: '8px' }}>{l.id.slice(0, 8)}</td>
                        <td style={{ padding: '8px' }}>{l.escort_type || 'N/A'}</td>
                        <td style={{ padding: '8px', color: l.status === 'open' ? '#4ade80' : '#fbbf24' }}>{l.status}</td>
                        <td style={{ padding: '8px' }}>{new Date(l.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'revenue' && (
            <div>
              <h2>Revenue Analytics</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                <div style={{ background: '#0d1117', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #4ade80' }}>
                  <h3 style={{ margin: '0 0 8px', color: '#4ade80' }}>Members</h3>
                  <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>{revenue.member}</p>
                </div>
                <div style={{ background: '#0d1117', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #f0a500' }}>
                  <h3 style={{ margin: '0 0 8px', color: '#f0a500' }}>Pro</h3>
                  <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>{revenue.pro}</p>
                </div>
                <div style={{ background: '#0d1117', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
                  <h3 style={{ margin: '0 0 8px', color: '#3b82f6' }}>Fleet</h3>
                  <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>{revenue.fleet}</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
