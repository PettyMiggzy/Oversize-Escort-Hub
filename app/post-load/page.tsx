"use client"
import { useEffect, useState } from "react"
import Link from 'next/link';
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"


const STATE_ADJ: Record<string, string[]> = {
  AL:['MS','TN','GA','FL'],AK:[],AZ:['CA','NV','UT','CO','NM'],AR:['MO','TN','MS','LA','TX','OK'],
  CA:['OR','NV','AZ'],CO:['WY','NE','KS','OK','NM','AZ','UT'],CT:['NY','MA','RI'],DE:['MD','PA','NJ'],
  FL:['GA','AL'],GA:['TN','NC','SC','FL','AL'],HI:[],ID:['MT','WY','UT','NV','OR','WA'],
  IL:['WI','IN','KY','MO','IA'],IN:['MI','OH','KY','IL'],IA:['MN','WI','IL','MO','NE','SD'],
  KS:['NE','MO','OK','CO'],KY:['OH','WV','VA','TN','MO','IL','IN'],LA:['TX','AR','MS'],
  ME:['NH'],MD:['PA','DE','VA','WV'],MA:['NH','VT','NY','CT','RI'],MI:['OH','IN','WI'],
  MN:['ND','SD','IA','WI'],MS:['TN','AL','LA','AR'],MO:['IA','IL','KY','TN','AR','OK','KS','NE'],
  MT:['ND','SD','WY','ID'],NE:['SD','IA','MO','KS','CO','WY'],NV:['OR','ID','UT','AZ','CA'],
  NH:['ME','VT','MA'],NJ:['NY','PA','DE'],NM:['CO','OK','TX','AZ'],NY:['PA','NJ','CT','MA','VT'],
  NC:['VA','TN','SC','GA'],ND:['MT','SD','MN'],OH:['PA','WV','KY','IN','MI'],
  OK:['KS','MO','AR','TX','NM','CO'],OR:['WA','ID','NV','CA'],PA:['NY','NJ','DE','MD','WV','OH'],
  RI:['CT','MA'],SC:['NC','GA'],SD:['ND','MN','IA','NE','WY','MT'],
  TN:['KY','VA','NC','GA','AL','MS','AR','MO'],TX:['NM','OK','AR','LA'],
  UT:['ID','WY','CO','NM','AZ','NV'],VT:['NY','NH','MA'],VA:['MD','WV','KY','TN','NC'],
  WA:['OR','ID'],WV:['OH','PA','MD','VA','KY'],WI:['MN','MI','IL','IA'],WY:['MT','SD','NE','CO','UT','ID'],
};

function getRouteStatesBFS(from: string, to: string): string[] {
  if (!from || !to) return [];
  if (from === to) return [from];
  if (!STATE_ADJ[from] || !STATE_ADJ[to]) return [from, to];
  const queue: string[][] = [[from]];
  const visited = new Set<string>([from]);
  while (queue.length > 0) {
    const path = queue.shift()!;
    const cur = path[path.length - 1];
    for (const nb of STATE_ADJ[cur] || []) {
      if (!visited.has(nb)) {
        const np = [...path, nb];
        if (nb === to) return np;
        visited.add(nb);
        queue.push(np);
      }
    }
  }
  return [from, to];
}

export default function PostLoadPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [allowed, setAllowed] = useState(false)
  const [roleMsg, setRoleMsg] = useState("")
  // permit miles state
  const [pickupState, setPickupState] = useState("")
  const [destState, setDestState] = useState("")
  const [permitAgreement, setPermitAgreement] = useState(false)
  const [showRouteStates, setShowRouteStates] = useState(false);
  const [estMiles, setEstMiles] = useState("")

  const routeStates = getRouteStatesBFS(pickupState.trim().toUpperCase(), destState.trim().toUpperCase())
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace("/signin?msg=You+must+be+signed+in+as+a+carrier+or+freight+broker+to+post+a+load.")
        return
      }
      supabase.from("profiles").select("role").eq("id", data.session.user.id).single().then(({ data: profile }) => {
        if (profile?.role === "escort") {
          setRoleMsg("Load posting is for carriers and freight brokers only.")
          setAllowed(false)
        } else {
          setAllowed(true)
        }
        setLoading(false)
      })
    })
  }, [])

  if (loading) return <main style={S.main}><p style={{color:"#fff",padding:"40px",textAlign:"center"}}>Loading...</p></main>
  if (!allowed && roleMsg) return (
    <main style={S.main}>
      <div style={{maxWidth:600,margin:"80px auto",padding:"40px",background:"#1a1a1a",borderRadius:12,border:"1px solid #ff6600",textAlign:"center"}}>
        <p style={{color:"#ff6600",fontSize:20,fontWeight:700,marginBottom:16}}>⚠️ Access Restricted</p>
        <p style={{color:"#fff",fontSize:16}}>{roleMsg}</p>
      </div>
    </main>
  )

  return (
    <main style={S.main}>
      <Header />
      <section style={S.wrap}>
        <h1 style={S.h1}>Post a Load (FREE)</h1>
        <p style={S.sub}>
          Carriers and freight brokers post loads free. Always. Escorts will only bid on complete, clear postings.
        </p>
        <div style={S.panel}>
          <form style={S.form}>
            {/* LOAD INFO */}
            <Section title="Load Details" />
            <Grid>
              <Input label="Pickup City" required />
              <div style={S.field}>
                <label style={S.label}>Pickup State *</label>
                <input style={S.input} value={pickupState} onChange={e => setPickupState(e.target.value.toUpperCase().slice(0,2))} placeholder="TX" maxLength={2} />
              </div>
              <Input label="Pickup ZIP" required />
              <Input label="Drop-off City" required />
              <div style={S.field}>
                <label style={S.label}>Drop-off State *</label>
                <input style={S.input} value={destState} onChange={e => setDestState(e.target.value.toUpperCase().slice(0,2))} placeholder="OK" maxLength={2} />
              </div>
              <Input label="Drop-off ZIP" required />
            </Grid>
            {/* PERMIT STATES AUTO-DETECT */}
            {routeStates && (
              <div style={S.permitStatesBox}>
                <span style={S.permitStatesLabel}>Permit states (estimated)</span>
                <span style={S.permitStatesValue}>States on route: {routeStates}</span>
                <span style={S.permitStatesNote}>Exact route states calculated at permit time. Add intermediate states manually if known.</span>
              </div>
            )}
            <Grid>
              <div style={S.field}>
                <label style={S.label}>Estimated Miles</label>
                <input style={S.input} value={estMiles} onChange={e => setEstMiles(e.target.value.replace(/[^0-9]/g,""))} placeholder="e.g. 350" />
                <span style={S.permitNote}>Actual permitted miles may differ. Escorts are paid on permitted miles.</span>
              </div>
              {/* States on your route */}
              {routeStates.length > 1 && (
                <div style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 10, padding: '14px 16px', marginBottom: 8 }}>
                  <button
                    type="button"
                    onClick={() => setShowRouteStates(s => !s)}
                    style={{ background: 'none', border: 'none', color: '#60a5fa', fontWeight: 700, fontSize: 13, cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 6, width: '100%', textAlign: 'left' }}
                  >
                    <span>{showRouteStates ? '▼' : '▶'}</span>
                    <span>States on your route ({routeStates.length})</span>
                    <Link href={'/tools/permits?from=' + (pickupState || '') + '&to=' + (destState || '')} style={{ marginLeft: 'auto', color: '#f97316', fontSize: 12, textDecoration: 'none' }} onClick={e => e.stopPropagation()}>
                      View permit contacts →
                    </Link>
                  </button>
                  {showRouteStates && (
                    <div style={{ marginTop: 10 }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                        {routeStates.map((s, i) => (
                          <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ background: '#1e3a5f', color: '#93c5fd', fontSize: 12, fontWeight: 700, padding: '3px 9px', borderRadius: 16 }}>{s}</span>
                            {i < routeStates.length - 1 && <span style={{ color: '#374151', fontSize: 11 }}>›</span>}
                          </span>
                        ))}
                      </div>
                      <p style={{ margin: 0, fontSize: 11, color: '#6b7280' }}>
                        Each state requires a separate permit. <Link href="/tools/permits" style={{ color: '#f97316', textDecoration: 'none' }}>View full permit directory →</Link>
                      </p>
                    </div>
                  )}
                </div>
              )}
              <Input label="Load Date (MM/DD/YYYY)" required />
              <Select label="Escort Position Needed" options={["Lead","Escort","High Pole","Route Survey","Steer / Tiller"]} />
              <Select label="Board Type" options={["Regular Load Board","Bid Board (5-minute window)"]} />
            </Grid>
            {/* PERMIT MILES AGREEMENT */}
            <div style={S.agreementBox}>
              <label style={S.agreementLabel}>
                <input type="checkbox" checked={permitAgreement} onChange={e => setPermitAgreement(e.target.checked)} style={{marginRight:10,width:18,height:18,accentColor:"#00a8e8"}} />
                <span>
                  <strong style={{color:"#00a8e8"}}>Permit Miles Agreement (required)</strong><br/>
                  I agree that the bid price applies to actual permitted miles, not estimated mileage. If permitted route increases mileage, the agreed per-mile rate applies to final permitted miles.
                </span>
              </label>
            </div>
            {/* PAY TERMS */}
            <Section title="Pay Terms" />
            <Grid>
              <Select label="Pay Timeframe" options={["Fast Pay (within 10 business days)","7 Days","10 Days","Custom"]} />
              <Input label="Max $ / Mile (Bid Board)" />
              <Input label="Overnight Rate ($100 recommended)" />
              <Input label="No-Go Fee ($300 recommended)" />
            </Grid>
            {/* SPECIAL REQUIREMENTS */}
            <Section title="Special Requirements (Optional)" />
            <Grid>
              <Check label="Lead" />
              <Check label="Chase" />
              <Check label="High Pole" />
              <Check label="Lineman" />
              <Check label="Rear Steer" />
              <Check label="Survey" />
              <Check label="Flagger" />
              <Check label="NY Cert" />
              <Check label="CSE (Ontario MTO)" />
              <Check label="BC Pilot Car" />
              <Check label="WITPAC" />
              <Check label="TWIC" />
              <Check label="AZ Cert" />
              <Check label="CTTS BC/AB" />
              <Check label="OAPC Ontario" />
              <Check label="Saskatchewan" />
              <Check label="Quick Pay Preferred" />
            </Grid>
            {/* CONTACT */}
            <Section title="Contact Method" />
            <Grid>
              <Input label="Company / Contact Name" required />
              <Input label="Phone Number" required />
              <Input label="Email Address" required />
              <Input label="MC Number" required />
              <Input label="DOT Number" required />
              <p style={{fontSize:12,color:"#999",gridColumn:"1 / -1",marginTop:4}}>
                Your MC/DOT number is verified against FMCSA public records. Fraudulent postings will result in permanent ban.
              </p>
            </Grid>
            <div style={S.notice}>
              Escorts are responsible for carrying proper insurance. This platform connects parties — agreements are between escort and company.
            </div>
            <button style={{...S.primaryBtn, opacity: permitAgreement ? 1 : 0.5, cursor: permitAgreement ? "pointer" : "not-allowed"}} disabled={!permitAgreement}>POST LOAD FREE</button>
            {!permitAgreement && <p style={{color:"#f59e0b",fontSize:13,textAlign:"center",marginTop:8}}>⚠️ You must accept the Permit Miles Agreement before posting.</p>}
          </form>
        </div>
      </section>
      <Footer />
    </main>
  );
}

/* ================= COMPONENTS ================= */
function Header() {
  return (
    <header style={S.header}>
      <a href="/" style={S.brand}>OVERSIZE ESCORT HUB</a>
      <nav style={S.nav}>
        <a style={S.navLink} href="/loads">Load Boards</a>
        <a style={S.navLink} href="/pricing">Membership</a>
        <a style={S.navLink} href="/verify">Verification</a>
        <a style={S.navLink} href="/signin">Sign In</a>
      </nav>
    </header>
  );
}
function Footer() {
  return (
    <footer style={S.footer}>
      <div style={S.footerInner}>
        <div>
          <strong>OVERSIZE ESCORT HUB</strong>
          <div style={S.footerMuted}>support@oversize-escort-hub.com</div>
        </div>
        <div style={S.footerLinks}>
          <a style={S.footerLink} href="/terms">Terms</a>
          <a style={S.footerLink} href="/privacy">Privacy</a>
        </div>
      </div>
    </footer>
  );
}
function Section({ title }: { title: string }) {
  return <div style={S.sectionTitle}>{title}</div>;
}
function Grid({ children }: { children: any }) {
  return <div style={S.grid}>{children}</div>;
}
function Input({ label, required }: any) {
  return (
    <div style={S.field}>
      <label style={S.label}>{label} {required && "*"}</label>
      <input style={S.input} />
    </div>
  );
}
function Select({ label, options }: any) {
  return (
    <div style={S.field}>
      <label style={S.label}>{label}</label>
      <select style={S.input}>
        {options.map((o: string) => <option key={o}>{o}</option>)}
      </select>
    </div>
  );
}
function Check({ label }: any) {
  return (
    <label style={S.check}><input type="checkbox" /> {label}</label>
  );
}

/* ================= STYLES ================= */
const S: any = {
  main: { minHeight: "100vh", background: "#060b16", color: "#e5e7eb" },
  header: { padding: "18px 56px", borderBottom: "1px solid rgba(255,255,255,0.1)", display: "flex", justifyContent: "space-between" },
  brand: { fontWeight: 900, color: "#00a8e8", textDecoration: "none" },
  nav: { display: "flex", gap: 16 },
  navLink: { color: "#cbd5e1", textDecoration: "none", fontWeight: 700 },
  wrap: { padding: "40px 56px" },
  h1: { fontSize: 40, fontWeight: 900 },
  sub: { marginTop: 8, color: "#9ca3af" },
  panel: { marginTop: 24, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 20, padding: 24 },
  form: { display: "grid", gap: 22 },
  sectionTitle: { fontWeight: 900, color: "#00a8e8", marginTop: 10 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16 },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 13, fontWeight: 700 },
  input: { padding: "12px", borderRadius: 12, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff" },
  check: { fontSize: 14 },
  notice: { fontSize: 12, color: "#9ca3af", borderLeft: "3px solid #00a8e8", paddingLeft: 10 },
  primaryBtn: { marginTop: 20, padding: "16px", borderRadius: 16, background: "linear-gradient(135deg,#00a8e8,#1fb6ff)", fontWeight: 900, color: "#001018", border: "none" },
  footer: { padding: "30px 56px", borderTop: "1px solid rgba(255,255,255,0.1)", marginTop: 40 },
  footerInner: { display: "flex", justifyContent: "space-between" },
  footerMuted: { fontSize: 13, color: "#9ca3af" },
  footerLinks: { display: "flex", gap: 16 },
  footerLink: { color: "#cbd5e1", textDecoration: "none", fontWeight: 700 },
  // permit miles styles
  permitStatesBox: { background: "rgba(0,168,232,0.08)", border: "1px solid rgba(0,168,232,0.3)", borderRadius: 12, padding: "14px 18px", display: "flex", flexDirection: "column", gap: 4 },
  permitStatesLabel: { fontSize: 11, fontWeight: 900, color: "#00a8e8", letterSpacing: 1.2, textTransform: "uppercase" },
  permitStatesValue: { fontSize: 15, fontWeight: 900, color: "#fff" },
  permitStatesNote: { fontSize: 12, color: "#9ca3af" },
  permitNote: { fontSize: 12, color: "#9ca3af", marginTop: 4 },
  agreementBox: { background: "rgba(0,168,232,0.06)", border: "2px solid rgba(0,168,232,0.35)", borderRadius: 14, padding: "18px 20px" },
  agreementLabel: { display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", fontSize: 14, color: "#e5e7eb", lineHeight: 1.6 },
};
