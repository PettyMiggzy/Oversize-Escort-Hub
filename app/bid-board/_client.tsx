'use client';
import SiteHeader from '@/components/SiteHeader';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { BoardAdSidebar } from '@/components/BoardAdSidebar';
import Link from 'next/link';
import PageTitle from '@/components/PageTitle';
import EmptyState from '@/components/EmptyState';

interface Load {
  id: string;
  expires_at: string;
  pu_city: string;
  pu_state: string;
  dl_city: string;
  dl_state: string;
  per_mile_rate: number | null;
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

  const [windowWidth, setWindowWidth] = useState(1200);
  useEffect(() => {
    setWindowWidth(window.innerWidth);
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const isMobile = windowWidth < 768;

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
    <div className="ui-page">
      <div className="ui-wrap">
        <PageTitle eyebrow="Boards" title="Bid board" lead="Open bid loads, with the time left on each one." />
        <div className="ui-two">
          <main style={{ minWidth: 0 }}>
        {loads.length === 0 ? (
          <EmptyState
            title="No open bid loads right now"
            text="Bid loads show up here when a carrier posts one."
            action={<Link href="/post-load" className="ui-btn">Post a load</Link>}
          />
        ) : (
        <div className="ui-grid" style={isMobile ? { gridTemplateColumns: '1fr' } : undefined}>
          {loads.map((load) => (
            <div
              key={load.id}
              className="ui-load"
              style={{ opacity: timers[load.id] === 'EXPIRED' ? 0.5 : 1 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="ui-route">
                    {load.pu_city}, {load.pu_state} → {load.dl_city}, {load.dl_state}
                  </div>
                  <div className="ui-meta" style={{ marginTop: 6 }}>
                    <span style={{ color: '#ffc46b', fontWeight: 600 }}>
                      {load.escort_type || 'Position TBD'}
                    </span>
                  </div>
                  <div className="ui-meta" style={{ marginTop: 10 }}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      {load.bgc_verified && (
                        <span className="ui-badge green">✓ BGC</span>
                      )}
                      {load.fmcsa_verified && (
                        <span className="ui-badge blue">✓ FMCSA</span>
                      )}
                      {load.poster_rating && (
                        <span style={{ color: '#ffc46b' }}>★ {Number(load.poster_rating).toFixed(1)} ({load.poster_jobs || 0} jobs)</span>
                      )}
                    </div>
                    <div style={{ marginTop: 8 }}>Posted {new Date(load.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right', minWidth: 80 }}>
                  <div className="ui-k">Time Left</div>
                  <div className="ui-v" style={{ fontSize: 16, color: timers[load.id] === 'EXPIRED' ? '#ff5a5a' : '#35d489' }}>
                    {timers[load.id] || 'Loading...'}
                  </div>
                </div>
              </div>
              <div>
                <div className="ui-k">Rate</div>
                <div className="ui-v or" style={{ marginBottom: 8 }}>
                  {load.per_mile_rate != null ? `$${Number(load.per_mile_rate).toLocaleString()}/mi` : 'Rate TBD'}
                </div>
                {timers[load.id] === 'EXPIRED' ? (
                <span className="ui-btn dim block">Expired</span>
              ) : (
                <a href={`/loads/${load.id}`} className="ui-btn block">View Details</a>
              )}
              </div>
            </div>
          ))}
      </div>
        )}
          </main>
          <BoardAdSidebar />
        </div>
      </div>
    </div>
    </>
  );
}
