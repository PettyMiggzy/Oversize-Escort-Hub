'use client';
import SiteHeader from '@/components/SiteHeader';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { BoardAdSidebar } from '@/components/BoardAdSidebar';

interface Load {
  id: string;
  expires_at: string;
  pu_city: string;
  pu_state: string;
  dl_city: string;
  dl_state: string;
  rate: number;
  escort_type: string;
  created_at: string;
  status: string;
  bgc_verified?: boolean;
  fmcsa_verified?: boolean;
  poster_rating?: number;
  poster_jobs?: number;
}

export function BidBoardClient() {
  const supabase = createClient();
  const [loads, setLoads] = useState<Load[]>([]);
  const [timers, setTimers] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const fetchLoads = async () => {
      const { data } = await supabase
        .from('loads')
        .select('*')
        .eq('board_type', 'bid')
        .eq('status', 'open')
        .order('created_at', { ascending: false });
      
      if (data) setLoads((data || []).filter((load: any) => {
        if (!load.deadhead_notified_at) return true
        return new Date(load.deadhead_notified_at).getTime() + 5 * 60 * 1000 <= Date.now()
      }));
    };

    fetchLoads();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimers((prev) => {
        const updated = { ...prev };
        loads.forEach((load) => {
          const expiresAt = new Date(load.expires_at).getTime();
          const now = new Date().getTime();
          const diff = expiresAt - now;

          if (diff <= 0) {
            updated[load.id] = 'EXPIRED';
          } else {
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            updated[load.id] = `${hours}h ${minutes}m ${seconds}s`;
          }
        });
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [loads]);

  return (
    <>
    <SiteHeader />
    <div style={{ background: '#0a0a0a', minHeight: '100vh', padding: '24px', color: '#ccc' }}>
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
      <h1 style={{ color: '#f0a500' }}>Bid Board</h1>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
          {loads.map((load) => (
            <div
              key={load.id}
              style={{
                background: '#111',
                border: '1px solid #222',
                borderLeft: '4px solid #f0a500',
                opacity: timers[load.id] === 'EXPIRED' ? 0.5 : 1,
                borderRadius: 8,
                padding: '20px 24px',
                marginBottom: 16,
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: 16,
                alignItems: 'start'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 6 }}>
                    {load.pu_city}, {load.pu_state} → {load.dl_city}, {load.dl_state}
                  </div>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: '#f0a500' }}>
                      {load.escort_type || 'Position TBD'}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
                      {load.bgc_verified && (
                        <span style={{ background: '#14532d', color: '#22c55e', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>✓ BGC</span>
                      )}
                      {load.fmcsa_verified && (
                        <span style={{ background: '#1e3a5f', color: '#60a5fa', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>✓ FMCSA</span>
                      )}
                      {load.poster_rating && (
                        <span style={{ fontSize: 11, color: '#f0a500' }}>★ {Number(load.poster_rating).toFixed(1)} ({load.poster_jobs || 0} jobs)</span>
                      )}
                    </div>
                    Posted {new Date(load.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ textAlign: 'right', minWidth: 80 }}>
                  <div style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
                    Time Left
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: timers[load.id] === 'EXPIRED' ? '#ff6b6b' : '#4ade80' }}>
                    {timers[load.id] || 'Loading...'}
                  </div>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#f0a500', marginBottom: 4 }}>
                  {load.rate != null ? `$${Number(load.rate).toLocaleString()}` : 'Rate TBD'}
                </div>
                {timers[load.id] === 'EXPIRED' ? (
                <span
                  style={{
                    display: 'block',
                    background: '#333',
                    color: '#888',
                    border: 'none',
                    borderRadius: 6,
                    padding: '8px 20px',
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: 'not-allowed',
                    width: '100%',
                    textAlign: 'center',
                    textDecoration: 'none',
                    marginTop: 8,
                    boxSizing: 'border-box',
                  }}
                >
                  Expired
                </span>
              ) : (
                <a
                  href={`/loads/${load.id}`}
                  style={{
                    display: 'block',
                    background: '#f0a500',
                    color: '#000',
                    border: 'none',
                    borderRadius: 6,
                    padding: '8px 20px',
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'center',
                    textDecoration: 'none',
                    marginTop: 8
                  }}
                >
                  View Details
                </a>
              )}
              </div>
            </div>
          ))}
      </div>
        </div>
        <BoardAdSidebar />
      </div>
    </div>
    </>
  );
}
