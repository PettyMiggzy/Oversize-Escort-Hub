"use client"
import { VERIFICATION_LIVE } from '@/lib/verification'
import { useHiddenUsers } from '@/lib/use-hidden-users'
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import SiteHeader from "@/components/SiteHeader"
import PageTitle from "@/components/PageTitle"
import EmptyState from "@/components/EmptyState"
import { isNativeApp } from "@/lib/native"
import RegularButton from "@/components/RegularButton"
import { EQUIPMENT, cleanEquipment, equipmentShort } from "@/lib/quality"

const supabase = createClient()

const US_STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"]

export default function FindEscortsPage() {
  const router = useRouter()
  const [allEscorts, setEscorts] = useState<any[]>([])
  const hiddenUsers = useHiddenUsers()
  const escorts = allEscorts.filter((e: any) => !hiddenUsers.has(e.id))
  const [sponsored, setSponsored] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stateFilter, setStateFilter] = useState("")
  const [memberFilter, setMemberFilter] = useState("all")
  const [equipFilter, setEquipFilter] = useState("")
  const [canStar, setCanStar] = useState(false)
  const [regulars, setRegulars] = useState<Set<string>>(new Set())
  const [worked, setWorked] = useState<Record<string, number>>({})
  const [inApp, setInApp] = useState(true) // fail closed: treated as the phone app until the browser proves it is the website
  useEffect(() => { setInApp(isNativeApp()) }, [])

  useEffect(() => {
    fetchEscorts()
  }, [stateFilter, memberFilter])

  // carriers, brokers and fleet managers can keep regulars and see who they have worked with
  useEffect(() => {
    let off = false
    ;(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single()
        if (!me || !["carrier", "broker", "fleet_manager", "admin"].includes(String(me.role))) return
        const [{ data: favs }, { data: past }] = await Promise.all([
          supabase.from("favorite_escorts").select("escort_id").eq("carrier_id", user.id),
          supabase.from("loads").select("matched_escort_id").eq("carrier_id", user.id).eq("status", "filled").not("matched_escort_id", "is", null),
        ])
        if (off) return
        setCanStar(true)
        setRegulars(new Set((favs || []).map((f: any) => f.escort_id)))
        const counts: Record<string, number> = {}
        for (const l of (past || []) as any[]) counts[l.matched_escort_id] = (counts[l.matched_escort_id] || 0) + 1
        setWorked(counts)
      } catch { /* the page works without it */ }
    })()
    return () => { off = true }
  }, [])

  async function fetchEscorts() {
    setLoading(true)
    // Base query: profiles where role=escort
    let profileData: any[] | null = null
    try {
      const r = await fetch("/api/escorts/list" + (memberFilter === "pro" ? "?member=pro" : ""))
      if (r.ok) profileData = (await r.json()).escorts ?? []
    } catch { /* shown as empty below */ }
    if (VERIFICATION_LIVE && memberFilter === "bgc" && profileData) profileData = profileData.filter((p: any) => p.bgc_verified === true)

    if (!profileData) { setLoading(false); return }

    // For each escort get zones and certs
    // three batched reads for every escort at once (one read per escort per table made the page take about 9 seconds)
    const ids = profileData.map((p: any) => p.id)
    const [zonesRes, certsRes, reviewsRes] = ids.length ? await Promise.all([
      supabase.from("escort_availability").select("escort_id, location_state").in("escort_id", ids),
      supabase.from("certifications").select("user_id, type").in("user_id", ids).eq("status", "approved"),
      supabase.from("reviews").select("reviewee_id, rating").in("reviewee_id", ids),
    ]) : [{ data: [] }, { data: [] }, { data: [] }]
    const by = (rows: any[] | null | undefined, key: string) => {
      const m = new Map<string, any[]>()
      for (const r of rows ?? []) { const k = r[key]; if (!m.has(k)) m.set(k, []); m.get(k)!.push(r) }
      return m
    }
    const zonesBy = by(zonesRes.data as any[], "escort_id"), certsBy = by(certsRes.data as any[], "user_id"), reviewsBy = by(reviewsRes.data as any[], "reviewee_id")
    const enriched = profileData.map((p: any) => {
      const reviews = reviewsBy.get(p.id) ?? []
      const avgRating = reviews.length > 0 ? (reviews.reduce((s: number, r: any) => s + (r.rating || 0), 0) / reviews.length).toFixed(1) : null
      return { ...p, zones: (zonesBy.get(p.id) ?? []).map((z: any) => ({ location_state: z.location_state })), cert_types: (certsBy.get(p.id) ?? []).map((c: any) => c.type), avgRating, reviewCount: reviews.length }
    })

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
                  <label className="ui-label" htmlFor="fe-equip">Equipment</label>
                  <select id="fe-equip" className="ui-select" value={equipFilter} onChange={e => setEquipFilter(e.target.value)}>
                    <option value="">Any equipment</option>
                    {EQUIPMENT.map(q => <option key={q.key} value={q.key}>Has {q.short.toLowerCase()}</option>)}
                  </select>
                </div>
                <div style={{ minWidth: 150 }}>
                  <label className="ui-label" htmlFor="fe-member">Members</label>
                  <select id="fe-member" className="ui-select" value={memberFilter} onChange={e => setMemberFilter(e.target.value)}>
                    <option value="all">All members</option>
                    <option value="pro">Pro only</option>
                    {VERIFICATION_LIVE && <option value="bgc">BGC verified</option>}
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
                        {VERIFICATION_LIVE && e.bgc_verified && <span className="ui-badge green">&#10003; BGC</span>}
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
              {escorts.filter((e: any) => !equipFilter || cleanEquipment(e.equipment).includes(equipFilter)).sort((a: any, b: any) => Number(regulars.has(b.id)) - Number(regulars.has(a.id))).map((e: any) => (
                <div key={e.id} className="ui-load" style={{ cursor: 'pointer' }} onClick={() => router.push(`/escorts/${e.id}`)}>
                  <div>
                    <div className="ui-route">{e.full_name || "Unnamed"}</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                      <span className={`ui-badge ${e.tier === "pro" ? 'orange' : 'blue'}`}>{e.tier === "pro" ? "\u2B50 Pro" : "Member"}</span>
                      {VERIFICATION_LIVE && e.bgc_verified && <span className="ui-badge green">&#10003; BGC</span>}
                    </div>
                    {e.zones.length > 0 && (
                      <div className="ui-meta" style={{ marginTop: 10 }}>Zones: {e.zones.slice(0,5).map((z: any) => z.location_state).join(", ")}{e.zones.length > 5 ? ` +${e.zones.length-5}` : ""}</div>
                    )}
                    {e.cert_types.length > 0 && (
                      <div className="ui-meta" style={{ marginTop: 6 }}>Certs (listed by the escort, not checked by us): {e.cert_types.join(", ")}</div>
                    )}
                    {e.avgRating && (
                      <div className="ui-meta" style={{ marginTop: 6, color: '#ffc46b', fontWeight: 600 }}>&#9733; {e.avgRating} ({e.reviewCount})</div>
                    )}
                    {cleanEquipment(e.equipment).length > 0 && (
                      <div className="ui-meta" style={{ marginTop: 6 }}>Rig (listed by the escort, not checked by us): {cleanEquipment(e.equipment).slice(0, 5).map(equipmentShort).join(", ")}{cleanEquipment(e.equipment).length > 5 ? ` +${cleanEquipment(e.equipment).length - 5}` : ""}</div>
                    )}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                      {Number(e.total_jobs) > 0 && <span className="ui-badge dim">{e.total_jobs} job{Number(e.total_jobs) === 1 ? '' : 's'} on OEH</span>}
                      {worked[e.id] > 0 && <span className="ui-badge green">Worked with you {worked[e.id]}x</span>}
                      {regulars.has(e.id) && <span className="ui-badge amber">&#9733; Your regular</span>}
                    </div>
                  </div>
                  {canStar && <RegularButton escortId={e.id} on={regulars.has(e.id)} compact onChange={(on) => setRegulars(prev => { const n = new Set(prev); if (on) n.add(e.id); else n.delete(e.id); return n })} />}
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
