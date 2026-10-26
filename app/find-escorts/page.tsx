"use client"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import SiteHeader from "@/components/SiteHeader"
import PageTitle from "@/components/PageTitle"
import EmptyState from "@/components/EmptyState"

const supabase = createClient()

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
      .select("id, full_name, tier, bgc_verified")
      .eq("role", "escort")
    if (memberFilter === "pro") q = q.eq("tier", "pro")
    if (memberFilter === "bgc") q = q.eq("bgc_verified", true)
    const { data: profileData } = await q

    if (!profileData) { setLoading(false); return }

    // For each escort get zones and certs
    const enriched = await Promise.all(
      profileData.map(async (p: any) => {
        const { data: zones } = await supabase
          .from("escort_availability")
          .select("location_state")
          .eq("escort_id", p.id)
        const { data: certs } = await supabase
          .from("certifications")
          .select("type")
          .eq("user_id", p.id)
          .eq("status", "approved")
        const { data: reviews } = await supabase
          .from("reviews")
          .select("rating")
          .eq("reviewee_id", p.id)
        const avgRating = reviews && reviews.length > 0
          ? (reviews.reduce((s: number, r: any) => s + (r.rating || 0), 0) / reviews.length).toFixed(1)
          : null
        return { ...p, zones: zones || [], cert_types: (certs || []).map((c: any) => c.type), avgRating, reviewCount: reviews?.length || 0 }
      })
    )

    // Filter by state if selected
    const filtered = stateFilter
      ? enriched.filter((e: any) => e.zones.some((z: any) => z.location_state === stateFilter))
      : enriched

    // Always fetch sponsored escorts — filter by zone if selected, else show top 6 nationally
      let sponsoredQuery = supabase
        .from("sponsored_zones")
        .select("user_id, created_at, profiles:user_id(id, full_name, tier, bgc_verified)")
        .eq("active", true)
        .order("created_at", { ascending: false })
        .limit(6)
      if (stateFilter) sponsoredQuery = sponsoredQuery.eq("zone", stateFilter)
      const { data: sponsoredZones } = await sponsoredQuery
      if (sponsoredZones && sponsoredZones.length > 0) {
        const sponsoredProfiles = sponsoredZones
          .map((sz: any) => sz.profiles)
          .filter(Boolean)
          .map((p: any) => ({ ...p, isSponsored: true }))
        setSponsored(sponsoredProfiles)
      } else {
        setSponsored([])
      }

    setEscorts(filtered)
    setLoading(false)
  }

  return (
    <>
      <SiteHeader />
      <div className="ui-page">
        <div className="ui-wrap">
          <PageTitle eyebrow="Escorts" title="Find P/EVO escorts" lead="Browse verified oversize escort pilots available in your area." />
          <div className="ui-filters">
            <select aria-label="State" className="ui-select" value={stateFilter} onChange={e => setStateFilter(e.target.value)}>
              <option value="">All States</option>
              {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select aria-label="Members" className="ui-select" value={memberFilter} onChange={e => setMemberFilter(e.target.value)}>
              <option value="all">All Members</option>
              <option value="pro">Pro Only</option>
              <option value="bgc">BGC Verified</option>
            </select>
          </div>
          {sponsored.length > 0 && (
            <div className="ui-card" style={{ marginBottom: 24, borderColor: 'rgba(255,196,107,.4)' }}>
              <div className="ui-k" style={{ marginBottom: 12 }}>⭐ Sponsored Escorts — {stateFilter}</div>
              <div className="ui-grid">
                {sponsored.map((e: any) => (
                  <div key={e.id} className="ui-card" style={{ cursor: 'pointer' }} onClick={() => router.push(`/escorts/${e.id}`)}>
                    <div className="ui-route" style={{ fontSize: 16 }}>{e.full_name || "Unnamed"}</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '10px 0' }}>
                      <span className="ui-badge amber">Sponsored</span>
                      <span className={e.tier === "pro" ? "ui-badge orange" : "ui-badge dim"}>{e.tier === "pro" ? "Pro" : "Member"}</span>
                      {e.bgc_verified && <span className="ui-badge green">✓ BGC</span>}
                    </div>
                    <button className="ui-btn block" type="button">View Profile</button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {loading ? (
            <p className="ui-meta">Loading escorts...</p>
          ) : escorts.length === 0 ? (
            <EmptyState
              title={stateFilter ? `No escorts found in ${stateFilter}` : "No escorts found"}
              text="Try another state, or check back when more pilots list their zones."
            />
          ) : (
            <div className="ui-grid">
              {escorts.map((e: any) => (
                <div key={e.id} className="ui-card" style={{ cursor: 'pointer' }} onClick={() => router.push(`/escorts/${e.id}`)}>
                  <div className="ui-route" style={{ fontSize: 16 }}>{e.full_name || "Unnamed"}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '10px 0' }}>
                    <span className={e.tier === "pro" ? "ui-badge orange" : "ui-badge dim"}>{e.tier === "pro" ? "⭐ Pro" : "Member"}</span>
                    {e.bgc_verified && <span className="ui-badge green">✓ BGC</span>}
                  </div>
                  {e.zones.length > 0 && (
                    <div className="ui-meta" style={{ marginBottom: 8 }}>Zones: {e.zones.slice(0,5).map((z: any) => z.location_state).join(", ")}{e.zones.length > 5 ? ` +${e.zones.length-5}` : ""}</div>
                  )}
                  {e.cert_types.length > 0 && (
                    <div className="ui-meta" style={{ marginBottom: 8 }}>Certs: {e.cert_types.join(", ")}</div>
                  )}
                  {e.avgRating && (
                    <div className="ui-meta" style={{ color: '#ffc46b', fontWeight: 600 }}>★ {e.avgRating} ({e.reviewCount})</div>
                  )}
                  <button className="ui-btn block" type="button" style={{ marginTop: 10 }}>View Profile</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
