"use client"
import SiteHeader from '@/components/SiteHeader';
import PageTitle from '@/components/PageTitle'
import EmptyState from '@/components/EmptyState'
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA",
  "HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"
]
const CA_PROVINCES = ["BC","AB","ON","SK","MB"]
const ALL_ZONES = [...US_STATES, ...CA_PROVINCES]

export default function AvailabilityPage() {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [userId, setUserId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadZones()
  }, [])

  async function loadZones() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    setUserId(user.id)

    const { data } = await supabase
      .from("escort_availability")
      .select("location_state")
      .eq("escort_id", user.id)

    if (data) setSelected(new Set(data.map((r: any) => r.location_state)))
    setLoading(false)
  }

  function toggle(zone: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(zone)) next.delete(zone)
      else next.add(zone)
      return next
    })
    setSaved(false)
  }

  async function save() {
    if (!userId) return
    setSaving(true)
    const states = Array.from(selected)
    // Delete all existing zones
    await supabase.from("escort_availability").delete().eq("escort_id", userId)
    // Insert selected zones
    if (states.length > 0) {
      const rows = states.map(state => ({ escort_id: userId, location_state: state }))
      await supabase.from("escort_availability").insert(rows)
    }
    // Keep profiles.availability_states in sync (Member push broadcast reads it)
    await supabase.from("profiles").update({ availability_states: states }).eq("id", userId)
    setSaving(false)
    setSaved(true)
  }

  if (loading) return (<><SiteHeader /><div className="ui-page"><div className="ui-wrap"><p className="ui-meta">Loading...</p></div></div></>)
  if (!userId) return (
    <>
      <SiteHeader />
      <div className="ui-page">
        <div className="ui-wrap">
          <EmptyState title="Sign in to set your zones" text="Please sign in to manage your availability zones." action={<a href="/signin?redirect=/available" className="ui-btn">Sign in</a>} />
        </div>
      </div>
    </>
  )

  return (
      <>
      <SiteHeader />
    <div className="ui-page">
      <div className="ui-wrap">
        <PageTitle eyebrow="Account" title="Availability zones" lead="Select the states and provinces you cover. Click a zone to toggle it on or off." />
        <p className="ui-meta" style={{ marginBottom: 16 }}>{selected.size} zone{selected.size !== 1 ? "s" : ""} selected</p>

        <div className="ui-label">United States</div>
        <div className="ui-chips" style={{ marginBottom: 24 }}>
          {US_STATES.map(s => (
            <button type="button" key={s} className={selected.has(s) ? 'ui-chip on' : 'ui-chip'} onClick={() => toggle(s)}>{s}</button>
          ))}
        </div>

        <div className="ui-label">Canada</div>
        <div className="ui-chips" style={{ marginBottom: 24 }}>
          {CA_PROVINCES.map(p => (
            <button type="button" key={p} className={selected.has(p) ? 'ui-chip on' : 'ui-chip'} onClick={() => toggle(p)}>{p}</button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <button className={saving ? 'ui-btn dim' : 'ui-btn'} onClick={save} disabled={saving}>
            {saving ? "Saving..." : "Save Zones"}
          </button>
          {saved && <span className="ui-ok" style={{ margin: 0 }}>✓ Saved!</span>}
        </div>
      </div>
    </div>
      </>
  )
}
