"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type SupaLoad = {
  id: string;
  created_at: string;
  carrier_id: string;
  board_type: "flat" | "bid" | "open";
  pu_city: string;
  pu_state: string;
  dl_city: string;
  dl_state: string;
  miles: number | null;
  position: string;
  pay_type: string | null;
  status: string;
  per_mile_rate: number;
  day_rate: number;
  overnight_fee: number;
  no_go_fee: number;
  requires_p_evo: boolean;
  requires_witpac: boolean;
  requires_ny_cert: boolean;
  requires_twic: boolean;
  poster_company: string | null;
  poster_rating: number | null;
  poster_jobs: number | null;
  isSample?: boolean;
};

const MOCK_LOADS: SupaLoad[] = [
  {
    id: "sample-1",
    created_at: new Date().toISOString(),
    carrier_id: "sample",
    board_type: "flat",
    pu_city: "Dallas",
    pu_state: "TX",
    dl_city: "Baton Rouge",
    dl_state: "LA",
    miles: 271,
    position: "Lead + Escort",
    pay_type: "FastPay",
    status: "open",
    per_mile_rate: 2.0,
    day_rate: 500,
    overnight_fee: 100,
    no_go_fee: 250,
    requires_p_evo: true,
    requires_witpac: false,
    requires_ny_cert: false,
    requires_twic: false,
    poster_company: "Sunshine State Oversize",
    poster_rating: 4.8,
    poster_jobs: 47,
    isSample: true,
  },
  {
    id: "sample-2",
    created_at: new Date().toISOString(),
    carrier_id: "sample",
    board_type: "flat",
    pu_city: "Indianapolis",
    pu_state: "IN",
    dl_city: "Columbus",
    dl_state: "OH",
    miles: 312,
    position: "High Pole",
    pay_type: "7-Day",
    status: "open",
    per_mile_rate: 2.0,
    day_rate: 500,
    overnight_fee: 100,
    no_go_fee: 250,
    requires_p_evo: true,
    requires_witpac: false,
    requires_ny_cert: false,
    requires_twic: false,
    poster_company: "Midwest Oversize LLC",
    poster_rating: 4.6,
    poster_jobs: 91,
    isSample: true,
  },
  {
    id: "sample-3",
    created_at: new Date().toISOString(),
    carrier_id: "sample",
    board_type: "flat",
    pu_city: "Bakersfield",
    pu_state: "CA",
    dl_city: "Reno",
    dl_state: "NV",
    miles: 418,
    position: "Route Survey",
    pay_type: "10-Day",
    status: "open",
    per_mile_rate: 2.0,
    day_rate: 500,
    overnight_fee: 100,
    no_go_fee: 250,
    requires_p_evo: true,
    requires_witpac: true,
    requires_ny_cert: false,
    requires_twic: false,
    poster_company: "Desert Wind Transport",
    poster_rating: 4.7,
    poster_jobs: 83,
    isSample: true,
  },
  {
    id: "sample-4",
    created_at: new Date().toISOString(),
    carrier_id: "sample",
    board_type: "flat",
    pu_city: "Jacksonville",
    pu_state: "FL",
    dl_city: "Savannah",
    dl_state: "GA",
    miles: 198,
    position: "Escort",
    pay_type: "FastPay",
    status: "open",
    per_mile_rate: 2.0,
    day_rate: 500,
    overnight_fee: 100,
    no_go_fee: 250,
    requires_p_evo: true,
    requires_witpac: false,
    requires_ny_cert: false,
    requires_twic: false,
    poster_company: "Gulf Coast Transport",
    poster_rating: 4.9,
    poster_jobs: 134,
    isSample: true,
  },
];

export default function LoadsPage() {
  const [loads, setLoads] = useState<SupaLoad[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [pos, setPos] = useState("All");
  const [state, setState] = useState("All");
  const [pay, setPay] = useState("Any");
  const [sort, setSort] = useState<"Newest" | "Oldest">("Newest");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLoads() {
      const { data, error } = await supabase
        .from("loads")
        .select("*")
        .eq("board_type", "flat")
        .eq("status", "open")
        .order("created_at", { ascending: false });

      if (data && data.length > 0) {
        setLoads(data as SupaLoad[]);
      } else {
        setLoads(MOCK_LOADS);
      }
      setLoading(false);
    }
    fetchLoads();
  }, []);

  const rows = useMemo(() => {
    const query = q.trim().toLowerCase();
    let out = [...loads];

    if (query) {
      out = out.filter((l) => {
        const hay = [
          l.id,
          l.pu_city,
          l.pu_state,
          l.dl_city,
          l.dl_state,
          l.position,
          l.pay_type ?? "",
          l.poster_company ?? "",
          l.status,
        ]
          .join(" ")
          .toLowerCase();
        return hay.includes(query);
      });
    }

    if (pos !== "All") out = out.filter((l) => l.position.includes(pos));
    if (state !== "All") out = out.filter((l) => l.pu_state === state || l.dl_state === state);
    if (pay !== "Any") {
      out = out.filter((l) => {
        if (pay === "FastPay") return l.pay_type === "FastPay";
        if (pay === "Standard") return l.pay_type !== "FastPay";
        return true;
      });
    }

    out.sort((a, b) => {
      const da = new Date(a.created_at).getTime();
      const db = new Date(b.created_at).getTime();
      return sort === "Newest" ? db - da : da - db;
    });

    return out;
  }, [loads, q, pos, state, pay, sort]);

  const hasSamples = rows.some((l) => l.isSample);

  return (
    <main style={S.main}>
      {/* Ticker */}
      <div style={S.tickerBar}>
        <div style={S.ticker}>
          🟢 New Load • TX → LA • Lead + Escort • FastPay • 271 mi • 📲 TextOnly loads supported • ⭐ Reviews + Rank •
          ✅ Verification layer • Post FREE unlimited • Pro gets SMS (Bid Board)
        </div>
      </div>

      {/* Nav header */}
      <header style={S.header}>
        <a href="/" style={S.brandWrap}>
          <div style={S.brand}>OVERSIZE ESCORT HUB</div>
          <div style={S.subBrand}>LIVE • RANKED • VERIFIED</div>
        </a>
        <nav style={S.nav}>
          <a href="/" style={S.navLink}>Home</a>
          <a href="/loads" style={{ ...S.navLink, ...S.navActive }}>Loads</a>
          <a href="/bid-board" style={S.navLink}>Bid Board</a>
          <a href="/pricing" style={S.navLink}>Membership</a>
          <a href="/verify" style={S.navLink}>Verification</a>
          <a href="/post-load" style={S.cta}>Post Load (FREE)</a>
        </nav>
      </header>

      {/* Page title */}
      <div style={S.pageHead}>
        <div>
          <h1 style={S.h1}>Flat Rate Load Board</h1>
          <p style={S.sub}>
            First-come board. Designed for speed and density — click any row for details.
          </p>
        </div>
        <div style={S.rightChips}>
          <span style={S.chip}>Posting: FREE Unlimited</span>
          <span style={S.chip}>Pay Terms Visible</span>
          <span style={S.chip}>Filters + Search</span>
        </div>
      </div>

      {/* Sample banner */}
      {hasSamples && (
        <div style={S.sampleBanner}>
          <span style={S.sampleIcon}>🚀</span>
          <div>
            <div style={S.sampleTitle}>Sample Data — Be an Early Member</div>
            <div style={S.sampleDesc}>
              Real loads will appear here once carriers post. Post the first real load in your region and get seen by
              every escort who joins.
            </div>
          </div>
        </div>
      )}

      {/* Filter bar */}
      <div style={S.filters}>
        <input
          style={S.search}
          placeholder="Search route, city, load id, position, pay..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select style={S.select} value={state} onChange={(e) => setState(e.target.value)}>
          <option value="All">All States</option>
          {["TX", "LA", "IN", "OH", "CA", "NV", "FL", "GA", "AZ", "TN", "OK", "NM"].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select style={S.select} value={pos} onChange={(e) => setPos(e.target.value)}>
          <option value="All">All Positions</option>
          <option value="Lead">Lead</option>
          <option value="Escort">Escort</option>
          <option value="High Pole">High Pole</option>
          <option value="Route Survey">Route Survey</option>
          <option value="Steer">Steer</option>
        </select>
        <select style={S.select} value={pay} onChange={(e) => setPay(e.target.value)}>
          <option value="Any">Any Pay Type</option>
          <option value="FastPay">FastPay</option>
          <option value="Standard">Standard / Other</option>
        </select>
        <select style={S.select} value={sort} onChange={(e) => setSort(e.target.value as "Newest" | "Oldest")}>
          <option value="Newest">Newest First</option>
          <option value="Oldest">Oldest First</option>
        </select>
        <div style={S.count}>
          Showing <b>{rows.length}</b> loads
        </div>
      </div>

      {/* Table head */}
      <div style={S.tableHead}>
        <span style={S.th}>Route</span>
        <span style={S.th}>Miles</span>
        <span style={S.th}>Rate</span>
        <span style={S.th}>Est. Pay</span>
        <span style={S.th}>Position</span>
        <span style={S.th}>Pay Terms</span>
        <span style={S.th}>Carrier Score</span>
        <span style={S.th}>Status</span>
      </div>

      {/* Rows */}
      {loading ? (
        <div style={S.empty}>Loading loads...</div>
      ) : (
        <div style={S.rows}>
          {rows.length === 0 ? (
            <div style={S.empty}>
              No loads match your filters.
              <div style={S.emptySub}>Try clearing search/filters.</div>
            </div>
          ) : (
            rows.map((l) => (
              <div key={l.id} style={S.rowWrap}>
                <div
                  style={S.row}
                  onClick={() => setExpanded((cur) => (cur === l.id ? null : l.id))}
                  role="button"
                  tabIndex={0}
                >
                  <span style={S.cellStrong}>
                    {l.pu_city}, {l.pu_state} → {l.dl_city}, {l.dl_state}
                    {l.isSample && <span style={S.sampleBadge}>SAMPLE</span>}
                  </span>
                  <span style={S.cell}>{l.miles != null ? `${l.miles} mi` : "—"}</span>
                  <span style={S.cellPay}>${l.per_mile_rate.toFixed(2)}/mi</span>
                  <span style={S.cellGreen}>
                    {l.miles ? `$${(l.miles * l.per_mile_rate).toFixed(0)}` : "—"}
                  </span>
                  <span style={S.cell}>{l.position}</span>
                  <span style={S.cell}>
                    {l.pay_type === "FastPay" ? (
                      <span style={S.fastPayBadge}>⚡ FastPay</span>
                    ) : (
                      l.pay_type ?? "7-Day"
                    )}
                  </span>
                  <span style={S.cell}>
                    {l.poster_rating != null ? (
                      <span style={S.scoreBadge}>{l.poster_rating} ⭐</span>
                    ) : (
                      "New"
                    )}
                  </span>
                  <span style={l.status === "open" ? S.open : S.covered}>{l.status.toUpperCase()}</span>
                </div>

                {expanded === l.id && (
                  <div style={S.expand}>
                    <div style={S.expandGrid}>
                      <InfoBox label="Pickup" value={`${l.pu_city}, ${l.pu_state}`} />
                      <InfoBox label="Drop" value={`${l.dl_city}, ${l.dl_state}`} />
                      <InfoBox label="Pay Terms" value={l.pay_type ?? "7-Day"} />
                      <InfoBox
                        label="Certifications"
                        value={[
                          l.requires_p_evo && "P/EVO",
                          l.requires_witpac && "Witpac",
                          l.requires_ny_cert && "NY Cert",
                          l.requires_twic && "TWIC",
                        ]
                          .filter(Boolean)
                          .join(", ") || "None specified"}
                      />
                      <InfoBox label="Carrier" value={l.poster_company ?? "Unknown"} />
                      <InfoBox label="Carrier Rating" value={l.poster_rating != null ? `${l.poster_rating} ⭐ (${l.poster_jobs ?? 0} jobs)` : "New carrier"} />
                    </div>

                    {/* Lock wall */}
                    <div style={S.lockWall}>
                      <div style={S.lockBlurred}>📞 (XXX) XXX-XXXX &nbsp;·&nbsp; 📧 dispatch@xxxxxxx.com</div>
                      <div style={S.lockMsg}>🔒 Member access required — contact info hidden from free accounts</div>
                      <div style={S.expandActions}>
                        <a href="/pricing" style={S.actionBtn}>Upgrade to Member — $19.99/mo →</a>
                        <a href="/bid-board" style={S.actionBtnGhost}>Switch to Bid Board</a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Footer */}
      <footer style={S.footer}>
        <div style={S.footerLeft}>
          <div style={S.footerBrand}>OVERSIZE ESCORT HUB</div>
          <div style={S.footerSub}>support@oversize-escort-hub.com • verification@oversize-escort-hub.com</div>
        </div>
        <div style={S.footerRight}>
          <a href="/terms" style={S.footerLink}>Terms</a>
          <a href="/privacy" style={S.footerLink}>Privacy</a>
          <a href="/conduct" style={S.footerLink}>Conduct</a>
        </div>
      </footer>

      <style>{`
        @keyframes tickerMove { from { transform: translateX(100%); } to { transform: translateX(-100%); } }
        @media (max-width: 768px) {
          .loads-table-head { display: none !important; }
          .loads-row { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </main>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div style={S.box}>
      <div style={S.boxLabel}>{label}</div>
      <div style={S.boxVal}>{value}</div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
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
  sub: { marginTop: 6, marginBottom: 0, fontSize: 14, color: "rgba(229,231,235,0.65)" },
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
    margin: "0 clamp(16px, 4vw, 48px) 0",
    background: "linear-gradient(135deg,rgba(245,162,0,.08),rgba(255,98,0,.06))",
    border: "1px solid rgba(245,162,0,0.2)",
    borderRadius: 4,
    padding: "14px 18px",
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12,
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
    flex: "1 1 280px",
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

  tableHead: {
    margin: "0 clamp(16px, 4vw, 48px)",
    display: "grid",
    gridTemplateColumns: "2.4fr .7fr .9fr .9fr 1.1fr .9fr 1fr .7fr",
    padding: "10px 12px",
    borderBottom: "1px solid rgba(255,255,255,0.10)",
    color: "rgba(229,231,235,0.55)",
    fontWeight: 950,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    fontSize: 11,
  },
  th: {},

  rows: {
    margin: "0 clamp(16px, 4vw, 48px)",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 16,
    overflow: "hidden",
  },
  rowWrap: { borderBottom: "1px solid rgba(255,255,255,0.06)" },
  row: {
    display: "grid",
    gridTemplateColumns: "2.4fr .7fr .9fr .9fr 1.1fr .9fr 1fr .7fr",
    padding: "10px 12px",
    alignItems: "center",
    background: "rgba(255,255,255,0.02)",
    cursor: "pointer",
    minWidth: 0,
    overflowX: "auto",
  },
  cell: { fontSize: 12, color: "rgba(229,231,235,0.86)", fontWeight: 750 },
  cellStrong: { fontSize: 12, color: "#fff", fontWeight: 950, overflow: "hidden" },
  cellPay: { fontSize: 12, fontWeight: 950, color: "#00b4ff" },
  cellGreen: { fontSize: 12, fontWeight: 950, color: "#00cc7a" },

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
  fastPayBadge: {
    display: "inline-flex",
    alignItems: "center",
    fontFamily: "'DM Mono', monospace",
    fontSize: 9,
    padding: "2px 8px",
    borderRadius: 2,
    background: "rgba(0,204,122,.1)",
    color: "#00cc7a",
    border: "1px solid rgba(0,204,122,.2)",
  },
  scoreBadge: {
    display: "inline-flex",
    alignItems: "center",
    fontFamily: "'DM Mono', monospace",
    fontSize: 9,
    padding: "2px 7px",
    borderRadius: 2,
    background: "rgba(0,204,122,.1)",
    color: "#00cc7a",
    border: "1px solid rgba(0,204,122,.2)",
  },

  open: { fontSize: 12, fontWeight: 950, color: "#00e676" },
  covered: { fontSize: 12, fontWeight: 950, color: "rgba(229,231,235,0.45)" },

  expand: {
    padding: "12px 12px 14px",
    background: "rgba(0,0,0,0.22)",
    borderTop: "1px solid rgba(255,255,255,0.08)",
  },
  expandGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 10,
    marginBottom: 12,
  },
  box: {
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 14,
    padding: 12,
    background: "rgba(255,255,255,0.03)",
  },
  boxLabel: { fontSize: 11, letterSpacing: 1.4, textTransform: "uppercase", opacity: 0.6, fontWeight: 950 },
  boxVal: { marginTop: 6, fontSize: 12, fontWeight: 850, color: "rgba(229,231,235,0.86)" },

  lockWall: {
    padding: "14px 16px",
    background: "rgba(0,0,0,0.3)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 12,
  },
  lockBlurred: {
    filter: "blur(4px)",
    fontSize: 13,
    color: "rgba(229,231,235,0.86)",
    fontWeight: 750,
    marginBottom: 6,
    userSelect: "none",
  },
  lockMsg: { fontSize: 12, color: "rgba(229,231,235,0.55)", marginBottom: 10 },
  expandActions: { display: "flex", gap: 10, flexWrap: "wrap" },
  actionBtn: {
    textDecoration: "none",
    padding: "9px 14px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "linear-gradient(135deg, #00a8e8, #1fb6ff)",
    color: "#001018",
    fontWeight: 950,
    fontSize: 12,
  },
  actionBtnGhost: {
    textDecoration: "none",
    padding: "9px 14px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.05)",
    color: "rgba(229,231,235,0.90)",
    fontWeight: 950,
    fontSize: 12,
  },

  empty: {
    padding: "26px 12px",
    textAlign: "center",
    fontWeight: 950,
    color: "rgba(229,231,235,0.72)",
    background: "rgba(255,255,255,0.02)",
  },
  emptySub: { marginTop: 6, fontSize: 12, fontWeight: 800, color: "rgba(229,231,235,0.50)" },

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
