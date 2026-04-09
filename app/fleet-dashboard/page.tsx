"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

type Escort = {
  id: string
  name: string
  phone: string
  location: string
  available: boolean
}

export default function FleetDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [escorts, setEscorts] = useState<Escort[]>([
    { id: "1", name: "Mike Reynolds", phone: "555-0101", location: "Dallas, TX", available: true },
    { id: "2", name: "Sarah Kim", phone: "555-0102", location: "OKC, OK", available: false },
    { id: "3", name: "James Porter", phone: "555-0103", location: "Amarillo, TX", available: true },
  ])
  const [newName, setNewName] = useState("")
  const [newPhone, setNewPhone] = useState("")
  const [newLocation, setNewLocation] = useState("")
  const [deadheadFrom, setDeadheadFrom] = useState("")
  const [deadheadTo, setDeadheadTo] = useState("")

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { router.replace("/signin"); return }
      supabase.from("profiles").select("*").eq("id", data.session.user.id).single().then(({ data: p }) => {
        if (!p) { router.replace("/signin"); return }
        if (p.tier === "free" || p.tier === "member") { router.replace("/pricing?msg=fleet_manager_pro_required"); return }
        setProfile(p)
        setLoading(false)
      })
    })
  }, [])

  function addEscort() {
    if (!newName.trim()) return
    setEscorts(prev => [...prev, { id: Date.now().toString(), name: newName.trim(), phone: newPhone.trim(), location: newLocation.trim(), available: true }])
    setNewName(""); setNewPhone(""); setNewLocation("")
  }

  function toggleAvailable(id: string) {
    setEscorts(prev => prev.map(e => e.id === id ? { ...e, available: !e.available } : e))
  }

  if (loading) return <main style={S.main}><p style={{color:"#fff",padding:40,textAlign:"center"}}>Loading fleet data...</p></main>

  const activeCount = escorts.filter(e => e.available).length

  return (
    <main style={S.main}>
      {/* HEADER */}
      <header style={S.header}>
        <a href="/" style={S.brandWrap}><div style={S.brand}>OVERSIZE ESCORT HUB</div><div style={S.subBrand}>FLEET MANAGER DASHBOARD</div></a>
        <nav style={S.nav}>
          <a href="/loads" style={S.navLink}>Open Loads</a>
          <a href="/bid-board" style={S.navLink}>Bid Board</a>
          <a href="/fleet-dashboard" style={{...S.navLink, color:"#3b82f6"}}>Fleet Dashboard</a>
          <a href="/pricing" style={S.navLink}>Pricing</a>
        </nav>
      </header>

      <div style={S.pageWrap}>
        {/* TITLE ROW */}
        <div style={S.titleRow}>
          <div>
            <h1 style={S.h1}>Fleet Manager Dashboard</h1>
            <p style={S.sub}>Managing {escorts.length} escort{escorts.length !== 1 ? "s" : ""} • {activeCount} available now</p>
          </div>
          <div style={S.badges}>
            <span style={S.proBadge}>PRO</span>
            <span style={S.fleetBadge}>FLEET MANAGER</span>
          </div>
        </div>

        {/* STATS ROW */}
        <div style={S.statsRow}>
          <div style={S.stat}><div style={S.statNum}>{escorts.length}</div><div style={S.statLabel}>Escorts Managed</div></div>
          <div style={S.stat}><div style={S.statNum}>{activeCount}</div><div style={S.statLabel}>Currently Available</div></div>
          <div style={S.stat}><div style={S.statNum}>0</div><div style={S.statLabel}>Active Jobs This Month</div></div>
          <div style={S.stat}><div style={S.statNum}>0</div><div style={S.statLabel}>Total Loads Found</div></div>
        </div>

        <div style={S.columns}>
          <div style={S.mainCol}>
            {/* ESCORT ROSTER */}
            <div style={S.card}>
              <div style={S.cardTitle}>My Escort Roster</div>
              <table style={S.table}>
                <thead>
                  <tr>
                    <th style={S.th}>Name</th>
                    <th style={S.th}>Phone</th>
                    <th style={S.th}>Location</th>
                    <th style={S.th}>Status</th>
                    <th style={S.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {escorts.map(e => (
                    <tr key={e.id} style={S.tr}>
                      <td style={S.td}>{e.name}</td>
                      <td style={S.td}>{e.phone || "—"}</td>
                      <td style={S.td}>{e.location || "—"}</td>
                      <td style={S.td}><span style={e.available ? S.available : S.unavailable}>{e.available ? "Available" : "On Job"}</span></td>
                      <td style={S.td}>
                        <button onClick={() => toggleAvailable(e.id)} style={S.toggleBtn}>{e.available ? "Mark Busy" : "Mark Free"}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* ADD ESCORT FORM */}
              <div style={S.addRow}>
                <input style={S.input} placeholder="Escort name *" value={newName} onChange={e => setNewName(e.target.value)} />
                <input style={S.input} placeholder="Phone" value={newPhone} onChange={e => setNewPhone(e.target.value)} />
                <input style={S.input} placeholder="Location (City, ST)" value={newLocation} onChange={e => setNewLocation(e.target.value)} />
                <button onClick={addEscort} style={S.addBtn}>+ Add Escort</button>
              </div>
              {escorts.length >= 5 && <p style={{color:"#f59e0b",fontSize:12,marginTop:8}}>Pro plan supports up to 5 escorts. Upgrade to expand your fleet.</p>}
            </div>

            {/* FLEET DEADHEAD SEARCH */}
            <div style={S.card}>
              <div style={S.cardTitle}>Fleet Deadhead Search <span style={S.proBadge}>PRO</span></div>
              <p style={S.cardSub}>Find return loads for your escorts. Enter current drop location and target home state.</p>
              <div style={S.deadheadRow}>
                <input style={S.input} placeholder="Current drop city (e.g. Dallas, TX)" value={deadheadFrom} onChange={e => setDeadheadFrom(e.target.value)} />
                <input style={S.input} placeholder="Target home state (e.g. OK)" value={deadheadTo} onChange={e => setDeadheadTo(e.target.value)} />
                <button style={S.searchBtn} onClick={() => alert("Deadhead search — connect to matching engine")}>Search Loads</button>
              </div>
              <p style={{color:"#6b7280",fontSize:12,marginTop:8}}>Switch to Fleet mode in the Deadhead Minimizer for batch routing across all escorts.</p>
            </div>

            {/* ACTIVE MATCHES */}
            <div style={S.card}>
              <div style={S.cardTitle}>Active Matches</div>
              <p style={S.cardSub}>Loads currently matched to your escorts will appear here.</p>
              <div style={S.emptyState}>No active matches yet. Post loads on the open boards to get started.</div>
            </div>

            {/* RECENT ACTIVITY */}
            <div style={S.card}>
              <div style={S.cardTitle}>Recent Activity</div>
              <p style={S.cardSub}>Log of searches and matches for your fleet.</p>
              <div style={S.emptyState}>Activity will appear here once you start searching for loads.</div>
            </div>
          </div>

          <div style={S.sideCol}>
            {/* SMS QUICK POST */}
            <div style={S.card}>
              <div style={S.cardTitle}>SMS Quick Post</div>
              <p style={S.cardSub}>Text loads directly from the field.</p>
              <div style={S.smsBox}>
                <div style={S.smsLabel}>Text format:</div>
                <div style={S.smsCode}>OEH [TYPE] pickup [CITY] destination [CITY] [DATE] [RATE]</div>
                <div style={S.smsExample}>Example:<br/>OEH LEAD pickup Dallas TX destination OKC OK 04/15 $2.50</div>
              </div>
            </div>

            {/* UPSIDE FUEL SAVINGS */}
            <div style={S.card}>
              <div style={S.cardTitle}>Upside Fuel Savings</div>
              <p style={S.cardSub}>Save on fuel for your whole fleet with Upside cashback.</p>
              <a href="https://upside.com" target="_blank" rel="noopener noreferrer" style={S.upsideBtn}>Open Upside App →</a>
              <p style={{color:"#6b7280",fontSize:11,marginTop:8}}>OEH may earn a referral commission. Fuel savings average $0.25/gallon.</p>
            </div>

            {/* PRO FEATURES */}
            <div style={S.card}>
              <div style={S.cardTitle}>Pro Features</div>
              <ul style={S.featureList}>
                <li style={S.featureItem}>✓ Manage up to 5 escorts</li>
                <li style={S.featureItem}>✓ Fleet deadhead minimizer</li>
                <li style={S.featureItem}>✓ SMS load alerts for fleet</li>
                <li style={S.featureItem}>✓ Priority bid board access</li>
                <li style={S.featureItem}>✓ NWS weather alerts</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

const S: any = {
  main: { minHeight: "100vh", background: "#060b16", color: "#e5e7eb", fontFamily: "Inter, system-ui, sans-serif" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 48px", borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" },
  brandWrap: { textDecoration: "none", color: "inherit" },
  brand: { fontSize: 24, fontWeight: 950, color: "#3b82f6", letterSpacing: 0.4 },
  subBrand: { marginTop: 2, fontSize: 11, opacity: 0.7, letterSpacing: 2 },
  nav: { display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" as const },
  navLink: { color: "rgba(229,231,235,0.85)", textDecoration: "none", fontWeight: 800, fontSize: 13 },
  pageWrap: { padding: "32px 48px", maxWidth: 1400, margin: "0 auto" },
  titleRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap" as const, gap: 12 },
  h1: { margin: 0, fontSize: 32, fontWeight: 950 },
  sub: { marginTop: 6, color: "rgba(229,231,235,0.65)", fontSize: 14 },
  badges: { display: "flex", gap: 8, alignItems: "center" },
  proBadge: { padding: "4px 10px", borderRadius: 999, background: "rgba(59,130,246,0.2)", border: "1px solid rgba(59,130,246,0.4)", color: "#3b82f6", fontSize: 11, fontWeight: 900 },
  fleetBadge: { padding: "4px 10px", borderRadius: 999, background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.4)", color: "#10b981", fontSize: 11, fontWeight: 900 },
  statsRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 28 },
  stat: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "20px 24px" },
  statNum: { fontSize: 36, fontWeight: 950, color: "#3b82f6" },
  statLabel: { fontSize: 12, color: "rgba(229,231,235,0.6)", marginTop: 4, fontWeight: 700, letterSpacing: 0.5 },
  columns: { display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, alignItems: "start" },
  mainCol: { display: "grid", gap: 20 },
  sideCol: { display: "grid", gap: 16 },
  card: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "20px 22px" },
  cardTitle: { fontWeight: 950, fontSize: 16, marginBottom: 10, color: "#e5e7eb", display: "flex", alignItems: "center", gap: 8 },
  cardSub: { fontSize: 13, color: "rgba(229,231,235,0.6)", marginBottom: 14, marginTop: -6 },
  table: { width: "100%", borderCollapse: "collapse" as const, fontSize: 13 },
  th: { padding: "8px 12px", textAlign: "left" as const, color: "rgba(229,231,235,0.5)", fontWeight: 900, letterSpacing: 1.2, textTransform: "uppercase" as const, fontSize: 11, borderBottom: "1px solid rgba(255,255,255,0.08)" },
  tr: { borderBottom: "1px solid rgba(255,255,255,0.06)" },
  td: { padding: "10px 12px", color: "rgba(229,231,235,0.86)", verticalAlign: "middle" as const },
  available: { padding: "3px 10px", borderRadius: 999, background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", color: "#10b981", fontSize: 12, fontWeight: 900 },
  unavailable: { padding: "3px 10px", borderRadius: 999, background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)", color: "#f59e0b", fontSize: 12, fontWeight: 900 },
  toggleBtn: { padding: "5px 10px", borderRadius: 8, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "#e5e7eb", fontSize: 12, cursor: "pointer", fontWeight: 700 },
  addRow: { display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" as const },
  input: { padding: "10px 12px", borderRadius: 10, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", fontSize: 13, outline: "none", flex: "1 1 140px" },
  addBtn: { padding: "10px 16px", borderRadius: 10, background: "linear-gradient(135deg,#3b82f6,#60a5fa)", color: "#fff", border: "none", cursor: "pointer", fontWeight: 900, fontSize: 13, whiteSpace: "nowrap" as const },
  deadheadRow: { display: "flex", gap: 8, flexWrap: "wrap" as const },
  searchBtn: { padding: "10px 16px", borderRadius: 10, background: "linear-gradient(135deg,#3b82f6,#60a5fa)", color: "#fff", border: "none", cursor: "pointer", fontWeight: 900, fontSize: 13, whiteSpace: "nowrap" as const },
  emptyState: { padding: "20px", textAlign: "center" as const, color: "rgba(229,231,235,0.4)", fontSize: 13, background: "rgba(0,0,0,0.15)", borderRadius: 10 },
  smsBox: { background: "rgba(0,0,0,0.2)", borderRadius: 10, padding: "14px 16px" },
  smsLabel: { fontSize: 11, color: "rgba(229,231,235,0.5)", fontWeight: 900, letterSpacing: 1.2, marginBottom: 6 },
  smsCode: { fontFamily: "monospace", fontSize: 13, color: "#3b82f6", marginBottom: 10 },
  smsExample: { fontSize: 12, color: "rgba(229,231,235,0.65)", lineHeight: 1.6 },
  upsideBtn: { display: "inline-block", padding: "10px 16px", borderRadius: 10, background: "linear-gradient(135deg,#3b82f6,#60a5fa)", color: "#fff", textDecoration: "none", fontWeight: 900, fontSize: 13 },
  featureList: { listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 },
  featureItem: { fontSize: 13, color: "#10b981", fontWeight: 700 },
};
