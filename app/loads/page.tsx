// FILE: app/loads/page.tsx
// ACTION: Replace ENTIRE file. Adds full nav header + ticker matching the Hub vibe.
// NOTE: Home page remains untouched.

"use client";

import { useMemo, useState } from "react";

type Load = {
  id: string;
  date: string; // MM/DD/YYYY
  pu: { city: string; state: string; zip: string };
  dl: { city: string; state: string; zip: string };
  miles?: number;
  position: string; // Lead / Escort / High Pole / Route Survey / Steer
  payTerm: { kind: "FastPay"; days: number } | { kind: "Standard"; label: string } | { kind: "Custom"; label: string };
  contact: { method: "Phone" | "Text" | "Email"; value: string };
  status: "Open" | "Covered";
  flags?: Array<"QuickPay" | "TextOnly">;
};

const MOCK_LOADS: Load[] = [
  {
    id: "L-10291",
    date: "01/06/2026",
    pu: { city: "Dallas", state: "TX", zip: "75201" },
    dl: { city: "Baton Rouge", state: "LA", zip: "70801" },
    miles: 271,
    position: "Lead + Escort",
    payTerm: { kind: "FastPay", days: 10 },
    contact: { method: "Phone", value: "(555) 201-9911" },
    status: "Open",
    flags: ["QuickPay"],
  },
  {
    id: "L-10244",
    date: "01/07/2026",
    pu: { city: "Indianapolis", state: "IN", zip: "46204" },
    dl: { city: "Columbus", state: "OH", zip: "43215" },
    miles: 312,
    position: "High Pole",
    payTerm: { kind: "Standard", label: "7-Day Pay" },
    contact: { method: "Text", value: "(555) 882-3001" },
    status: "Open",
    flags: ["TextOnly"],
  },
  {
    id: "L-10190",
    date: "01/06/2026",
    pu: { city: "Bakersfield", state: "CA", zip: "93301" },
    dl: { city: "Reno", state: "NV", zip: "89501" },
    miles: 418,
    position: "Route Survey",
    payTerm: { kind: "Standard", label: "10-Day Pay" },
    contact: { method: "Email", value: "dispatch@carrier.com" },
    status: "Covered",
  },
  {
    id: "L-10111",
    date: "01/08/2026",
    pu: { city: "Jacksonville", state: "FL", zip: "32099" },
    dl: { city: "Savannah", state: "GA", zip: "31401" },
    miles: 198,
    position: "Escort",
    payTerm: { kind: "FastPay", days: 7 },
    contact: { method: "Phone", value: "(555) 440-1122" },
    status: "Open",
    flags: ["QuickPay"],
  },
];

function fmtPay(pt: Load["payTerm"]) {
  if (pt.kind === "FastPay") return `FastPay (${pt.days}d)`;
  return pt.label;
}

export default function LoadsPage() {
  const [q, setQ] = useState("");
  const [pos, setPos] = useState("All");
  const [state, setState] = useState("All");
  const [pay, setPay] = useState("Any");
  const [sort, setSort] = useState<"Newest" | "Oldest">("Newest");
  const [expanded, setExpanded] = useState<string | null>(null);

  const rows = useMemo(() => {
    const query = q.trim().toLowerCase();

    let out = [...MOCK_LOADS];

    if (query) {
      out = out.filter((l) => {
        const hay = [
          l.id,
          l.date,
          `${l.pu.city} ${l.pu.state} ${l.pu.zip}`,
          `${l.dl.city} ${l.dl.state} ${l.dl.zip}`,
          l.position,
          fmtPay(l.payTerm),
          l.contact.method,
          l.contact.value,
          l.status,
          (l.flags ?? []).join(" "),
        ]
          .join(" ")
          .toLowerCase();
        return hay.includes(query);
      });
    }

    if (pos !== "All") out = out.filter((l) => l.position.includes(pos));
    if (state !== "All") out = out.filter((l) => l.pu.state === state || l.dl.state === state);
    if (pay !== "Any") {
      out = out.filter((l) => {
        if (pay === "FastPay") return l.payTerm.kind === "FastPay";
        if (pay === "Standard") return l.payTerm.kind === "Standard";
        if (pay === "Custom") return l.payTerm.kind === "Custom";
        return true;
      });
    }

    // naive date sort (MM/DD/YYYY) – good enough for mock UI
    out.sort((a, b) => {
      const da = new Date(a.date);
      const db = new Date(b.date);
      return sort === "Newest" ? db.getTime() - da.getTime() : da.getTime() - db.getTime();
    });

    return out;
  }, [pay, pos, q, sort, state]);

  return (
    <main style={S.main}>
      {/* ===== TICKER ===== */}
      <div style={S.tickerBar}>
        <div style={S.ticker}>
          🟢 New Load • TX → LA • Lead + Escort • FastPay • 271 mi • 📲 TextOnly loads supported • ⭐ Reviews + Rank • ✅
          Verification layer • Post FREE unlimited • Pro gets SMS (Bid Board)
        </div>
      </div>

      {/* ===== NAV HEADER ===== */}
      <header style={S.header}>
        <a href="/" style={S.brandWrap}>
          <div style={S.brand}>OVERSIZE ESCORT HUB</div>
          <div style={S.subBrand}>LIVE • RANKED • VERIFIED</div>
        </a>

        <nav style={S.nav}>
          <a href="/" style={S.navLink}>
            Home
          </a>
          <a href="/loads" style={{ ...S.navLink, ...S.navActive }}>
            Loads
          </a>
          <a href="/bid-board" style={S.navLink}>
            Bid Board
          </a>
          <a href="/pricing" style={S.navLink}>
            Membership
          </a>
          <a href="/verify" style={S.navLink}>
            Verification
          </a>
          <a href="/post-load" style={S.cta}>
            Post Load (FREE)
          </a>
        </nav>
      </header>

      {/* ===== PAGE TITLE ===== */}
      <div style={S.pageHead}>
        <div>
          <h1 style={S.h1}>Regular Load Board</h1>
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

      {/* ===== FILTER BAR ===== */}
      <div style={S.filters}>
        <input
          style={S.search}
          placeholder="Search route, city, zip, load id, position, pay..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        <select style={S.select} value={state} onChange={(e) => setState(e.target.value)}>
          <option value="All">All States</option>
          <option value="TX">TX</option>
          <option value="LA">LA</option>
          <option value="IN">IN</option>
          <option value="OH">OH</option>
          <option value="CA">CA</option>
          <option value="NV">NV</option>
          <option value="FL">FL</option>
          <option value="GA">GA</option>
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
          <option value="Standard">Standard</option>
          <option value="Custom">Custom</option>
        </select>

        <select style={S.select} value={sort} onChange={(e) => setSort(e.target.value as any)}>
          <option value="Newest">Newest First</option>
          <option value="Oldest">Oldest First</option>
        </select>

        <div style={S.count}>
          Showing <b>{rows.length}</b> loads
        </div>
      </div>

      {/* ===== TABLE HEAD ===== */}
      <div style={S.tableHead}>
        <span style={S.th}>Date</span>
        <span style={S.th}>Route</span>
        <span style={S.th}>Position</span>
        <span style={S.th}>Miles</span>
        <span style={S.th}>Pay</span>
        <span style={S.th}>Contact</span>
        <span style={S.th}>Status</span>
      </div>

      {/* ===== ROWS ===== */}
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
                <span style={S.cell}>{l.date}</span>
                <span style={S.cellStrong}>
                  {l.pu.state} → {l.dl.state}
                  <span style={S.cellSub}>
                    {" "}
                    • {l.pu.city}, {l.pu.state} → {l.dl.city}, {l.dl.state}
                  </span>
                </span>
                <span style={S.cell}>{l.position}</span>
                <span style={S.cell}>{typeof l.miles === "number" ? `${l.miles} mi` : "—"}</span>
                <span style={S.cellPay}>{fmtPay(l.payTerm)}</span>
                <span style={S.cell}>{l.contact.method}</span>
                <span style={l.status === "Open" ? S.open : S.covered}>{l.status}</span>
              </div>

              {expanded === l.id && (
                <div style={S.expand}>
                  <div style={S.expandGrid}>
                    <div style={S.box}>
                      <div style={S.boxLabel}>Pickup</div>
                      <div style={S.boxVal}>
                        {l.pu.city}, {l.pu.state} {l.pu.zip}
                      </div>
                    </div>
                    <div style={S.box}>
                      <div style={S.boxLabel}>Drop</div>
                      <div style={S.boxVal}>
                        {l.dl.city}, {l.dl.state} {l.dl.zip}
                      </div>
                    </div>
                    <div style={S.box}>
                      <div style={S.boxLabel}>Pay Terms</div>
                      <div style={S.boxVal}>{fmtPay(l.payTerm)}</div>
                    </div>
                    <div style={S.box}>
                      <div style={S.boxLabel}>Contact</div>
                      <div style={S.boxVal}>
                        {l.contact.method}: {l.contact.value}
                      </div>
                    </div>
                    <div style={S.box}>
                      <div style={S.boxLabel}>Load ID</div>
                      <div style={S.boxVal}>{l.id}</div>
                    </div>
                    <div style={S.box}>
                      <div style={S.boxLabel}>Flags</div>
                      <div style={S.boxVal}>
                        {(l.flags ?? []).length === 0 ? "—" : (l.flags ?? []).join(", ")}
                      </div>
                    </div>
                  </div>

                  <div style={S.expandActions}>
                    {l.contact.method === "Email" ? (
                      <a href={`mailto:${l.contact.value}`} style={S.actionBtn}>
                        Email
                      </a>
                    ) : (
                      <a href={`tel:${l.contact.value.replace(/[^0-9+]/g, "")}`} style={S.actionBtn}>
                        Call
                      </a>
                    )}
                    <a href="/bid-board" style={S.actionBtnGhost}>
                      Switch to Bid Board
                    </a>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* ===== FOOTER ===== */}
      <footer style={S.footer}>
        <div style={S.footerLeft}>
          <div style={S.footerBrand}>OVERSIZE ESCORT HUB</div>
          <div style={S.footerSub}>support@oversize-escort-hub.com • verification@oversize-escort-hub.com</div>
        </div>
        <div style={S.footerRight}>
          <a href="/terms" style={S.footerLink}>
            Terms
          </a>
          <a href="/privacy" style={S.footerLink}>
            Privacy
          </a>
          <a href="/conduct" style={S.footerLink}>
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

const S: any = {
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

  tableHead: {
    margin: "0 48px",
    display: "grid",
    gridTemplateColumns: ".9fr 2.6fr 1.3fr .8fr 1.1fr .8fr .7fr",
    padding: "10px 12px",
    borderBottom: "1px solid rgba(255,255,255,0.10)",
    color: "rgba(229,231,235,0.55)",
    fontWeight: 950,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    fontSize: 12,
  },
  th: {},

  rows: { margin: "0 48px", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 16, overflow: "hidden" },
  rowWrap: { borderBottom: "1px solid rgba(255,255,255,0.06)" },
  row: {
    display: "grid",
    gridTemplateColumns: ".9fr 2.6fr 1.3fr .8fr 1.1fr .8fr .7fr",
    padding: "10px 12px",
    alignItems: "center",
    background: "rgba(255,255,255,0.02)",
    cursor: "pointer",
  },
  cell: { fontSize: 13, color: "rgba(229,231,235,0.86)", fontWeight: 750 },
  cellStrong: { fontSize: 13, color: "#ffffff", fontWeight: 950, whiteSpace: "nowrap" as const, overflow: "hidden" },
  cellSub: { fontSize: 12, fontWeight: 800, color: "rgba(229,231,235,0.55)" },
  cellPay: { fontSize: 13, fontWeight: 950, color: "#00b4ff" },

  open: { fontSize: 13, fontWeight: 950, color: "#00e676" },
  covered: { fontSize: 13, fontWeight: 950, color: "rgba(229,231,235,0.45)" },

  expand: {
    padding: "12px 12px 14px",
    background: "rgba(0,0,0,0.22)",
    borderTop: "1px solid rgba(255,255,255,0.08)",
  },
  expandGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 10,
  },
  box: {
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 14,
    padding: 12,
    background: "rgba(255,255,255,0.03)",
  },
  boxLabel: { fontSize: 11, letterSpacing: 1.6, textTransform: "uppercase", opacity: 0.6, fontWeight: 950 },
  boxVal: { marginTop: 8, fontSize: 13, fontWeight: 850, color: "rgba(229,231,235,0.86)" },

  expandActions: { marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" as const },
  actionBtn: {
    textDecoration: "none",
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "linear-gradient(135deg, #00a8e8, #1fb6ff)",
    color: "#001018",
    fontWeight: 950,
    fontSize: 13,
  },
  actionBtnGhost: {
    textDecoration: "none",
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.05)",
    color: "rgba(229,231,235,0.90)",
    fontWeight: 950,
    fontSize: 13,
  },

  empty: {
    padding: "26px 12px",
    textAlign: "center" as const,
    fontWeight: 950,
    color: "rgba(229,231,235,0.72)",
    background: "rgba(255,255,255,0.02)",
  },
  emptySub: { marginTop: 6, fontSize: 12, fontWeight: 800, color: "rgba(229,231,235,0.50)" },

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
