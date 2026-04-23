"use client";
import SiteHeader from '@/components/SiteHeader';

import { useEffect, useMemo, useState } from "react";
import { createClient } from '@/lib/supabase/client';

const toTitleCase = (str?: string) =>
  str ? str.replace(/\w\S*/g, t => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()) : '';

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY'
];

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

interface SponsoredProfile {
  id: string;
  full_name?: string | null;
  membership?: string | null;
  bgc_verified?: boolean | null;
  rating?: number | null;
  certifications?: { type: string; status: string }[] | null;
}

export function FlatRateBoardClient() {
  const [loads, setLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);
  const [stateFilter, setStateFilter] = useState<string>("");
  const [sponsoredEscorts, setSponsoredEscorts] = useState<SponsoredProfile[]>([]);

  // Fetch loads
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

  // Fetch sponsored escorts when state filter changes (mirrors app/post-load/_client.tsx)
  useEffect(() => {
    if (!stateFilter) { setSponsoredEscorts([]); return; }
    const fetchSponsored = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('sponsored_zones')
          .select('escort_id, profiles(id, full_name, membership, bgc_verified, rating, certifications(type, status))')
          .eq('state', stateFilter)
          .eq('active', true);
        if (data && data.length > 0) {
          setSponsoredEscorts(
            data.map((sz: any) => sz.profiles).filter(Boolean) as SponsoredProfile[]
          );
        } else {
          setSponsoredEscorts([]);
        }
      } catch (err) {
        console.error("Sponsored fetch error:", err);
        setSponsoredEscorts([]);
      }
    };
    fetchSponsored();
  }, [stateFilter]);

  const filteredLoads = useMemo(() => {
    if (!stateFilter) return loads;
    return loads.filter(l => l.pu_state === stateFilter || l.dl_state === stateFilter);
  }, [loads, stateFilter]);

  return (
    <>
      <SiteHeader />
      <div style={{ background: '#0a0a0a', minHeight: '100vh', color: '#ccc' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px 24px' }}>
          {/* Header row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700 }}>Flat Rate Board</h1>
            <a href="/pricing" style={{ fontSize: 12, color: '#f0a500', textDecoration: 'none' }}>⭐ Get Featured — $29.99/mo</a>
          </div>
          <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 16 }}>Fixed-rate loads · Direct hire · No bidding</p>

          {/* State filter */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginRight: 8 }}>
              Filter by state:
            </label>
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              style={{
                background: '#111',
                color: '#fff',
                border: '1px solid #333',
                borderRadius: 6,
                padding: '6px 10px',
                fontSize: 13
              }}
            >
              <option value="">All states</option>
              {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Sponsored strip — only when state selected + escorts exist */}
          {stateFilter && sponsoredEscorts.length > 0 && (
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', marginBottom: 20, paddingBottom: 4 }}>
              {sponsoredEscorts.map(esc => (
                <div
                  key={esc.id}
                  style={{
                    background: '#111',
                    border: '1px solid #f0a500',
                    borderRadius: 6,
                    padding: '8px 14px',
                    minWidth: 160,
                    flexShrink: 0,
                    fontSize: 12
                  }}
                >
                  <div style={{ fontWeight: 600, color: '#fff' }}>{esc.full_name || 'Escort'}</div>
                  {esc.bgc_verified && <span style={{ color: '#22c55e', fontSize: 11 }}>✓ BGC</span>}
                </div>
              ))}
            </div>
          )}

          {loading && <p>Loading...</p>}
          {!loading && filteredLoads.length === 0 && (
            <p style={{ color: '#6b7280' }}>
              No open flat-rate loads{stateFilter ? ` in ${stateFilter}` : ''} right now.
            </p>
          )}

          {/* Cards grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {filteredLoads.map((load) => (
                          <div
                            key={load.id}
                            style={{
                              background: '#111',
                              border: '1px solid #222',
                              borderLeft: '4px solid #f0a500',
                              borderRadius: 8,
                              padding: '20px 24px',
                              marginBottom: 16,
                              display: 'grid',
                              gridTemplateColumns: '1fr',
                              gap: 16,
                              alignItems: 'start'
                            }}
                          >
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
                                    Certs: {(load.cert_types as string[]).join(', ')}
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: 12, color: '#6b7280' }}>
                                Posted {new Date(load.created_at).toLocaleDateString()} · Expires {load.expires_at ? new Date(load.expires_at).toLocaleDateString() : '24hr'}
                              </div>
                            </div>
                            <div style={{ textAlign: 'left', minWidth: undefined }}>
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
      </div>
    </>
  );
}
