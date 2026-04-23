"use client";
import SiteHeader from '@/components/SiteHeader';

import { useEffect, useState } from "react";
import { createClient } from '@/lib/supabase/client';

const toTitleCase = (str?: string) =>
  str ? str.replace(/\w\S*/g, t => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()) : '';

interface Load {
  id: string;
  created_at: string;
  expires_at?: string;
  escort_type?: string | null;
  escort_count?: number | null;
  cert_types?: string[] | null;
  rate?: number | null;
  per_mile_rate?: number | null;
  status: string;
  pu_city?: string;
  pu_state?: string;
  dl_city?: string;
  dl_state?: string;
  deadhead_notified_at?: string | null;
}

export function FlatRateBoardClient() {
  const [loads, setLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLoads = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("loads")
          .select("*")
          .eq("board_type", "flat-rate")
          .eq("status", "open");

        if (error) {
          console.error("Error fetching loads:", error);
        } else {
          setLoads(
            (data || []).filter((load: any) => {
              if (!load.deadhead_notified_at) return true;
              return new Date(load.deadhead_notified_at).getTime() + 5 * 60 * 1000 <= Date.now();
            })
          );
        }
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLoads();
  }, []);

  return (
    <>
      <SiteHeader />
      <div style={{ background: '#0a0a0a', minHeight: '100vh', padding: '32px 24px', color: '#ccc', maxWidth: 800, margin: '0 auto' }}>
        <h1>Flat Rate Board</h1>
        <div style={{ marginTop: '20px' }}>
          {loading && <p>Loading...</p>}
          {!loading && loads.length === 0 && <p>No open flat-rate loads right now.</p>}
          {loads.map((load) => (
            <div
              key={load.id}
              style={{
                background: '#111',
                border: '1px solid #222',
                borderLeft: '4px solid #f0a500',
                borderRadius: 8,
                padding: '20px 24px',
                marginBottom: 16,
                maxWidth: 720,
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: 16,
                alignItems: 'start'
              }}
            >
              {/* Left side */}
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 6 }}>
                  {toTitleCase(load.pu_city)}, {load.pu_state} → {toTitleCase(load.dl_city)}, {load.dl_state}
                </div>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: '#f0a500' }}>
                    {load.escort_type || 'Position TBD'}
                  </span>
                  <span style={{ fontSize: 13, color: '#9ca3af' }}>
                    {load.escort_count || 1} escort{(load.escort_count || 1) > 1 ? 's' : ''} needed
                  </span>
                  {load.cert_types && load.cert_types.length > 0 && (
                    <span style={{ fontSize: 12, color: '#6b7280' }}>
                      Certs: {load.cert_types.join(', ')}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>
                  Posted {new Date(load.created_at).toLocaleDateString()} · Expires {load.expires_at ? new Date(load.expires_at).toLocaleDateString() : '24hr'}
                </div>
              </div>
              {/* Right side */}
              <div style={{ textAlign: 'right', minWidth: 140 }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#f0a500', marginBottom: 4 }}>
                  {load.per_mile_rate
                    ? `$${load.per_mile_rate}/mi`
                    : load.rate
                    ? `$${load.rate}/mi`
                    : 'Negotiable'}
                </div>
                <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 12 }}>
                  $250 no-go · $100 overnight
                </div>
                <button
                  style={{
                    background: '#f0a500',
                    color: '#000',
                    border: 'none',
                    borderRadius: 6,
                    padding: '8px 20px',
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: 'pointer',
                    width: '100%'
                  }}
                >
                  Claim Load
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
