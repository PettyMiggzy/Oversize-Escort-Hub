'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

type AdminTab =
  | 'users' | 'bgc' | 'certs' | 'verification'
  | 'sponsored' | 'disputes' | 'flags' | 'revenue'
  | 'refunds' | 'loads' | 'sms' | 'settings';

interface Submission {
  id: string;
  status: string;
  created_at: string;
  pdf_url: string;
  label: string;
  type: string;
}

const NAV_TABS: { key: AdminTab; label: string }[] = [
  { key: 'users',        label: 'Users' },
  { key: 'bgc',          label: 'BGC Queue' },
  { key: 'certs',        label: 'Certs Queue' },
  { key: 'verification', label: 'Verification Queue' },
  { key: 'sponsored',    label: 'Sponsored Zones' },
  { key: 'disputes',     label: 'Disputes' },
  { key: 'flags',        label: 'Flags / Reports' },
  { key: 'revenue',      label: 'Revenue' },
  { key: 'refunds',      label: 'Refunds' },
  { key: 'loads',        label: 'Loads' },
  { key: 'sms',          label: 'SMS Blast' },
  { key: 'settings',     label: 'Settings' },
];

const C = {
  bg:        '#060b16',
  surface:   '#0d1117',
  card:      '#111827',
  border:    'rgba(255,255,255,0.08)',
  orange:    '#f97316',
  orangeHov: '#ea6a0a',
  text:      '#e5e7eb',
  muted:     '#9ca3af',
  green:     '#22c55e',
  red:       '#ef4444',
};

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  useEffect(() => {
    const tabsNeedingData: AdminTab[] = ['bgc', 'certs', 'verification'];
    if (tabsNeedingData.includes(activeTab)) {
      fetchSubmissions();
    }
  }, [activeTab]);

  async function fetchSubmissions() {
    setLoading(true);
    try {
      let types: string[] = [];
      if (activeTab === 'bgc')          types = ['bgc'];
      else if (activeTab === 'certs')   types = ['cert'];
      else if (activeTab === 'verification') types = ['bgc', 'dd214', 'cert'];

      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .in('type', types)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (err) {
      console.error('Failed to fetch submissions:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(id: string, action: 'approve' | 'deny') {
    if (loadingId) return;
    setLoadingId(id);
    try {
      const res = await fetch(`/api/webhook/${activeTab === 'bgc' ? 'bgc' : 'cert'}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (json.success) {
        setSubmissions(prev => prev.filter(s => s.id !== id));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingId(null);
    }
  }

  function renderContent() {
    switch (activeTab) {
      case 'bgc':
      case 'certs':
      case 'verification':
        const title =
          activeTab === 'bgc' ? 'BGC Queue' :
          activeTab === 'certs' ? 'Certs Queue' :
          'Verification Queue (BGC + DD-214)';
        return (
          <div>
            <h2 style={{ color: C.orange, fontSize: 22, fontWeight: 700, marginBottom: 20 }}>{title}</h2>
            {loading ? (
              <p style={{ color: C.muted }}>Loading...</p>
            ) : submissions.length === 0 ? (
              <p style={{ color: C.muted }}>No pending submissions found.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                    {['ID', 'Type', 'Submitted', 'Document', 'Actions'].map(h => (
                      <th key={h} style={{ color: C.muted, padding: '8px 12px', textAlign: 'left', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {submissions.map(s => (
                    <tr key={s.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                      <td style={{ padding: '10px 12px', color: C.muted, fontSize: 12 }}>{s.id.slice(0, 8)}...</td>
                      <td style={{ padding: '10px 12px', color: C.text, fontSize: 13 }}>{s.type?.toUpperCase()}</td>
                      <td style={{ padding: '10px 12px', color: C.muted, fontSize: 12 }}>{new Date(s.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: '10px 12px' }}>
                        {s.pdf_url ? (
                          <a href={s.pdf_url} target="_blank" rel="noopener noreferrer" style={{ color: C.orange, fontSize: 13 }}>View PDF</a>
                        ) : <span style={{ color: C.muted }}>N/A</span>}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            type="button"
                            onClick={() => handleAction(s.id, 'approve')}
                            disabled={loadingId === s.id}
                            style={{ background: C.green, color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600, opacity: loadingId === s.id ? 0.6 : 1 }}
                          >
                            {loadingId === s.id ? '...' : 'Approve'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAction(s.id, 'deny')}
                            disabled={loadingId === s.id}
                            style={{ background: C.red, color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600, opacity: loadingId === s.id ? 0.6 : 1 }}
                          >
                            Deny
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        );

      case 'users':
        return (
          <div>
            <h2 style={{ color: C.orange, fontSize: 22, fontWeight: 700, marginBottom: 16 }}>Users</h2>
            <p style={{ color: C.muted }}>User management coming soon.</p>
          </div>
        );

      case 'sponsored':
        return (
          <div>
            <h2 style={{ color: C.orange, fontSize: 22, fontWeight: 700, marginBottom: 16 }}>Sponsored Zones</h2>
            <p style={{ color: C.muted }}>Manage active sponsored zones here.</p>
          </div>
        );

      case 'disputes':
        return (
          <div>
            <h2 style={{ color: C.orange, fontSize: 22, fontWeight: 700, marginBottom: 16 }}>Disputes</h2>
            <p style={{ color: C.muted }}>No open disputes.</p>
          </div>
        );

      case 'flags':
        return (
          <div>
            <h2 style={{ color: C.orange, fontSize: 22, fontWeight: 700, marginBottom: 16 }}>Flags / Reports</h2>
            <p style={{ color: C.muted }}>No user reports at this time.</p>
          </div>
        );

      case 'revenue':
        return (
          <div>
            <h2 style={{ color: C.orange, fontSize: 22, fontWeight: 700, marginBottom: 16 }}>Revenue</h2>
            <p style={{ color: C.muted }}>Revenue analytics coming soon.</p>
          </div>
        );

      case 'refunds':
        return (
          <div>
            <h2 style={{ color: C.orange, fontSize: 22, fontWeight: 700, marginBottom: 16 }}>Refunds</h2>
            <p style={{ color: C.muted }}>No pending refunds.</p>
          </div>
        );

      case 'loads':
        return (
          <div>
            <h2 style={{ color: C.orange, fontSize: 22, fontWeight: 700, marginBottom: 16 }}>Loads</h2>
            <p style={{ color: C.muted }}>Load management coming soon.</p>
          </div>
        );

      case 'sms':
        return (
          <div>
            <h2 style={{ color: C.orange, fontSize: 22, fontWeight: 700, marginBottom: 16 }}>SMS Blast</h2>
            <p style={{ color: C.muted }}>SMS broadcasting coming soon.</p>
          </div>
        );

      case 'settings':
        return (
          <div>
            <h2 style={{ color: C.orange, fontSize: 22, fontWeight: 700, marginBottom: 16 }}>Settings</h2>
            <p style={{ color: C.muted }}>Admin settings coming soon.</p>
          </div>
        );

      default:
        return null;
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: '20px 32px' }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: C.text, margin: 0, letterSpacing: '-0.02em' }}>
          Admin Dashboard
        </h1>
      </div>

      {/* Nav tabs */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: '0 32px', display: 'flex', gap: 4, overflowX: 'auto' }}>
        {NAV_TABS.map(({ key, label }) => {
          const isActive = activeTab === key;
          const isHov = hoveredTab === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              onMouseEnter={() => setHoveredTab(key)}
              onMouseLeave={() => setHoveredTab(null)}
              style={{
                background: isActive ? C.orange : isHov ? 'rgba(249,115,22,0.12)' : 'transparent',
                color: isActive ? '#fff' : isHov ? C.orange : C.muted,
                border: 'none',
                borderBottom: isActive ? `2px solid ${C.orange}` : '2px solid transparent',
                padding: '14px 16px',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: isActive ? 700 : 500,
                whiteSpace: 'nowrap',
                transition: 'all 0.15s',
                borderRadius: '6px 6px 0 0',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div style={{ padding: '32px' }}>
        {renderContent()}
      </div>
    </div>
  );
}
