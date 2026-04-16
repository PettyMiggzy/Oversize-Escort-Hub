'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';

interface Load {
  id: string;
  expires_at: string;
  pickup_city: string;
  destination_city: string;
  rate: number;
  escort_type: string;
  created_at: string;
  status: string;
}

export default function BidBoard() {
  const [loads, setLoads] = useState<Load[]>([]);
  const [timers, setTimers] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const fetchLoads = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('loads')
        .select('*')
        .eq('board_type', 'bid')
        .eq('status', 'open')
        .order('created_at', { ascending: false });
      
      if (data) setLoads(data);
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
    <div style={{ padding: '20px', background: '#060b16', color: '#e0e0e0', minHeight: '100vh' }}>
      <h1 style={{ color: '#f0a500' }}>Bid Board</h1>
      <div style={{ display: 'grid', gap: '16px' }}>
        {loads.map((load) => (
          <div
            key={load.id}
            style={{
              background: '#0d1117',
              padding: '16px',
              borderRadius: '8px',
              borderLeft: '4px solid #f0a500',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <h3 style={{ margin: '0 0 8px', color: '#f0a500' }}>
                  {load.pickup_city} → {load.destination_city}
                </h3>
                <p style={{ margin: '0 0 4px', fontSize: '14px' }}>Type: {load.escort_type}</p>
                <p style={{ margin: '0 0 4px', fontSize: '14px' }}>Rate: ${load.rate}</p>
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
  );
}
