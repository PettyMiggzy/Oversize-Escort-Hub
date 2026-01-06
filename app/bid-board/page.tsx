// FILE: app/bid-board/page.tsx
// ACTION: Replace the ENTIRE contents of this file with this full working page.
// Includes: ticker, full nav buttons, dense auction rows, auto-rotation, and compact layout.

"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type PayTerm =
  | { kind: "FastPay"; days: number }
  | { kind: "Standard"; label: string }
  | { kind: "Custom"; label: string };

type BidLoad = {
  id: string;
  date: string; // MM/DD/YYYY
  origin: { state: string; city: string; zip: string };
  dest: { state: string; city: string; zip: string };
  miles?: number;
  position: string; // Lead / Escort / High Pole / Route Survey / Steer
  payTerm: PayTerm;
  baseline?: string; // broker/carrier "lowest acceptable" / baseline guidance shown up front
  auctionEndsAt: number; // epoch ms
  status: "LIVE" | "AWARDING" | "AWARDED" | "NO_BIDS";
  proWindowSecsLeft?: number; // Pro-only first 60 seconds
  flags?: Array<"QuickPay" | "TextOnly" | "PassportReq" | "WitpacReq" | "NYReq">;
};

// ===== MOCK DATA (swap for backend later) =====
const MOCK_BIDS: BidLoad[] = [
  {
    id: "BB-4890",
    date: "01/06/2026",
    origin: { state: "TX", city: "Dallas", zip: "75201" },
    dest: { state: "LA", city: "Baton Rouge", zip: "70801" },
    miles: 271,
    position: "Lead + Escort",
    payTerm: { kind: "FastPay", days: 10 },
    baseline: "$2.95/mi",
    auctionEndsAt: Date.now() + 4 * 60_000 + 12_000, // ~4:12
    status: "LIVE",
    flags: ["QuickPay"],
  },
  {
    id: "BB-4821",
    date: "01/07/2026",
    origin: { state: "IN", city: "Indianapolis", zip: "46204" },
    dest: { state: "OH", city: "Columbus", zip: "43215" },
    miles: 312,
    position: "High Pole",
    payTerm: { kind: "Standard", label: "7-Day Pay" },
    baseline: "$750 Day Rate",
    auctionEndsAt: Date.now() + 1 * 60_000 + 47_000, // ~1:47
    status: "LIVE",
    proWindowSecsLeft: 58,
  },
  {
    id: "BB-4702",
    date: "01/06/2026",
    origin: { state: "CA", city: "Bakersfield", zip: "93301" },
    dest: { state: "NV", city: "Reno", zip: "89501" },
    miles: 418,
    position: "Route Survey",
    payTerm: { kind: "Standard", label: "10-Day Pay" },
    baseline: "$500 Flat",
    auctionEndsAt: Date.now() + 7 * 60_000 + 5_000, // ~7:05
    status: "LIVE",
    flags: ["TextOnly"],
  },
  {
    id: "BB-4557",
    date: "01/08/2026",
    origin: { state: "WA", city: "Tacoma", zip: "98402" },
    dest: { state: "OR", city: "Portland", zip: "97201" },
    miles: 157,
    position: "Escort",
    payTerm: { kind: "Custom", label: "Custom (within 10 biz days)" },
    baseline: "$2.40/mi",
    auctionEndsAt: Date.now() + 11 * 60_000 + 30_000, // ~11:30
    status: "LIVE",
    flags: ["PassportReq"],
  },
];

function fmtPayTerm(pt: PayTerm) {
  if (pt.kind === "FastPay") return `FastPay (${pt.days}d)`;
  return pt.label;
}

function fmtRoute(l: BidLoad) {
  return `${l.origin.state} → ${l.dest.state}`;
}

function msToMMSS(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

function shortFlag(f: NonNullable<BidLoad["flags"]>[number]) {
  switch (f) {
    case "QuickPay":
      return "FastPay";
    case "TextOnly":
      return "Text";
    case "PassportReq":
      return "Passport";
    case "WitpacReq":
      return "Witpac";
    case "NYReq":
      return "NY";
    default:
      return f;
  }
}

export default function BidBoardPage() {
  const [now, setNow] = useState(() => Date.now());
  const [items, setItems] = useState<BidLoad[]>(() => MOCK_BIDS);

  // filters
  const [q, setQ] = useState("");
  const [pos, setPos] = useState("All");
  const [state, setState] = useState("All");
  const [pay, setPay] = useState("Any");
  const [sort, setSort] = useState<"EndsSoon" | "Newest">("EndsSoon");

  // rotation / density
  const PAGE_SIZE = 12; // higher = denser
  const ROTATE_EVERY_MS = 10_000;
  const [start, setStart] = useState(0);
  const lastRotate = useRef(Date.now());

  // tick time
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // pro window countdown + auction auto-award simulation
  useEffect(() => {
    const t = setInterval(() => {
      setItems((prev) =>
        prev.map((l) => {
          // pro window
          let next = l;
          if (typeof l.proWindowSecsLeft === "number" && l.proWindowSecsLeft > 0) {
            next = { ...next, proWindowSecsLeft: l.proWindowSecsLeft - 1 };
          }

          // auction time reached: move to AWARDING then AWARDED/NO_BIDS
          if (next.status === "LIVE" && now >= next.auctionEndsAt) {
            next = { ...next, status: "AWARDING" };
          }
          return next;
        })
      );
    }, 1000);
    return () => clearInterval(t);
  }, [now]);

  // finalize AWARDING -> AWARDED after 5s (mock)
  useEffect(() => {
    const t = setInterval(() => {
      setItems((prev) =>
        prev.map((l) => {
          if (l.status !== "AWARDING") return l;
          // mock decision: if baseline exists, assume awarded; else no bids
          return { ...l, status: l.baseline ? "AWARDED" : "NO_BIDS" };
        })
      );
    }, 5000);
    return () => clearInterval(t);
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    let out = [...items];

    if (query) {
      out = out.filter((l) => {
        const hay = [
          l.id,
          l.date,
          fmtRoute(l),
          l.origin.city,
          l.origin.state,
          l.origin.zip,
          l.dest.city,
          l.dest.state,
          l.dest.zip,
          l.position,
          l.baseline ?? "",
          fmtPayTerm(l.payTerm),
          (l.flags ?? []).join(" "),
          l.status,
        ]
          .join(" ")
          .toLowerCase();
        return hay.includes(query);
      });
    }

    if (pos !== "All") out = out.filter((l) => l.position.includes(pos));
    if (state !== "All") out = out.filter((l) => l.origin.state === state || l.dest.state === state);

    if (pay !== "Any") {
      out = out.filter((l) => {
        if (pay === "FastPay") return l.payTerm.kind === "FastPay";
        if (pay === "Standard") return l.payTerm.kind === "Standard";
        if (pay === "Custom") return l.payTerm.kind === "Custom";
        return true;
      });
    }

    if (sort === "EndsSoon") out.sort((a, b) => a.auctionEndsAt - b.auctionEndsAt);
    else out.sort((a, b) => b.auctionEndsAt - a.auctionEndsAt);

    return out;
  }, [items, pay, pos, q, sort, state]);

  const visible = useMemo(() => {
    if (filtered.length <= PAGE_SIZE) return filtered;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, start]);

  // auto-rotate
  useEffect(() => {
    const t = setInterval(() => {
      const current = Date.now();
      if (current - lastRotate.current < ROTATE_EVERY_MS) return;
      lastRotate.current = current;

      setStart((prev) => {
        const total = filtered.length;
        if (total <= PAGE_SIZE) return 0;
        const next = prev + PAGE_SIZE;
        return next >= total ? 0 : next;
      });
    }, 500);

    return () => clearInterval(t);
  }, [filtered.length]);

  function placeBid(id: string) {
    // mock: clicking bid just marks as "AWARDING" to show action
    setItems((prev) => prev.map((l) => (l.id === id && l.status === "LIVE" ? { ...l, status: "AWARDING" } : l)));
    setTimeout(() => {
      setItems((prev) => prev.map((l) => (l.id === id && l.status === "AWARDING" ? { ...l, status: "AWARDED" } : l)));
    }, 5000);
  }

  return (
    <main style={B.main}>
      {/* ===== TICKER ===== */}
      <div style={B.tickerBar}>
        <div style={B.ticker}>
          🔥 Bid Board Live • 5-Min Window • Lowest reasonable bid wins • Ties break by Rank • Pro gets first 60s + SMS •
          Pay terms shown upfront • Post loads FREE unlimited
        </div>
      </div>

      {/* ===== NAV HEADER ===== */}
      <header style={B.header}>
        <a href="/" style={B.brandWrap}>
          <div style={B.brand}>OVERSIZE ESCORT HUB</div>
          <div style={B.subBrand}>LIVE • RANKED • VERIFIED</div>
        </a>

        <nav style={B.nav}>
          <a href="/" style={B.navLink}>
            Home
          </a>
          <a href="/loads" style={B.navLink}>
            Loads
          </a>
          <a href="/bid-board" style={{ ...B.navLink, ...B.navActive }}>
            Bid Board
          </a>
          <a href="/pricing" style={B.navLink}>
            Membership
          </a>
          <a href="/verify" style={B.navLink}>
            Verification
          </a>
          <a href="/post-load" style={B.cta}>
            Post Load (FREE)
          </a>
        </nav>
      </header>

      {/* ===== PAGE HEAD ===== */}
      <div style={B.pageHead}>
        <div>
          <h1 style={B.h1}>Bid Board (Auction)</h1>
          <p style={B.sub}>
            Bidding runs for <b>5 minutes</b>. Award goes to the lowest <b>reasonable</b> bid that meets requirements.
            Ties break by rank.
          </p>
        </div>

        <div style={B.rightChips}>
          <span style={B.chip}>Window: 5 min</span>
          <span style={B.chip}>Pro: First 60s + SMS</span>
          <span style={B.chip}>Auto-Rotates</span>
        </div>
      </div>

      {/* ===== FILTERS ===== */}
      <div style={B.filters}>
        <input
          style={B.search}
          placeholder="Search route, city, zip, load id, position, pay..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        <select style={B.select} value={state} onChange={(e) => setState(e.target.value)}>
          <option value="All">All States</option>
          <option value="TX">TX</option>
          <option value="LA">LA</option>
          <option value="IN">IN</option>
          <option value="OH">OH</option>
          <option value="CA">CA</option>
          <option value="NV">NV</option>
          <option value="WA">WA</option>
          <option value="OR">OR</option>
        </select>

        <select style={B.select} value={pos} onChange={(e) => setPos(e.target.value)}>
          <option value="All">All Positions</option>
          <option value="Lead">Lead</option>
          <option value="Escort">Escort</option>
          <option value="High Pole">High Pole</option>
          <option value="Route Survey">Route Survey</option>
          <option value="Steer">Steer</option>
        </select>

        <select style={B.select} value={pay} onChange={(e) => setPay(e.target.value)}>
          <option value="Any">Any Pay Type</option>
          <option value="FastPay">FastPay</option>
          <option value="Standard">Standard</option>
          <option value="Custom">Custom</option>
        </select>

        <select style={B.select} value={sort} onChange={(e) => setSort(e.target.value as any)}>
          <option value="EndsSoon">Ends Soon</option>
          <option value="Newest">Newest</option>
        </select>

        <div style={B.count}>
          Showing <b>{filtered.length}</b> auctions • rotating <b>{PAGE_SIZE}</b> at a time
        </div>
      </div>

      {/* ===== BOARD + SIDEBAR ===== */}
      <div style={B.grid}>
        <section style={B.board}>
          <div style={B.tableHead}>
            <span style={B.th}>Date</span>
            <span style={B.th}>Route</span>
            <span style={B.th}>Role</span>
            <span style={B.th}>Miles</span>
            <span style={B.th}>Baseline</span>
            <span style={B.th}>Pay</span>
            <span style={B.th}>Flags</span>
            <span style={B.th}>Time</span>
            <span style={B.th}></span>
          </div>

          <div style={B.rows}>
            {visible.length === 0 ? (
              <div style={B.empty}>
                No auctions match your filters.
                <div style={B.emptySub}>Try clearing search/filters.</div>
              </div>
            ) : (
              visible.map((l) => <BidRow key={l.id} load={l} now={now} onBid={() => placeBid(l.id)} />)
            )}
          </div>
        </section>

        <aside style={B.sidebar}>
          <div style={B.sideCard}>
            <div style={B.sideTitle}>Ad Spot</div>
            <div style={B.sideText}>Rotating placements • weekly slots • pro audience.</div>
            <a style={B.sideLink} href="mailto:support@oversize-escort-hub.com">
              Advertise → Email Support
            </a>
          </div>

          <div style={B.sideCard}>
            <div style={B.sideTitle}>Top Escort • This Month</div>
            <div style={B.sideText}>Ranked by reliability + completed jobs + reviews.</div>
            <div style={B.badgeRow}>
              <span style={B.badge}>🏆 Rank</span>
              <span style={B.badge}>⭐ Reviews</span>
              <span style={B.badge}>✅ Verified</span>
            </div>
          </div>

          <div style={B.sideCard}>
            <div style={B.sideTitle}>How Awards Work</div>
            <div style={B.sideText}>
              Lowest <b>reasonable</b> bid that meets requirements wins. If two bids match, higher rank wins.
            </div>
            <div style={B.sideMini}>
              <div>• Pro window: first 60 seconds</div>
              <div>• Auto-award after 5 minutes</div>
              <div>• Pay terms shown up front</div>
            </div>
          </div>

          <div style={B.sideCard}>
            <div style={B.sideTitle}>Pro Advantage</div>
            <div style={B.sideText}>First 60s access + SMS alerts + priority tie-break.</div>
            <a href="/pricing" style={B.sideCta}>
              Upgrade to Pro
            </a>
          </div>
        </aside>
      </div>

      {/* ===== FOOTER ===== */}
      <footer style={B.footer}>
        <div style={B.footerLeft}>
          <div style={B.footerBrand}>OVERSIZE ESCORT HUB</div>
          <div style={B.footerSub}>support@oversize-escort-hub.com • verification@oversize-escort-hub.com</div>
        </div>
        <div style={B.footerRight}>
          <a href="/terms" style={B.footerLink}>
            Terms
          </a>
          <a href="/privacy" style={B.footerLink}>
            Privacy
          </a>
          <a href="/conduct" style={B.footerLink}>
            Conduct
          </a>
        </div>
      </footer>

      <style>{`
        @keyframes tickerMove {
          from { transform: translateX(100%); }
          to { transform: translateX(-100%); }
        }
      `}</style>
    </main>
  );
}

function BidRow({ load, now, onBid }: { load: BidLoad; now: number; onBid: () => void }) {
  const msLeft = Math.max(0, load.auctionEndsAt - now);
  const proLeft = load.proWindowSecsLeft ?? 0;
  const isProWindow = proLeft > 0;

  const timerLabel =
    load.status === "AWARDED"
      ? "AWARDED"
      : load.status === "NO_BIDS"
      ? "NO BIDS"
      : load.status === "AWARDING"
      ? "AWARDING…"
      : isProWindow
      ? `PRO ${String(proLeft).padStart(2, "0")}s`
      : msToMMSS(msLeft);

  const timerStyle =
    load.status === "AWARDED"
      ? B.timerAwarded
      : load.status === "NO_BIDS"
      ? B.timerNoBids
      : load.status === "AWARDING"
      ? B.timerAwarding
      : isProWindow
      ? B.timerPro
      : msLeft <= 30_000
      ? B.timerHot
      : B.timer;

  const flags = load.flags ?? [];

  return (
    <div style={B.row}>
      <span style={B.cell}>{load.date}</span>

      <span style={B.cellStrong}>
        {fmtRoute(load)}
        <span style={B.cellSub}>
          {" "}
          • {load.origin.city}, {load.origin.state} → {load.dest.city}, {load.dest.state} • <b>{load.id}</b>
        </span>
      </span>

      <span style={B.cell}>{load.position}</span>
      <span style={B.cell}>{typeof load.miles === "number" ? `${load.miles} mi` : "—"}</span>
      <span style={B.cellPay}>{load.baseline ?? "—"}</span>
      <span style={B.cell}>{fmtPayTerm(load.payTerm)}</span>

      <span style={B.cell}>
        {flags.length === 0 ? (
          <span style={{ opacity: 0.5 }}>—</span>
        ) : (
          <>
            {flags.slice(0, 2).map((f) => (
              <span key={f} style={B.flag}>
                {f === "QuickPay" ? "⚡" : f === "TextOnly" ? "📲" : f === "PassportReq" ? "🛂" : "🏷"}{" "}
                {shortFlag(f)}
              </span>
            ))}
            {flags.length > 2 ? <span style={{ marginLeft: 8, opacity: 0.6 }}>+{flags.length - 2}</span> : null}
          </>
        )}
      </span>

      <span style={timerStyle}>{timerLabel}</span>

      <button
        style={{
          ...B.bidBtn,
          opacity: load.status === "LIVE" ? 1 : 0.55,
          cursor: load.status === "LIVE" ? "pointer" : "not-allowed",
        }}
        disabled={load.status !== "LIVE"}
        onClick={onBid}
      >
        Place Bid
      </button>
    </div>
  );
}

const B: any = {
  main: {
    minHeight: "100vh",
    background: "#060b16",
    color: "#e5e7eb",
    fontFamily:
      '"Inter", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Ubuntu, sans-serif',
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
    padding: "22px 48px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.02)",
  },
  brandWrap: { textDecoration: "none", color: "inherit" },
  brand: {
    fontSize: 26,
    fontWeight: 950,
    color: "#00b4ff",
    textShadow: "0 0 20px rgba(0,180,255,0.35)",
    letterSpacing: 0.4,
  },
  subBrand: { marginTop: 4, fontSize: 12, opacity: 0.7, letterSpacing: 2 },

  nav: { display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" as const },
  navLink: { color: "rgba(229,231,235,0.85)", textDecoration: "none", fontWeight: 800, fontSize: 13 },
  navActive: { color: "#00b4ff" },
  cta: {
    textDecoration: "none",
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "linear-gradient(135deg, #00a8e8, #1fb6ff)",
    color: "#001018",
    fontWeight: 950,
    fontSize: 13,
    boxShadow: "0 14px 40px rgba(0,168,232,0.26)",
  },

  pageHead: {
    padding: "18px 48px 10px",
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-end",
    flexWrap: "wrap" as const,
  },
  h1: { margin: 0, fontSize: 30, fontWeight: 950 },
  sub: { marginTop: 6, marginBottom: 0, fontSize: 14, color: "rgba(229,231,235,0.65)" },
  rightChips: { display: "flex", gap: 10, flexWrap: "wrap" as const },
  chip: {
    padding: "8px 12px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.18)",
    color: "rgba(229,231,235,0.82)",
    fontWeight: 900,
    fontSize: 12,
  },

  filters: {
    padding: "12px 48px 14px",
    display: "flex",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap" as const,
  },
  search: {
    flex: "1 1 360px",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.22)",
    color: "#e5e7eb",
    fontWeight: 750,
    fontSize: 13,
    outline: "none",
  },
  select: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.22)",
    color: "#e5e7eb",
    fontWeight: 850,
    fontSize: 13,
    outline: "none",
  },
  count: {
    marginLeft: "auto",
    fontSize: 12,
    color: "rgba(229,231,235,0.62)",
    fontWeight: 800,
  },

  grid: {
    padding: "0 48px 0",
    display: "grid",
    gridTemplateColumns: "1fr 320px",
    gap: 14,
    alignItems: "start",
  },

  board: {
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 16,
    overflow: "hidden",
    background: "rgba(255,255,255,0.02)",
  },

  tableHead: {
    display: "grid",
    gridTemplateColumns: ".9fr 2.5fr 1.2fr .7fr .9fr 1fr 1.1fr .8fr 1fr",
    padding: "10px 12px",
    borderBottom: "1px solid rgba(255,255,255,0.10)",
    color: "rgba(229,231,235,0.55)",
    fontWeight: 950,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    fontSize: 12,
    background: "rgba(0,0,0,0.18)",
  },
  th: {},

  rows: {},
  row: {
    display: "grid",
    gridTemplateColumns: ".9fr 2.5fr 1.2fr .7fr .9fr 1fr 1.1fr .8fr 1fr",
    padding: "10px 12px",
    alignItems: "center",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  cell: { fontSize: 13, color: "rgba(229,231,235,0.86)", fontWeight: 750 },
  cellStrong: { fontSize: 13, color: "#ffffff", fontWeight: 950, whiteSpace: "nowrap" as const, overflow: "hidden" },
  cellSub: { fontSize: 12, fontWeight: 800, color: "rgba(229,231,235,0.55)" },
  cellPay: { fontSize: 13, fontWeight: 950, color: "#00b4ff" },

  flag: {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 8px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.18)",
    color: "rgba(229,231,235,0.80)",
    fontWeight: 900,
    fontSize: 12,
    marginRight: 8,
    whiteSpace: "nowrap" as const,
  },

  timer: {
    fontSize: 13,
    fontWeight: 950,
    color: "rgba(229,231,235,0.85)",
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.18)",
    width: "fit-content",
  },
  timerHot: {
    fontSize: 13,
    fontWeight: 950,
    color: "#ffd166",
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,209,102,0.30)",
    background: "rgba(255,209,102,0.10)",
  },
  timerPro: {
    fontSize: 13,
    fontWeight: 950,
    color: "#7dd3fc",
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid rgba(0,168,232,0.35)",
    background: "rgba(0,168,232,0.12)",
  },
  timerAwarding: {
    fontSize: 13,
    fontWeight: 950,
    color: "#a78bfa",
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid rgba(167,139,250,0.35)",
    background: "rgba(167,139,250,0.12)",
  },
  timerAwarded: {
    fontSize: 13,
    fontWeight: 950,
    color: "#00e676",
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid rgba(0,230,118,0.30)",
    background: "rgba(0,230,118,0.10)",
  },
  timerNoBids: {
    fontSize: 13,
    fontWeight: 950,
    color: "rgba(229,231,235,0.55)",
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.18)",
  },

  bidBtn: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "linear-gradient(135deg, #00a8e8, #1fb6ff)",
    color: "#001018",
    fontWeight: 950,
    fontSize: 13,
    boxShadow: "0 14px 40px rgba(0,168,232,0.26)",
  },

  empty: {
    padding: "26px 12px",
    textAlign: "center" as const,
    fontWeight: 950,
    color: "rgba(229,231,235,0.72)",
  },
  emptySub: { marginTop: 6, fontSize: 12, fontWeight: 800, color: "rgba(229,231,235,0.50)" },

  sidebar: { display: "grid", gap: 12 },
  sideCard: {
    borderRadius: 16,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.02)",
    padding: 14,
  },
  sideTitle: { fontWeight: 950, color: "#00b4ff", marginBottom: 6 },
  sideText: { fontSize: 13, color: "rgba(229,231,235,0.68)", lineHeight: 1.5 },
  sideMini: { marginTop: 10, fontSize: 12, color: "rgba(229,231,235,0.65)", lineHeight: 1.6 },
  sideLink: {
    display: "inline-block",
    marginTop: 10,
    textDecoration: "none",
    color: "#7dd3fc",
    fontWeight: 950,
    fontSize: 13,
  },
  badgeRow: { display: "flex", gap: 8, flexWrap: "wrap" as const, marginTop: 10 },
  badge: {
    fontSize: 12,
    fontWeight: 900,
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.18)",
    color: "rgba(229,231,235,0.80)",
  },
  sideCta: {
    display: "inline-flex",
    marginTop: 10,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,180,255,0.12)",
    color: "#7dd3fc",
    textDecoration: "none",
    fontWeight: 950,
  },

  footer: {
    marginTop: 22,
    padding: "22px 48px",
    borderTop: "1px solid rgba(255,255,255,0.08)",
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap" as const,
    color: "rgba(229,231,235,0.70)",
  },
  footerLeft: { display: "flex", flexDirection: "column", gap: 6 },
  footerBrand: { fontWeight: 950, letterSpacing: 1.2 },
  footerSub: { fontSize: 13, opacity: 0.75 },
  footerRight: { display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" as const },
  footerLink: { textDecoration: "none", color: "rgba(229,231,235,0.75)", fontWeight: 850, fontSize: 13 },
};
