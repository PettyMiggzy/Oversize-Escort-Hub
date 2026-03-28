"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

type BidLoad = {
  id: string;
  origin: string;
  dest: string;
  miles: number;
  rate: number;
  pos: string;
  certs: string[];
  score: number;
  bids: number;
  timer: number; // seconds remaining
  status: "live" | "expired";
  isSample?: boolean;
};

const MOCK_BID_LOADS: BidLoad[] = [
  {
    id: "BID-771",
    origin: "Dallas, TX",
    dest: "Memphis, TN",
    miles: 473,
    rate: 2.0,
    pos: "Lead",
    certs: ["P/EVO"],
    score: 4.7,
    bids: 3,
    timer: 187,
    status: "live",
    isSample: true,
  },
  {
    id: "BID-664",
    origin: "Phoenix, AZ",
    dest: "Albuquerque, NM",
    miles: 467,
    rate: 2.0,
    pos: "Lead",
    certs: ["P/EVO", "Witpac"],
    score: 4.8,
    bids: 1,
    timer: 260,
    status: "live",
    isSample: true,
  },
  {
    id: "BID-559",
    origin: "Houston, TX",
    dest: "New Orleans, LA",
    miles: 349,
    rate: 2.0,
    pos: "Rear",
    certs: ["P/EVO"],
    score: 4.6,
    bids: 5,
    timer: 44,
    status: "live",
    isSample: true,
  },
  {
    id: "BID-412",
    origin: "Atlanta, GA",
    dest: "Charlotte, NC",
    miles: 244,
    rate: 2.0,
    pos: "Lead+Rear",
    certs: ["P/EVO"],
    score: 4.4,
    bids: 2,
    timer: 92,
    status: "live",
    isSample: true,
  },
];

function fmtTimer(s: number) {
  if (s <= 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function BidBoardPage() {
  const [loads, setLoads] = useState<BidLoad[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [timers, setTimers] = useState<Record<string, number>>({});
  const [q, setQ] = useState("");
  const [pos, setPos] = useState("All");
  const [state, setState] = useState("All");
  const [sort, setSort] = useState<"EndsSoon" | "Newest">("EndsSoon");

  useEffect(() => {
    async function fetchBidLoads() {
      const { data } = await supabase
        .from("loads")
        .select("*")
        .eq("board_type", "bid")
        .eq("status", "open")
        .order("created_at", { ascending: false });

      if (data && data.length > 0) {
        // Map Supabase loads to BidLoad shape
        const mapped: BidLoad[] = data.map((l: any) => ({
          id: l.id.slice(0, 8).toUpperCase(),
          origin: `${l.pu_city}, ${l.pu_state}`,
          dest: `${l.dl_city}, ${l.dl_state}`,
          miles: l.miles ?? 0,
          rate: l.per_mile_rate ?? 2.0,
          pos: l.position,
          certs: [
            l.requires_p_evo && "P/EVO",
            l.requires_witpac && "Witpac",
            l.requires_ny_cert && "NY",
            l.requires_twic && "TWIC",
          ].filter(Boolean) as string[],
          score: l.poster_rating ?? 4.5,
          bids: 0,
          timer: 300, // 5 min default
          status: "live" as const,
          isSample: false,
        }));
        setLoads(mapped);
        setTimers(Object.fromEntries(mapped.map((l) => [l.id, l.timer])));
      } else {
        setLoads(MOCK_BID_LOADS);
        setTimers(Object.fromEntries(MOCK_BID_LOADS.map((l) => [l.id, l.timer])));
      }
      setLoadingData(false);
    }
    fetchBidLoads();
  }, []);

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimers((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((k) => {
          if (next[k] > 0) next[k]--;
        });
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const hasSamples = loads.some((l) => l.isSample);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    let out = [...loads];
    if (query) {
      out = out.filter((l) =>
        [l.id, l.origin, l.dest, l.pos, ...l.certs].join(" ").toLowerCase().includes(query)
      );
    }
    if (pos !== "All") out = out.filter((l) => l.pos.includes(pos));
    if (state !== "All") {
      out = out.filter((l) => l.origin.includes(state) || l.dest.includes(state));
    }
    if (sort === "EndsSoon") {
      out.sort((a, b) => (timers[a.id] ?? 0) - (timers[b.id] ?? 0));
    }
    return out;
  }, [loads, q, pos, state, sort, timers]);

  return (
    <main style={B.main}>
      {/* Ticker */}
      <div style={B.tickerBar}>
        <div style={B.ticker}>
          🔥 Bid Board Live • 5-Min Window • Lowest reasonable bid wins • Ties break by Rank • Pro gets first 60s + SMS •
          Pay terms shown upfront • Post loads FREE unlimited
        </div>
      </div>

      {/* Nav header */}
      <header style={B.header}>
        <a href="/" style={B.brandWrap}>
          <div style={B.brand}>OVERSIZE ESCORT HUB</div>
          <div style={B.subBrand}>LIVE • RANKED • VERIFIED</div>
        </a>
        <nav style={B.nav}>
          <a href="/" style={B.navLink}>Home</a>
          <a href="/loads" style={B.navLink}>Loads</a>
          <a href="/bid-board" style={{ ...B.navLink, ...B.navActive }}>Bid Board</a>
          <a href="/pricing" style={B.navLink}>Membership</a>
          <a href="/verify" style={B.navLink}>Verification</a>
          <a href="/post-load" style={B.cta}>Post Load (FREE)</a>
        </nav>
      </header>

      {/* Page head */}
      <div style={B.pageHead}>
        <div>
          <h1 style={B.h1}>5-Minute Bid Board</h1>
          <p style={B.sub}>
            Loads close on timer. Pro members see loads first (SMS instant), Members get 60s delay. First to lowest
            reasonable bid wins.
          </p>
        </div>
        <div style={B.rightChips}>
          <span style={B.chip}>Window: 5 min</span>
          <span style={B.chip}>Pro: SMS Instant</span>
          <span style={B.chip}>Member: 60s delay</span>
        </div>
      </div>

      {/* Sample banner */}
      {hasSamples && !loadingData && (
        <div style={B.sampleBanner}>
          <span style={B.sampleIcon}>🚀</span>
          <div>
            <div style={B.sampleTitle}>Sample Data — Platform Launching Soon</div>
            <div style={B.sampleDesc}>
              Early members get first access to every real bid load posted. Lock in your Pro spot now.
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={B.filters}>
        <input
          style={B.search}
          placeholder="Search route, city, position, cert..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select style={B.select} value={state} onChange={(e) => setState(e.target.value)}>
          <option value="All">All States</option>
          {["TX", "LA", "AZ", "NM", "GA", "NC", "FL", "TN", "CA", "NV", "IN", "OH"].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select style={B.select} value={pos} onChange={(e) => setPos(e.target.value)}>
          <option value="All">All Positions</option>
          <option value="Lead">Lead</option>
          <option value="Rear">Rear</option>
          <option value="Lead+Rear">Lead+Rear</option>
        </select>
        <select style={B.select} value={sort} onChange={(e) => setSort(e.target.value as "EndsSoon" | "Newest")}>
          <option value="EndsSoon">Ends Soonest</option>
          <option value="Newest">Newest First</option>
        </select>
        <div style={B.count}>
          <b>{filtered.length}</b> auction{filtered.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Board + sidebar */}
      <div style={B.grid}>
        <section style={B.board}>
          {loadingData ? (
            <div style={B.empty}>Loading bid board...</div>
          ) : filtered.length === 0 ? (
            <div style={B.empty}>
              No auctions match your filters.
              <div style={B.emptySub}>Try clearing search/filters.</div>
            </div>
          ) : (
            filtered.map((l) => {
              const t = timers[l.id] ?? 0;
              const isLive = l.status === "live" && t > 0;
              const timerCls = t > 60 ? "timer-am" : "timer-hot";
              const timerColor = t > 120 ? "#f5a200" : "#ff3535";

              return (
                <div key={l.id} style={{ ...B.card, borderColor: isLive ? "rgba(245,162,0,0.4)" : "rgba(28,34,41,0.8)" }}>
                  <div style={B.cardGrid}>
                    {/* Left: load info */}
                    <div style={B.cardInfo}>
                      <div style={B.cardId}>
                        {l.id}
                        {l.isSample && <span style={B.sampleBadge}>SAMPLE</span>}
                      </div>
                      <div style={B.cardRoute}>
                        {l.origin} → {l.dest}
                      </div>
                      <div style={B.cardMeta}>
                        {l.miles} mi &nbsp;·&nbsp; {l.pos}
                        {l.certs.length > 0 && (
                          <span>
                            {" "}·{" "}
                            {l.certs.map((c) => (
                              <span key={c} style={B.certBadge}>{c}</span>
                            ))}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Center: rate + score */}
                    <div style={B.cardCenter}>
                      <div style={B.cardRate}>${l.rate.toFixed(2)}/mi</div>
                      <div style={B.cardRateLabel}>Ceiling rate</div>
                      <div style={B.cardScore}>{l.score} ⭐</div>
                      <div style={B.cardScoreLabel}>Pay Score</div>
                    </div>

                    {/* Right: timer + bid button */}
                    <div style={B.cardRight}>
                      {isLive ? (
                        <>
                          <div style={{ ...B.timer, color: timerColor }}>{fmtTimer(t)}</div>
                          <div style={B.timerLabel}>Time Remaining</div>
                          <div style={B.bidCount}>{l.bids} bids</div>
                          <a href="/pricing" style={B.bidBtn}>🔒 BID (MEMBER)</a>
                        </>
                      ) : (
                        <span style={B.expiredBadge}>EXPIRED</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </section>

        <aside style={B.sidebar}>
          <div style={B.sideCard}>
            <div style={B.sideTitle}>How Bidding Works</div>
            <div style={B.sideText}>
              Loads close after 5 minutes. Lowest reasonable bid that meets requirements wins. Ties break by platform
              rank.
            </div>
            <div style={B.sideMini}>
              <div>• Pro: SMS instant on new loads</div>
              <div>• Member: 60s delay after Pro</div>
              <div>• Free: View only</div>
            </div>
          </div>

          <div style={B.sideCard}>
            <div style={B.sideTitle}>Pro Advantage</div>
            <div style={B.sideText}>
              First 60s access + SMS alerts + priority tie-break. One recovered run pays for Pro 10× over.
            </div>
            <a href="/pricing" style={B.sideCta}>Upgrade to Pro →</a>
          </div>

          <div style={B.sideCard}>
            <div style={B.sideTitle}>Post a Bid Load</div>
            <div style={B.sideText}>Carriers: post to the 5-min bid board free. Get competitive pricing fast.</div>
            <a href="/post-load" style={B.sideCta}>Post Load Free →</a>
          </div>
        </aside>
      </div>

      {/* Footer */}
      <footer style={B.footer}>
        <div style={B.footerLeft}>
          <div style={B.footerBrand}>OVERSIZE ESCORT HUB</div>
          <div style={B.footerSub}>support@oversize-escort-hub.com • verification@oversize-escort-hub.com</div>
        </div>
        <div style={B.footerRight}>
          <a href="/terms" style={B.footerLink}>Terms</a>
          <a href="/privacy" style={B.footerLink}>Privacy</a>
          <a href="/conduct" style={B.footerLink}>Conduct</a>
        </div>
      </footer>

      <style>{`@keyframes tickerMove { from { transform: translateX(100%); } to { transform: translateX(-100%); } }`}</style>
    </main>
  );
}

const B: Record<string, React.CSSProperties> = {
  main: {
    minHeight: "100vh",
    background: "#060b16",
    color: "#e5e7eb",
    fontFamily: '"Inter", ui-sans-serif, system-ui, -apple-system, sans-serif',
  },

  tickerBar: {
    overflow: "hidden",
    borderBottom: "1px solid rgba(255,255,255,0.10)",
    background: "linear-gradient(180deg, rgba(0,0,0,0.65), rgba(0,0,0,0.90))",
  },
  ticker: {
    whiteSpace: "nowrap",
    padding: "10px 0",
    color: "#00b4ff",
    fontSize: 14,
    display: "inline-block",
    animation: "tickerMove 26s linear infinite",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px clamp(16px, 4vw, 48px)",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.02)",
    flexWrap: "wrap",
    gap: 12,
  },
  brandWrap: { textDecoration: "none", color: "inherit" },
  brand: {
    fontSize: "clamp(16px, 3vw, 26px)",
    fontWeight: 950,
    color: "#00b4ff",
    textShadow: "0 0 20px rgba(0,180,255,0.35)",
    letterSpacing: 0.4,
  },
  subBrand: { marginTop: 4, fontSize: 12, opacity: 0.7, letterSpacing: 2 },
  nav: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" },
  navLink: { color: "rgba(229,231,235,0.85)", textDecoration: "none", fontWeight: 800, fontSize: 13 },
  navActive: { color: "#00b4ff" },
  cta: {
    textDecoration: "none",
    padding: "8px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "linear-gradient(135deg, #00a8e8, #1fb6ff)",
    color: "#001018",
    fontWeight: 950,
    fontSize: 12,
  },

  pageHead: {
    padding: "18px clamp(16px, 4vw, 48px) 10px",
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-end",
    flexWrap: "wrap",
  },
  h1: { margin: 0, fontSize: "clamp(22px, 4vw, 30px)", fontWeight: 950 },
  sub: { marginTop: 6, marginBottom: 0, fontSize: 13, color: "rgba(229,231,235,0.65)", maxWidth: 640 },
  rightChips: { display: "flex", gap: 8, flexWrap: "wrap" },
  chip: {
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.18)",
    color: "rgba(229,231,235,0.82)",
    fontWeight: 900,
    fontSize: 11,
  },

  sampleBanner: {
    margin: "0 clamp(16px, 4vw, 48px) 12px",
    background: "linear-gradient(135deg,rgba(245,162,0,.08),rgba(255,98,0,.06))",
    border: "1px solid rgba(245,162,0,0.2)",
    borderRadius: 4,
    padding: "14px 18px",
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
  },
  sampleIcon: { fontSize: 22, flexShrink: 0 },
  sampleTitle: { fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#f5a200", fontWeight: 600, marginBottom: 4 },
  sampleDesc: { fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#6e7a88", lineHeight: 1.6 },

  filters: {
    padding: "12px clamp(16px, 4vw, 48px) 14px",
    display: "flex",
    gap: 8,
    alignItems: "center",
    flexWrap: "wrap",
  },
  search: {
    flex: "1 1 250px",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.22)",
    color: "#e5e7eb",
    fontWeight: 750,
    fontSize: 13,
    outline: "none",
    minWidth: 0,
  },
  select: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.22)",
    color: "#e5e7eb",
    fontWeight: 850,
    fontSize: 12,
    outline: "none",
  },
  count: { marginLeft: "auto", fontSize: 12, color: "rgba(229,231,235,0.62)", fontWeight: 800 },

  grid: {
    padding: "0 clamp(16px, 4vw, 48px) 0",
    display: "grid",
    gridTemplateColumns: "1fr clamp(200px, 25vw, 300px)",
    gap: 14,
    alignItems: "start",
  },

  board: {
    display: "grid",
    gap: 10,
  },

  card: {
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(28,34,41,0.8)",
    borderLeft: "3px solid rgba(245,162,0,0.4)",
    borderRadius: 4,
    padding: "16px 20px",
  },
  cardGrid: {
    display: "grid",
    gridTemplateColumns: "1fr auto auto",
    gap: 20,
    alignItems: "center",
  },
  cardInfo: {},
  cardId: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 9,
    color: "#6e7a88",
    marginBottom: 4,
    letterSpacing: "0.1em",
  },
  cardRoute: { fontWeight: 700, fontSize: 15, color: "#fff", marginBottom: 4 },
  cardMeta: { fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#6e7a88" },

  cardCenter: { textAlign: "center", minWidth: 100 },
  cardRate: { fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: 26, color: "#00cc7a", lineHeight: 1 },
  cardRateLabel: { fontFamily: "'DM Mono', monospace", fontSize: 8, color: "#6e7a88", marginBottom: 8 },
  cardScore: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 11,
    padding: "2px 8px",
    borderRadius: 2,
    background: "rgba(0,204,122,.1)",
    color: "#00cc7a",
    border: "1px solid rgba(0,204,122,.2)",
    display: "inline-block",
  },
  cardScoreLabel: { fontFamily: "'DM Mono', monospace", fontSize: 8, color: "#6e7a88", marginTop: 4 },

  cardRight: { textAlign: "center", minWidth: 120 },
  timer: { fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: 32, lineHeight: 1, letterSpacing: "0.04em" },
  timerLabel: { fontFamily: "'DM Mono', monospace", fontSize: 8, color: "#6e7a88", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 },
  bidCount: { fontFamily: "'DM Mono', monospace", fontSize: 9, color: "#6e7a88", marginBottom: 8 },
  bidBtn: {
    display: "block",
    textDecoration: "none",
    fontFamily: "'DM Mono', monospace",
    fontSize: 9,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    fontWeight: 700,
    padding: "8px 14px",
    background: "rgba(245,162,0,.1)",
    border: "1px solid rgba(245,162,0,.3)",
    color: "#f5a200",
    textAlign: "center",
  },
  expiredBadge: {
    fontFamily: "'DM Mono', monospace",
    fontSize: 11,
    padding: "6px 14px",
    background: "rgba(110,122,136,.12)",
    border: "1px solid rgba(110,122,136,.2)",
    color: "#6e7a88",
    borderRadius: 2,
  },

  sampleBadge: {
    marginLeft: 8,
    display: "inline-flex",
    alignItems: "center",
    fontFamily: "'DM Mono', monospace",
    fontSize: 8,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    padding: "2px 6px",
    borderRadius: 2,
    background: "rgba(245,162,0,.06)",
    color: "#f5a200",
    border: "1px solid rgba(245,162,0,.15)",
  },
  certBadge: {
    display: "inline-flex",
    alignItems: "center",
    fontFamily: "'DM Mono', monospace",
    fontSize: 8,
    padding: "1px 6px",
    marginRight: 4,
    borderRadius: 2,
    background: "rgba(110,122,136,.12)",
    border: "1px solid rgba(110,122,136,.2)",
    color: "#6e7a88",
  },

  empty: {
    padding: "26px 12px",
    textAlign: "center",
    fontWeight: 950,
    color: "rgba(229,231,235,0.72)",
  },
  emptySub: { marginTop: 6, fontSize: 12, fontWeight: 800, color: "rgba(229,231,235,0.50)" },

  sidebar: { display: "grid", gap: 12 },
  sideCard: {
    borderRadius: 4,
    border: "1px solid rgba(28,34,41,0.8)",
    background: "rgba(255,255,255,0.02)",
    padding: 16,
  },
  sideTitle: { fontWeight: 950, color: "#00b4ff", marginBottom: 8, fontSize: 14 },
  sideText: { fontSize: 12, color: "rgba(229,231,235,0.68)", lineHeight: 1.6 },
  sideMini: { marginTop: 10, fontSize: 11, color: "rgba(229,231,235,0.55)", lineHeight: 1.7 },
  sideCta: {
    display: "inline-flex",
    marginTop: 12,
    padding: "9px 14px",
    borderRadius: 4,
    border: "1px solid rgba(0,168,232,0.3)",
    background: "rgba(0,168,232,0.08)",
    color: "#7dd3fc",
    textDecoration: "none",
    fontWeight: 950,
    fontSize: 12,
  },

  footer: {
    marginTop: 22,
    padding: "22px clamp(16px, 4vw, 48px)",
    borderTop: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
    color: "rgba(229,231,235,0.70)",
  },
  footerLeft: { display: "flex", flexDirection: "column", gap: 6 },
  footerBrand: { fontWeight: 950, letterSpacing: 1.2 },
  footerSub: { fontSize: 12, opacity: 0.75 },
  footerRight: { display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" },
  footerLink: { textDecoration: "none", color: "rgba(229,231,235,0.75)", fontWeight: 850, fontSize: 13 },
};
