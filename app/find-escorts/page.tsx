"use client"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import SiteHeader from "@/components/SiteHeader"
import PageTitle from "@/components/PageTitle"
import EmptyState from "@/components/EmptyState"
import { isNativeApp } from "@/lib/native"

const supabase = createClient()

const US_STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"]

export default function FindEscortsPage() {
  const router = useRouter()
  const [escorts, setEscorts] = useState<any[]>([])
  const [sponsored, setSponsored] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stateFilter, setStateFilter] = useState("")
  const [memberFilter, setMemberFilter] = useState("all")
  const [inApp, setInApp] = useState(false)
  useEffect(() => { setInApp(isNativeApp()) }, [])

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
      sponsoredQuery = sponsoredQuery.or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
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
          <PageTitle
            eyebrow="Find escorts"
            title="Find P/EVO escorts"
            lead="Browse oversize escort pilots available in your area."
            right={
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ minWidth: 150 }}>
                  <label className="ui-label" htmlFor="fe-state">State</label>
                  <select id="fe-state" className="ui-select" value={stateFilter} onChange={e => setStateFilter(e.target.value)}>
                    <option value="">All states</option>
                    {US_STATES.map(st => <option key={st} value={st}>{st}</option>)}
                  </select>
                </div>
                <div style={{ minWidth: 150 }}>
                  <label className="ui-label" htmlFor="fe-member">Members</label>
                  <select id="fe-member" className="ui-select" value={memberFilter} onChange={e => setMemberFilter(e.target.value)}>
                    <option value="all">All members</option>
                    <option value="pro">Pro only</option>
                    <option value="bgc">BGC verified</option>
                  </select>
                </div>
              </div>
            }
          />

          {!inApp && sponsored.length > 0 && (
            <div className="ui-card" style={{ marginBottom: 24, borderColor: 'rgba(255,196,107,.35)' }}>
              <div style={{ marginBottom: 14 }}><span className="ui-badge amber">Sponsored escorts{stateFilter ? ` \u2014 ${stateFilter}` : ''}</span></div>
              <div className="ui-grid">
                {sponsored.map((e: any) => (
                  <div key={e.id} className="ui-load" style={{ cursor: 'pointer' }} onClick={() => router.push(`/escorts/${e.id}`)}>
                    <div>
                      <div className="ui-route">{e.full_name || "Unnamed"}</div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                        <span className="ui-badge amber">Sponsored</span>
                        <span className={`ui-badge ${e.tier === "pro" ? 'orange' : 'blue'}`}>{e.tier === "pro" ? "Pro" : "Member"}</span>
                        {e.bgc_verified && <span className="ui-badge green">&#10003; BGC</span>}
                      </div>
                    </div>
                    <button className="ui-btn block ghost">View profile</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {loading ? (
            <p className="ui-meta" style={{ textAlign: 'center', padding: 40 }}>Loading escorts&hellip;</p>
          ) : escorts.length === 0 ? (
            <EmptyState
              title={`No escorts found${stateFilter ? ` in ${stateFilter}` : ""}`}
              text="Try another state or filter. New escorts join every day."
            />
          ) : (
            <div className="ui-grid">
              {escorts.map((e: any) => (
                <div key={e.id} className="ui-load" style={{ cursor: 'pointer' }} onClick={() => router.push(`/escorts/${e.id}`)}>
                  <div>
                    <div className="ui-route">{e.full_name || "Unnamed"}</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                      <span className={`ui-badge ${e.tier === "pro" ? 'orange' : 'blue'}`}>{e.tier === "pro" ? "\u2B50 Pro" : "Member"}</span>
                      {e.bgc_verified && <span className="ui-badge green">&#10003; BGC</span>}
                    </div>
                    {e.zones.length > 0 && (
                      <div className="ui-meta" style={{ marginTop: 10 }}>Zones: {e.zones.slice(0,5).map((z: any) => z.location_state).join(", ")}{e.zones.length > 5 ? ` +${e.zones.length-5}` : ""}</div>
                    )}
                    {e.cert_types.length > 0 && (
                      <div className="ui-meta" style={{ marginTop: 6 }}>Certs: {e.cert_types.join(", ")}</div>
                    )}
                    {e.avgRating && (
                      <div className="ui-meta" style={{ marginTop: 6, color: '#ffc46b', fontWeight: 600 }}>&#9733; {e.avgRating} ({e.reviewCount})</div>
                    )}
                  </div>
                  <button className="ui-btn block ghost">View profile</button>
                </div>
              ))}
            </div>
          )}

          <nav aria-label="Find escorts by state" style={{ marginTop: 48 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 12px', color: '#fff' }}>Find escorts by state</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px' }}>
              {US_STATES.map(st => (
                <a key={st} href={`/pilot-car-escorts/${st.toLowerCase()}`} className="ui-link" style={{ fontSize: 13 }}>{st}</a>
              ))}
            </div>
          </nav>
        </div>
      </div>
    </>
  )
}
