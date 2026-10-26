"use client";
import SiteHeader from '@/components/SiteHeader';

import { useEffect, useMemo, useState } from "react";
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { isAdminEmail } from '@/lib/supabase';
import { getAccessLevel, secondsUntilClaimable } from '@/lib/board-access';
import { BoardAdSidebar } from '@/components/BoardAdSidebar';
import { effectiveTier } from '@/lib/free-launch';
import { isNativeApp } from '@/lib/native';
import PageTitle from '@/components/PageTitle';
import BoardTabs from '@/components/BoardTabs';
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

  const [inApp, setInApp] = useState(false);
  useEffect(() => { setInApp(isNativeApp()); }, []);
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
          .eq('active', true)
          .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);
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

  const claimBtn = (load: Load) => {
    // Tier-aware claim CTA. See lib/board-access.ts for the rules.
    if (userRole === 'carrier' || userRole === 'broker') {
      // Posting accounts do not claim loads; no upgrade prompt for them.
      return <div className="ui-meta" style={{ textAlign: 'center' }}>Escorts claim loads from here</div>;
    }
    if (!userId) return <Link href="/signin?redirect=/flat-rate" className="ui-btn block ghost">Sign in to claim</Link>;
    const access = getAccessLevel(userTier, isAdminEmail(userEmail));
    const claimed = claimedLoads.has(load.id);
    const remaining = access === 'delayed' ? secondsUntilClaimable(load.created_at, now) : 0;
    const locked = access === 'delayed' && remaining > 0;
    if (access === 'none') {
      // Free / trial / unknown tier: hard upgrade CTA.
      return <Link href="/pricing" className="ui-btn block ghost">Upgrade to Member &rarr;</Link>;
    }
    return (
      <button
        className={`ui-btn block${locked ? ' dim' : ''}`}
        onClick={() => handleClaim(load.id)}
        disabled={claimed || locked}
        style={claimed ? { background: '#35d489', color: '#04140c', boxShadow: 'none' } : undefined}
      >
        {claimed ? 'Request sent \u2713' : locked ? `Available in ${remaining}s...` : 'Claim load'}
      </button>
    );
  };

  return (
    <>
      <SiteHeader />
      <div className="ui-page">
        <div className="ui-wrap">
          <PageTitle
            eyebrow="Find loads"
            title="Flat rate board"
            lead="Fixed-rate loads. Direct hire. No bidding."
            right={
              <div style={{ minWidth: 180 }}>
                <label className="ui-label" htmlFor="state-filter">Filter by state</label>
                <select id="state-filter" className="ui-select" value={stateFilter} onChange={(e) => setStateFilter(e.target.value)}>
                  <option value="">All states</option>
                  {US_STATES.map(st => <option key={st} value={st}>{st}</option>)}
                </select>
              </div>
            }
          />
          <BoardTabs active="flat" />
          <div className={filteredLoads.length === 0 ? undefined : "ui-two"}>
            <div style={{ minWidth: 0 }}>
              {/* Sponsored strip: only when a state is selected and sponsored escorts exist. Not shown inside the phone app. */}
              {!inApp && stateFilter && sponsoredEscorts.length > 0 && (
                <div style={{ display: 'flex', gap: 10, overflowX: 'auto', marginBottom: 20, paddingBottom: 4 }}>
                  {sponsoredEscorts.map(esc => (
                    <div key={esc.id} className="ui-side-card" style={{ minWidth: 170, flexShrink: 0, margin: 0, padding: '10px 14px', borderColor: 'rgba(255,196,107,.4)' }}>
                      <div className="t" style={{ margin: '0 0 4px', fontSize: 14 }}>{esc.full_name || 'Escort'}</div>
                      {esc.bgc_verified && <span className="ui-badge green">&#10003; BGC</span>}
                    </div>
                  ))}
                </div>
              )}

              {loading && <p className="ui-meta">Loading&hellip;</p>}
              {!loading && filteredLoads.length === 0 && (
                <EmptyState
                  title={stateFilter ? `No flat-rate loads in ${stateFilter}` : 'No flat-rate loads right now'}
                  text="New loads appear here the moment a carrier posts them. Try another state, or check back soon."
                  action={<Link href={userId ? "/post-load" : "/quick-post"} className="ui-btn">Post a load</Link>}
                />
              )}

              <div className="ui-grid" style={isMobile ? { gridTemplateColumns: '1fr' } : undefined}>
                {filteredLoads.map((load) => (
                  <div key={load.id} className="ui-load">
                    <div>
                      {load.load_type === 'breakdown' && (
                        <span className="ui-badge" style={{ background: 'rgba(255,90,90,.16)', color: '#ff8a8a', border: '1px solid rgba(255,90,90,.45)', marginBottom: 8 }}>&#128680; Breakdown assistance</span>
                      )}
                      <div className="ui-route">{toTitleCase(load.pu_city)}, {load.pu_state} &rarr; {toTitleCase(load.dl_city)}, {load.dl_state}</div>
                      <div className="ui-meta" style={{ marginTop: 6 }}>
                        <span style={{ color: '#ffc46b', fontWeight: 600 }}>{load.escort_type || 'Position TBD'}</span>
                        {' '}&middot; {load.escort_count || 1} escort{(load.escort_count || 1) > 1 ? 's' : ''} needed
                      </div>
                      {load.cert_types && load.cert_types.length > 0 && (
                        <div className="ui-meta" style={{ marginTop: 6, color: '#6b7686' }}>Certs: {(load.cert_types as string[]).join(', ')}</div>
                      )}
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 10 }}>
                        {load.bgc_verified && <span className="ui-badge green">&#10003; BGC</span>}
                        {load.fmcsa_verified && <span className="ui-badge blue">&#10003; FMCSA</span>}
                        {load.poster_rating && <span className="ui-meta" style={{ color: '#ffc46b' }}>&#9733; {Number(load.poster_rating).toFixed(1)} ({load.poster_jobs || 0} jobs)</span>}
                      </div>
                      <div className="ui-meta" style={{ marginTop: 8 }}>
                        Posted {new Date(load.created_at).toLocaleDateString()} &middot; Expires {load.expires_at ? new Date(load.expires_at).toLocaleDateString() : '24hr'}
                      </div>
                    </div>
                    <div>
                      <div className="ui-v or" style={{ fontSize: 26 }}>{load.per_mile_rate != null ? `$${load.per_mile_rate}/mi` : 'Negotiable'}</div>
                      <div className="ui-meta" style={{ margin: '2px 0 14px', color: '#6b7686' }}>$250 no-go &middot; $100 overnight</div>
                      {claimError[load.id] && <div className="ui-meta" style={{ color: '#ff8a8a', marginBottom: 8 }}>{claimError[load.id]}</div>}
                      {claimBtn(load)}
                      {userId && load.status === 'filled' && (
                        <a href={`/review/${load.id}`} className="ui-meta" style={{ display: 'block', textAlign: 'center', marginTop: 8 }}>Leave a review</a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {filteredLoads.length > 0 && <BoardAdSidebar />}
          </div>
        </div>
      </div>
    </>
  );
}
