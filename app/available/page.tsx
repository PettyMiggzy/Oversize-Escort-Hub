"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

const US_STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"]

type Availability = {
  id: string
  escort_id: string
  state: string
  available_from: string
  available_to: string
  notes: string
  profiles: { full_name: string; tier: string }
}

export default function AvailabilityBoardPage() {
  const [entries, setEntries] = useState<Availability[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [filterState, setFilterState] = useState("")
  const [form, setForm] = useState({ state: "", from: "", to: "", notes: "" })
  const [posting, setPosting] = useState(false)
  const [posted, setPosted] = useState(false)

  useEffect(() => { loadBoard(); getProfile() }, [])

  async function loadBoard() {
    const { data } = await supabase
      .from("escort_availability")
      .select("*, profiles(full_name, tier)")
      .gte("available_to", new Date().toISOString().split("T")[0])
      .order("available_from", { ascending: true })
    setEntries(data || [])
  }

  async function getProfile() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const { data } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()
    setProfile(data)
  }

  async function postAvailability() {
    if (!form.state || !form.from || !form.to) return
    setPosting(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setPosting(false); return }
    await supabase.from("escort_availability").insert({
      escort_id: session.user.id,
      state: form.state,
      available_from: form.from,
      available_to: form.to,
      notes: form.notes,
    })
    setPosted(true); setPosting(false)
    setForm({ state: "", from: "", to: "", notes: "" })
    loadBoard()
  }

  async function sendLoadAlert(escortId: string) {
    const msg = prompt("Enter load details to SMS this escort:")
    if (!msg) return
    const { data } = await supabase.from("profiles").select("phone").eq("id", escortId).single()
    if (!data?.phone) { alert("No phone on file."); return }
    await fetch("/api/sms-alert", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone: data.phone, message: msg }) })
    alert("Load alert sent!")
  }

  const filtered = filterState ? entries.filter(e => e.state === filterState) : entries
  const byState: Record<string, Availability[]> = {}
  filtered.forEach(e => { if (!byState[e.state]) byState[e.state] = []; byState[e.state].push(e) })

  const card = { background: "#111", border: "1px solid #222", borderRadius: 10, padding: 20, marginBottom: 16 }
  const inp = { background: "#1a1a1a", border: "1px solid #333", borderRadius: 6, padding: "8px 12px", color: "#fff", fontSize: 13, width: "100%" }
  const btn = (color = "#ff6600") => ({ background: color, color: "#fff", border: "none", borderRadius: 6, padding: "8px 16px", cursor: "pointer", fontWeight: 700, fontSize: 13 })

  return (
    <div style={{ color: "#fff", fontFamily: "sans-serif", background: "#0a0a0a", minHeight: "100vh", padding: 24 }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Escort Availability Board</h1>
          <p style={{ color: "#9ca3af", fontSize: 13 }}>Pro escorts post availability. Pro carriers can send load alerts.</p>
        </div>

        {profile && ["pro", "member"].includes(profile.tier) && (
          <div style={card}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Post Your Availability</h2>
            {posted ? (
              <p style={{ color: "#22c55e" }}>Posted! Expires in 48 hours.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 10 }}>
                  <select value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} style={inp}>
                    <option value="">State *</option>
                    {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <div>
                    <label style={{ fontSize: 11, color: "#9ca3af", display: "block", marginBottom: 4 }}>From *</label>
                    <input type="date" value={form.from} onChange={e => setForm(f => ({ ...f, from: e.target.value }))} style={inp} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: "#9ca3af", display: "block", marginBottom: 4 }}>To *</label>
                    <input type="date" value={form.to} onChange={e => setForm(f => ({ ...f, to: e.target.value }))} style={inp} />
                  </div>
                </div>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} style={{ ...inp, resize: "vertical" }} placeholder="Notes (optional)" />
                <button onClick={postAvailability} disabled={posting} style={btn()}>{posting ? "Posting..." : "Post Availability"}</button>
              </div>
            )}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
          <label style={{ fontSize: 13, color: "#9ca3af" }}>Filter:</label>
          <select value={filterState} onChange={e => setFilterState(e.target.value)} style={{ ...inp, width: "auto", minWidth: 120 }}>
            <option value="">All States</option>
            {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <span style={{ fontSize: 12, color: "#9ca3af" }}>{filtered.length} escort{filtered.length !== 1 ? "s" : ""}</span>
        </div>

        {Object.keys(byState).length === 0 ? (
          <div style={{ ...card, textAlign: "center", color: "#9ca3af" }}>
            No availability posted yet{filterState ? ` in ${filterState}` : ""}. Check back soon.
          </div>
        ) : (
          Object.entries(byState).sort(([a], [b]) => a.localeCompare(b)).map(([state, list]) => (
            <div key={state} style={card}>
              <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: "#ff6600" }}>{state}</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {list.map(entry => (
                  <div key={entry.id} style={{ background: "#1a1a1a", borderRadius: 8, padding: 14, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{entry.profiles?.full_name || "Escort"}</div>
                      <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{entry.available_from} to {entry.available_to}</div>
                      {entry.notes && <div style={{ fontSize: 12, color: "#d1d5db", marginTop: 4 }}>{entry.notes}</div>}
                      <span style={{ fontSize: 10, fontWeight: 700, background: "#1e3a5f", color: "#60a5fa", padding: "2px 8px", borderRadius: 99, display: "inline-block", marginTop: 6 }}>
                        {entry.profiles?.tier?.toUpperCase() || "ESCORT"}
                      </span>
                    </div>
                    {profile && (profile.tier === "pro" || profile.role === "carrier") && (
                      <button onClick={() => sendLoadAlert(entry.escort_id)} style={btn("#3b82f6")}>Send Load Alert</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
