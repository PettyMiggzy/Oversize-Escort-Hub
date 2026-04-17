"use client"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"
import SiteHeader from "@/components/SiteHeader"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const US_STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"]

export default function FindEscortsPage() {
  const router = useRouter()
  const [escorts, setEscorts] = useState<any[]>([])
  const [sponsored, setSponsored] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stateFilter, setStateFilter] = useState("")
  const [memberFilter, setMemberFilter] = useState("all")

  useEffect(() => {
    fetchEscorts()
  }, [stateFilter, memberFilter])

  async function fetchEscorts() {
    setLoading(true)
    // Base query: profiles where role=escort
    let q = supabase
      .from("profiles")
      .select("id, full_name, membership, bgc_verified, role")
      .eq("role", "escort")
    if (memberFilter === "pro") q = q.eq("membership", "pro")
    if (memberFilter === "bgc") q = q.eq("bgc_verified", true)
    const { data: profileData } = await q

    if (!profileData) { setLoading(false); return }

    // For each escort get zones and certs
    const enriched = await Promise.all(
      profileData.map(async (p: any) => {
        const { data: zones } = await supabase
          .from("escort_availability")
          .select("state")
          .eq("escort_id", p.id)
        const { data: certs } = await supabase
          .from("certifications")
          .select("type")
          .eq("user_id", p.id)
          .eq("status", "approved")
        const { data: reviews } = await supabase
          .from("reviews")
          .select("rating")
          .eq("escort_id", p.id)
        const avgRating = reviews && reviews.length > 0
          ? (reviews.reduce((s: number, r: any) => s + (r.rating || 0), 0) / reviews.length).toFixed(1)
          : null
        return { ...p, zones: zones || [], cert_types: (certs || []).map((c: any) => c.type), avgRating, reviewCount: reviews?.length || 0 }
      })
    )

    // Filter by state if selected
    const filtered = stateFilter
      ? enriched.filter((e: any) => e.zones.some((z: any) => z.state === stateFilter))
      : enriched

    // Fetch sponsored zones if state selected
    if (stateFilter) {
      const { data: sponsoredZones } = await supabase
        .from("sponsored_zones")
        .select("escort_id, profiles(id, full_name, membership, bgc_verified)")
        .eq("zone", stateFilter)
        .eq("active", true)
      if (sponsoredZones && sponsoredZones.length > 0) {
        const sponsoredProfiles = sponsoredZones
          .map((sz: any) => sz.profiles)
          .filter(Boolean)
          .map((p: any) => ({ ...p, isSponsored: true }))
        setSponsored(sponsoredProfiles)
      } else {
        setSponsored([])
      }
    } else {
      setSponsored([])
    }

    setEscorts(filtered)
    setLoading(false)
  }

  const S = {
    page: { minHeight: "100vh", background: "#060b16", color: "#e5e7eb", fontFamily: "system-ui,sans-serif" },
    header: { padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between" },
    brand: { fontWeight: 900, color: "#f0a500", textDecoration: "none", fontSize: 18, cursor: "pointer" },
    hero: { background: "linear-gradient(135deg,#0d1117 0%,#060b16 100%)", padding: "48px 24px 32px", textAlign: "center" as const },
    h1: { fontSize: 32, fontWeight: 800, marginBottom: 8 },
    sub: { color: "#9ca3af", fontSize: 16, marginBottom: 24 },
    filters: { display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" as const, padding: "0 24px 24px" },
    select: { background: "#0d1117", border: "1px solid rgba(255,255,255,0.12)", color: "#e5e7eb", borderRadius: 8, padding: "8px 14px", fontSize: 14, cursor: "pointer" },
    section: { maxWidth: 1100, margin: "0 auto", padding: "0 24px 40px" },
    sponsoredBanner: { background: "rgba(240,165,0,0.06)", border: "1px solid rgba(240,165,0,0.2)", borderRadius: 12, padding: "16px 20px", marginBottom: 24 },
    sponsoredTitle: { color: "#f0a500", fontWeight: 700, fontSize: 13, textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 12 },
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 },
    card: { background: "#0d1117", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 20, cursor: "pointer", transition: "border-color 0.2s" },
    cardName: { fontWeight: 700, fontSize: 16, marginBottom: 6 },
    badges: { display: "flex", gap: 6, flexWrap: "wrap" as const, marginBottom: 10 },
    badge: (c: string) => ({ background: c, color: "#000", fontWeight: 700, fontSize: 11, padding: "2px 8px", borderRadius: 20 }),
    zones: { fontSize: 12, color: "#6b7280", marginBottom: 8 },
    rating: { color: "#f0a500", fontSize: 13, fontWeight: 600 },
    btn: { background: "#f0a500", color: "#000", fontWeight: 700, border: "none", borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontSize: 13, width: "100%", marginTop: 10 },
    empty: { textAlign: "center" as const, padding: "60px 24px", color: "#6b7280" },
  }

  return (
    <div style={S.page}>
      <SiteHeader />
      <div style={S.hero}>
        <h1 style={S.h1}>Find P/EVO Escorts</h1>
        <p style={S.sub}>Browse verified oversize escort pilots available in your area.</p>
      </div>
      <div style={S.filters}>
        <select style={S.select} value={stateFilter} onChange={e => setStateFilter(e.target.value)}>
          <option value="">All States</option>
          {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select style={S.select} value={memberFilter} onChange={e => setMemberFilter(e.target.value)}>
          <option value="all">All Members</option>
          <option value="pro">Pro Only</option>
          <option value="bgc">BGC Verified</option>
        </select>
      </div>
      <div style={S.section}>
        {sponsored.length > 0 && (
          <div style={S.sponsoredBanner}>
            <div style={S.sponsoredTitle}>⭐ Sponsored Escorts — {stateFilter}</div>
            <div style={S.grid}>
              {sponsored.map((e: any) => (
                <div key={e.id} style={{ ...S.card, border: "1px solid rgba(240,165,0,0.4)" }} onClick={() => router.push(`/escorts/${e.id}`)}>
                  <div style={S.cardName}>{e.full_name || "Unnamed"}</div>
                  <div style={S.badges}>
                    <span style={S.badge("#f0a500")}>Sponsored</span>
                    <span style={S.badge(e.membership === "pro" ? "#f0a500" : "#6b7280")}>{e.membership === "pro" ? "Pro" : "Member"}</span>
                    {e.bgc_verified && <span style={S.badge("#22c55e")}>✓ BGC</span>}
                  </div>
                  <button style={S.btn}>View Profile</button>
                </div>
              ))}
            </div>
          </div>
        )}
        {loading ? (
          <div style={S.empty}>Loading escorts...</div>
        ) : escorts.length === 0 ? (
          <div style={S.empty}>No escorts found{stateFilter ? ` in ${stateFilter}` : ""}.</div>
        ) : (
          <div style={S.grid}>
            {escorts.map((e: any) => (
              <div key={e.id} style={S.card} onClick={() => router.push(`/escorts/${e.id}`)}>
                <div style={S.cardName}>{e.full_name || "Unnamed"}</div>
                <div style={S.badges}>
                  <span style={S.badge(e.membership === "pro" ? "#f0a500" : "#6b7280")}>{e.membership === "pro" ? "⭐ Pro" : "Member"}</span>
                  {e.bgc_verified && <span style={S.badge("#22c55e")}>✓ BGC</span>}
                </div>
                {e.zones.length > 0 && (
                  <div style={S.zones}>Zones: {e.zones.slice(0,5).map((z: any) => z.state).join(", ")}{e.zones.length > 5 ? ` +${e.zones.length-5}` : ""}</div>
                )}
                {e.cert_types.length > 0 && (
                  <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 8 }}>Certs: {e.cert_types.join(", ")}</div>
                )}
                {e.avgRating && (
                  <div style={S.rating}>★ {e.avgRating} ({e.reviewCount})</div>
                )}
                <button style={S.btn}>View Profile</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
