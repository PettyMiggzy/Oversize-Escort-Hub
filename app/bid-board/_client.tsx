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
      <div style={{ display: 'grid', gap: '16px' }}>
        {loads.map((load) => (
          <div
            key={load.id}
            style={{
        background: 'var(--p1, #111)',
        border: '1px solid #222',
        borderLeft: '3px solid #f0a500',
        padding: '16px 20px',
        marginBottom: '12px',
        borderRadius: '4px',
      }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <h3 style={{ margin: '0 0 8px', color: '#f0a500' }}>
                  {load.pu_city}, {load.pu_state} → {load.dl_city}, {load.dl_state}
                </h3>
                <p style={{ margin: '0 0 4px', fontSize: '14px' }}>Type: {load.escort_type}</p>
                <p style={{ margin: '0 0 4px', fontSize: '14px' }}>Rate: ${load.rate != null ? Number(load.rate).toLocaleString() : 'TBD'}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: timers[load.id] === 'EXPIRED' ? '#ff6b6b' : '#4ade80' }}>
                  {timers[load.id] || 'Loading...'}
                </div>
              </div>
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
