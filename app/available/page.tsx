"use client"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

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
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setLoading(false); return }
    setUserId(session.user.id)

    const { data } = await supabase
      .from("escort_availability")
      .select("state")
      .eq("escort_id", session.user.id)

    if (data) setSelected(new Set(data.map((r: any) => r.state)))
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
    // Delete all existing zones
    await supabase.from("escort_availability").delete().eq("escort_id", userId)
    // Insert selected zones
    if (selected.size > 0) {
      const rows = Array.from(selected).map(state => ({ escort_id: userId, state }))
      await supabase.from("escort_availability").insert(rows)
    }
    setSaving(false)
    setSaved(true)
  }

  const S = {
    page: { minHeight: "100vh", background: "#060b16", color: "#e5e7eb", fontFamily: "system-ui,sans-serif" },
    header: { padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between" },
    brand: { fontWeight: 900, color: "#f0a500", textDecoration: "none", fontSize: 18 },
    wrap: { maxWidth: 860, margin: "0 auto", padding: "40px 24px" },
    h1: { fontSize: 28, fontWeight: 800, marginBottom: 8 },
    sub: { color: "#9ca3af", marginBottom: 32, fontSize: 15 },
    sectionTitle: { fontSize: 13, fontWeight: 700, color: "#f0a500", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 12 },
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(64px,1fr))", gap: 8, marginBottom: 32 },
    zone: (active: boolean) => ({
      background: active ? "#f0a500" : "rgba(255,255,255,0.04)",
      color: active ? "#000" : "#e5e7eb",
      border: active ? "1px solid #f0a500" : "1px solid rgba(255,255,255,0.10)",
      borderRadius: 8, padding: "8px 4px", textAlign: "center" as const,
      fontWeight: active ? 700 : 400, fontSize: 13, cursor: "pointer",
      transition: "all 0.15s"
    }),
    btn: { background: "#f0a500", color: "#000", fontWeight: 700, border: "none", borderRadius: 10, padding: "12px 28px", cursor: "pointer", fontSize: 15 },
    count: { color: "#9ca3af", fontSize: 14, marginBottom: 16 },
    saved: { color: "#22c55e", fontSize: 14, marginLeft: 12 },
  }

  if (loading) return <div style={S.page}><div style={{ padding: 40, color: "#9ca3af" }}>Loading...</div></div>
  if (!userId) return <div style={S.page}><div style={{ padding: 40, color: "#ef4444" }}>Please sign in to manage your availability zones.</div></div>

  return (
    <div style={S.page}>
      <header style={S.header}>
        <a href="/" style={S.brand}>OVERSIZE ESCORT HUB</a>
      </header>
      <div style={S.wrap}>
        <h1 style={S.h1}>Availability Zones</h1>
        <p style={S.sub}>Select the states and provinces you cover. Click a zone to toggle it on/off.</p>
        <p style={S.count}>{selected.size} zone{selected.size !== 1 ? "s" : ""} selected</p>

        <div style={S.sectionTitle}>United States</div>
        <div style={S.grid}>
          {US_STATES.map(s => (
            <div key={s} style={S.zone(selected.has(s))} onClick={() => toggle(s)}>{s}</div>
          ))}
        </div>

        <div style={S.sectionTitle}>Canada</div>
        <div style={{ ...S.grid, gridTemplateColumns: "repeat(auto-fill,minmax(64px,1fr))", maxWidth: 400 }}>
          {CA_PROVINCES.map(p => (
            <div key={p} style={S.zone(selected.has(p))} onClick={() => toggle(p)}>{p}</div>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", marginTop: 8 }}>
          <button style={S.btn} onClick={save} disabled={saving}>
            {saving ? "Saving..." : "Save Zones"}
          </button>
          {saved && <span style={S.saved}>✓ Saved!</span>}
        </div>
      </div>
    </div>
  )
}
