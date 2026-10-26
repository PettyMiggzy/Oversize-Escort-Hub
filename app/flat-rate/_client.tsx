"use client";
import SiteHeader from '@/components/SiteHeader';

import { useEffect, useMemo, useState } from "react";
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { isAdminEmail } from '@/lib/supabase';
import { getAccessLevel, secondsUntilClaimable } from '@/lib/board-access';
import { BoardAdSidebar } from '@/components/BoardAdSidebar';
import { effectiveTier } from '@/lib/free-launch';
import PageTitle from '@/components/PageTitle';
import EmptyState from '@/components/EmptyState';

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
  bgc_verified?: boolean;
  fmcsa_verified?: boolean;
  poster_rating?: number;
  poster_jobs?: number;
  load_type?: string | null;
}

interface SponsoredProfile {
  id: string;
  full_name?: string | null;
  tier?: string | null;
  bgc_verified?: boolean | null;
  rating?: number | null;
  certifications?: { type: string; status: string }[] | null;
}

export function FlatRateBoardClient() {
  const [loads, setLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);
  const [stateFilter, setStateFilter] = useState<string>("");
  const [sponsoredEscorts, setSponsoredEscorts] = useState<SponsoredProfile[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userTier, setUserTier] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [claimedLoads, setClaimedLoads] = useState<Set<string>>(new Set());
  const [claimError, setClaimError] = useState<Record<string, string>>({});

  const [windowWidth, setWindowWidth] = useState(1200);
  // Tick every second so per-load Member countdowns re-render in real time.
  // One setState/sec for the whole board; cheaper than per-row timers.
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    setWindowWidth(window.innerWidth);
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const isMobile = windowWidth < 768;

  // Fetch current user + role
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        setUserEmail(user.email ?? null);
        supabase.from('profiles').select('role, tier').eq('id', user.id).single()
        .then(({ data: p }) => {
          const prof = p as { role?: string; tier?: string } | null
          setUserRole(prof?.role ?? null)
          setUserTier(effectiveTier(prof?.tier, prof?.role))
        });
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
        supabase.from('profiles').select('role, tier').eq('id', session.user.id).single()
        .then(({ data: p }) => {
          const prof = p as { role?: string; tier?: string } | null
          setUserRole(prof?.role ?? null)
          setUserTier(effectiveTier(prof?.tier, prof?.role))
        });
      } else {
        setUserId(null);
        setUserRole(null);
        setUserTier(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Fetch loads
  useEffect(() => {
    const fetchLoads = async () => {
      try {
        const supabase = createClient();
        // Tier-based gating is enforced in the button UI (see Claim button below),
        // not at the query level. Every authenticated escort sees every open load.
        let q = supabase
          .from("loads")
          .select("*")
          .eq("board_type", "flat-rate")
          .eq("status", "open");
        const { data, error } = await q;

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
  }, [userTier, userEmail]);

  // Fetch sponsored escorts when state filter changes (mirrors app/post-load/_client.tsx)
  useEffect(() => {
    if (!stateFilter) { setSponsoredEscorts([]); return; }
    const fetchSponsored = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('sponsored_zones')
          .select('user_id, profiles:user_id(id, full_name, tier, bgc_verified, rating, certifications(type, status))')
          .eq('zone', stateFilter)
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

  const handleClaim = async (loadId: string) => {
    if (!userId) { window.location.href = '/signin'; return; }
    if (userRole !== 'escort' && userRole !== 'fleet_manager') {
      setClaimError(prev => ({ ...prev, [loadId]: 'Only escorts can claim loads' }));
      return;
    }
    const res = await fetch('/api/loads/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ load_id: loadId, escort_id: userId })
    });
    if (res.ok) {
      setClaimedLoads(prev => {
        const next = new Set(prev);
        next.add(loadId);
        return next;
      });
    } else {
      let msg = 'Failed to claim load';
      try {
        const d = await res.json();
        if (d?.error) msg = d.error;
      } catch {}
      setClaimError(prev => ({ ...prev, [loadId]: msg }));
    }
  };

  return (
    <>
      <SiteHeader />
      <div className="ui-page">
        <div className="ui-wrap">
          <PageTitle eyebrow="Boards" title="Flat rate board" lead="Fixed-rate loads. Direct hire. No bidding." />
          <div className="ui-two">
            <main style={{ minWidth: 0 }}>
          <div className="ui-filters">
            <div style={{ flex: '1 1 200px', minWidth: 0 }}>
              <label className="ui-label" htmlFor="flat-state">Filter by state</label>
              <select
                id="flat-state"
                className="ui-select"
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
              >
                <option value="">All states</option>
                {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {stateFilter && sponsoredEscorts.length > 0 && (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
              {sponsoredEscorts.map(esc => (
                <div key={esc.id} className="ui-card" style={{ padding: '12px 16px', flex: '1 1 160px', minWidth: 0 }}>
                  <div className="ui-route" style={{ fontSize: 15 }}>{esc.full_name || 'Escort'}</div>
                  {esc.bgc_verified && <span className="ui-badge green" style={{ marginTop: 8 }}>✓ BGC</span>}
                </div>
              ))}
            </div>
          )}

          {loading && <p className="ui-meta">Loading...</p>}
          {!loading && filteredLoads.length === 0 && (
            <EmptyState
              title={stateFilter ? `No open flat-rate loads in ${stateFilter}` : 'No open flat-rate loads right now'}
              text="Fixed-rate loads show up here when a carrier posts one."
              action={<Link href="/post-load" className="ui-btn">Post a load</Link>}
            />
          )}

          {filteredLoads.length > 0 && (
          <div className="ui-grid" style={isMobile ? { gridTemplateColumns: '1fr' } : undefined}>
            {filteredLoads.map((load) => (
                          <div key={load.id} className="ui-load">
                            <div>
                              {load.load_type === 'breakdown' && (
          <div className="ui-badge red" style={{ marginBottom: 6 }}>
            🚨 BREAKDOWN ASSISTANCE
          </div>
        )}
        <div className="ui-route">
                                {toTitleCase(load.pu_city)}, {load.pu_state} → {toTitleCase(load.dl_city)}, {load.dl_state}
                              </div>
                              <div className="ui-meta" style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 8 }}>
                                <span style={{ color: '#ffc46b', fontWeight: 600 }}>
                                  {load.escort_type || 'Position TBD'}
                                </span>
                                <span>
                                  {load.escort_count || 1} escort{(load.escort_count || 1) > 1 ? 's' : ''} needed
                                </span>
                                {load.cert_types && load.cert_types.length > 0 && (
                                  <span>
                                    Certs: {(load.cert_types as string[]).join(', ')}
                                  </span>
                                )}
                              </div>
                              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10, alignItems: 'center' }}>
                                {load.bgc_verified && (
                                  <span className="ui-badge green">✓ BGC</span>
                                )}
                                {load.fmcsa_verified && (
                                  <span className="ui-badge blue">✓ FMCSA</span>
                                )}
                                {load.poster_rating && (
                                  <span className="ui-meta" style={{ color: '#ffc46b' }}>★ {Number(load.poster_rating).toFixed(1)} ({load.poster_jobs || 0} jobs)</span>
                                )}
                              </div>
                              <div className="ui-meta" style={{ marginTop: 8 }}>
                                Posted {new Date(load.created_at).toLocaleDateString()} · Expires {load.expires_at ? new Date(load.expires_at).toLocaleDateString() : '24hr'}
                              </div>
                            </div>
                            <div>
                              <div className="ui-k">Rate</div>
                              <div className="ui-v or">
                                {load.per_mile_rate != null
                                  ? `$${load.per_mile_rate}/mi`
                                  : 'Negotiable'}
                              </div>
                              <div className="ui-meta" style={{ margin: '4px 0 12px' }}>
                                $250 no-go · $100 overnight
                              </div>
                              {claimError[load.id] && (
                                <div className="ui-err">{claimError[load.id]}</div>
                              )}
                              {(() => {
                                // Tier-aware claim CTA. See lib/board-access.ts for the rules.
                                if (userRole === 'carrier' || userRole === 'broker') {
                                  // Posting accounts do not claim loads; no upgrade prompt for them.
                                  return <div className="ui-meta" style={{ textAlign: 'center' }}>Escorts claim loads from here</div>;
                                }
                                const access = getAccessLevel(userTier, isAdminEmail(userEmail));
                                const claimed = claimedLoads.has(load.id);
                                const remaining = access === 'delayed'
                                  ? secondsUntilClaimable(load.created_at, now)
                                  : 0;
                                const locked = access === 'delayed' && remaining > 0;
                                if (access === 'none') {
                                  // Free / trial / unknown tier: hard upgrade CTA.
                                  return (
                                    <Link href="/pricing" className="ui-btn block ghost">
                                      Upgrade to Member →
                                    </Link>
                                  );
                                }
                                return (
                                  <button
                                    onClick={() => handleClaim(load.id)}
                                    disabled={claimed || locked}
                                    className={claimed ? 'ui-btn block ok' : locked ? 'ui-btn block dim' : 'ui-btn block'}
                                  >
                                    {claimed
                                      ? 'Request Sent ✓'
                                      : locked
                                        ? `Available in ${remaining}s...`
                                        : 'Claim Load'}
                                  </button>
                                );
                              })()}
                              {userId && load.status === 'filled' && (
                                <a href={`/review/${load.id}`} className="ui-btn ghost block" style={{ marginTop: 8 }}>
                                  Leave a Review
                                </a>
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
