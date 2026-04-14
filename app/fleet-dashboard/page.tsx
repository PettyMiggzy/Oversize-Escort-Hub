"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

type FleetEscort = {
  id: string
  name: string
  phone: string
  location: string
  state: string
  available: boolean
}

type Load = {
  id: string
  title: string
  origin: string
  destination: string
  pickup_date: string
  status: string
}

const US_STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"]

export default function FleetDashboardPage() {
  const router = useRouter()
  const [tab, setTab] = useState("roster")
  const [profile, setProfile] = useState<any>(null)
  const [escorts, setEscorts] = useState<FleetEscort[]>([])
  const [loads, setLoads] = useState<Load[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [newEscort, setNewEscort] = useState({ name: "", phone: "", location: "", state: "" })
  const [smsTarget, setSmsTarget] = useState<FleetEscort | null>(null)
  const [smsMsg, setSmsMsg] = useState("")

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push("/signin"); return }
    const { data: prof } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()
    if (!prof || prof.tier !== "fleet_manager_pro") { router.push("/pricing"); return }
    setProfile(prof)
    await Promise.all([loadEscorts(session.user.id), loadLoads()])
    setLoading(false)
  }

  async function loadEscorts(userId: string) {
    const { data } = await supabase.from("fleet_escorts").select("*").eq("fleet_manager_id", userId).order("created_at")
    setEscorts(data || [])
  }

  async function loadLoads() {
    const { data } = await supabase.from("loads").select("*").eq("status", "open").order("created_at", { ascending: false }).limit(50)
    setLoads(data || [])
  }

  async function addEscort() {
    if (!newEscort.name || escorts.length >= 5) return
    const { data: { session } } = await supabase.auth.getSession()
    const { data } = await supabase.from("fleet_escorts").insert({ ...newEscort, fleet_manager_id: session?.user.id, available: true }).select().single()
    if (data) setEscorts(e => [...e, data])
    setNewEscort({ name: "", phone: "", location: "", state: "" })
    setAdding(false)
  }

  async function removeEscort(id: string) {
    await supabase.from("fleet_escorts").delete().eq("id", id)
    setEscorts(e => e.filter(x => x.id !== id))
  }

  async function toggleAvailable(escort: FleetEscort) {
    await supabase.from("fleet_escorts").update({ available: !escort.available }).eq("id", escort.id)
    setEscorts(e => e.map(x => x.id === escort.id ? { ...x, available: !x.available } : x))
  }

  async function sendSMS() {
    if (!smsTarget || !smsMsg) return
    await fetch("/api/sms-alert", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone: smsTarget.phone, message: smsMsg }) })
    alert("SMS sent to " + smsTarget.name)
    setSmsMsg("")
    setSmsTarget(null)
  }

  const escortStates = new Set(escorts.filter(e => e.available).map(e => e.state))
  const nearbyLoads = loads.filter(l => escortStates.has(l.origin?.split(",")[1]?.trim() || ""))

  const s = { color: "#fff", fontFamily: "sans-serif", background: "#0a0a0a", minHeight: "100vh", padding: 24 }
  const card = { background: "#111", border: "1px solid #222", borderRadius: 10, padding: 20, marginBottom: 16 }
  const inp = { background: "#1a1a1a", border: "1px solid #333", borderRadius: 6, padding: "8px 12px", color: "#fff", fontSize: 13, width: "100%" }
  const btn = (color = "#3b82f6") => ({ background: color, color: "#fff", border: "none", borderRadius: 6, padding: "8px 14px", cursor: "pointer", fontWeight: 700, fontSize: 13 })

  if (loading) return <div style={{ color: "#fff", padding: 40, textAlign: "center" }}>Loading...</div>

  const s2 = { color: "#fff", fontFamily: "sans-serif", background: "#0a0a0a", minHeight: "100vh", padding: 24 }
  const TABS = ["roster", "loads", "deadhead", "matches", "sms"]
  const TAB_LABELS: Record<string, string> = { roster: "My Roster", loads: "Find Loads", deadhead: "Fleet Deadhead", matches: "Active Matches", sms: "SMS Dispatch" }

  return (
    <div style={s2}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Fleet Manager Pro</h1>
          <p style={{ color: "#9ca3af", fontSize: 13 }}>Manage your escort fleet. {escorts.length}/5 escorts.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Total Escorts", value: escorts.length },
            { label: "Available", value: escorts.filter(e => e.available).length },
            { label: "Open Loads", value: loads.length },
            { label: "Nearby Loads", value: nearbyLoads.length },
          ].map(stat => (
            <div key={stat.label} style={{ background: "#111", border: "1px solid #222", borderRadius: 10, padding: 16, textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#3b82f6" }}>{stat.value}</div>
              <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ ...btn(tab === t ? "#3b82f6" : "#1a1a1a"), border: tab === t ? "none" : "1px solid #333" }}>
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>

        {tab === "roster" && (
          <div style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Escort Roster</h2>
              {escorts.length < 5 && !adding && (
                <button onClick={() => setAdding(true)} style={btn()}>+ Add Escort</button>
              )}
            </div>
            {adding && (
              <div style={{ background: "#1a1a1a", borderRadius: 8, padding: 16, marginBottom: 16 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 10, marginBottom: 10 }}>
                  <input placeholder="Name *" value={newEscort.name} onChange={e => setNewEscort(n => ({ ...n, name: e.target.value }))} style={inp} />
                  <input placeholder="Phone" value={newEscort.phone} onChange={e => setNewEscort(n => ({ ...n, phone: e.target.value }))} style={inp} />
                  <input placeholder="Location" value={newEscort.location} onChange={e => setNewEscort(n => ({ ...n, location: e.target.value }))} style={inp} />
                  <select value={newEscort.state} onChange={e => setNewEscort(n => ({ ...n, state: e.target.value }))} style={inp}>
                    <option value="">State</option>
                    {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={addEscort} style={btn()}>Save</button>
                  <button onClick={() => setAdding(false)} style={btn("#444")}>Cancel</button>
                </div>
              </div>
            )}
            {escorts.length === 0 ? (
              <p style={{ color: "#9ca3af", fontSize: 13 }}>No escorts yet. Add up to 5.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {escorts.map(escort => (
                  <div key={escort.id} style={{ background: "#1a1a1a", borderRadius: 8, padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{escort.name}</div>
                      <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{escort.phone} · {escort.location} · {escort.state}</div>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <button onClick={() => toggleAvailable(escort)} style={btn(escort.available ? "#22c55e" : "#555")}>
                        {escort.available ? "Available" : "Unavailable"}
                      </button>
                      <button onClick={() => { setSmsTarget(escort); setTab("sms") }} style={btn("#f59e0b")}>SMS</button>
                      <button onClick={() => removeEscort(escort.id)} style={btn("#ef4444")}>Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "loads" && (
          <div style={card}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Open Loads</h2>
            {loads.length === 0 ? (
              <p style={{ color: "#9ca3af", fontSize: 13 }}>No open loads.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {loads.map(load => (
                  <div key={load.id} style={{ background: "#1a1a1a", borderRadius: 8, padding: 14 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{load.title}</div>
                    <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>{load.origin} → {load.destination} · {load.pickup_date}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "deadhead" && (
          <div style={card}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Fleet Deadhead Minimizer</h2>
            <p style={{ color: "#9ca3af", fontSize: 13, marginBottom: 16 }}>Finds loads closest to each available escort simultaneously.</p>
            {escorts.filter(e => e.available).length === 0 ? (
              <p style={{ color: "#9ca3af", fontSize: 13 }}>Mark escorts as available to see nearby loads.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {escorts.filter(e => e.available).map(escort => {
                  const nearby = loads.filter(l => l.origin?.includes(escort.state))
                  return (
                    <div key={escort.id} style={{ background: "#1a1a1a", borderRadius: 8, padding: 14 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>{escort.name} — {escort.state}</div>
                      {nearby.length === 0 ? (
                        <p style={{ fontSize: 12, color: "#9ca3af" }}>No loads in {escort.state}</p>
                      ) : (
                        nearby.slice(0, 3).map(load => (
                          <div key={load.id} style={{ fontSize: 12, color: "#d1d5db", marginBottom: 4 }}>• {load.title} — {load.origin}</div>
                        ))
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {tab === "matches" && (
          <div style={card}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Active Matches</h2>
            {nearbyLoads.length === 0 ? (
              <p style={{ color: "#9ca3af", fontSize: 13 }}>No active matches. Add escorts with states to see matches.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {nearbyLoads.map(load => (
                  <div key={load.id} style={{ background: "#1a1a1a", borderRadius: 8, padding: 14 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{load.title}</div>
                    <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>{load.origin} → {load.destination}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "sms" && (
          <div style={card}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>SMS Dispatch</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <select value={smsTarget?.id || ""} onChange={e => setSmsTarget(escorts.find(x => x.id === e.target.value) || null)} style={inp}>
                <option value="">Select escort</option>
                {escorts.map(e => <option key={e.id} value={e.id}>{e.name} — {e.phone}</option>)}
              </select>
              <textarea value={smsMsg} onChange={e => setSmsMsg(e.target.value)} rows={4} style={{ ...inp, resize: "vertical" }} placeholder="Load details or message..." />
              <button onClick={sendSMS} disabled={!smsTarget || !smsMsg} style={btn()}>Send SMS</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
            }
