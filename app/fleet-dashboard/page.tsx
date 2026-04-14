"use client"
import { useEffect, useState, useRef } from "react"
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

const TABS = ["My Roster", "Find Loads", "Fleet Deadhead", "Active Matches", "SMS Dispatch"] as const
type Tab = typeof TABS[number]

export default function FleetDashboardPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [profile, setProfile] = useState<any>(null)
    const [escorts, setEscorts] = useState<FleetEscort[]>([])
    const [tab, setTab] = useState<Tab>("My Roster")
    const [newName, setNewName] = useState("")
    const [newPhone, setNewPhone] = useState("")
    const [newState, setNewState] = useState("")
    const [newLocation, setNewLocation] = useState("")
    const [smsTarget, setSmsTarget] = useState("")
    const [smsMsg, setSmsMsg] = useState("")
    const [smsSent, setSmsSent] = useState(false)
    const [addErr, setAddErr] = useState("")

  useEffect(() => {
        async function load() {
                const { data: { session } } = await supabase.auth.getSession()
                if (!session) { router.push("/signin"); return }
                const { data: prof } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()
                if (!prof || prof.tier !== "fleet_manager_pro") { router.push("/pricing"); return }
                setProfile(prof)
                const { data: list } = await supabase.from("fleet_escorts").select("*").eq("fleet_manager_id", session.user.id)
                setEscorts(list || [])
                setLoading(false)
        }
        load()
  }, [])

  async function addEscort() {
        setAddErr("")
        if (!newName.trim()) { setAddErr("Name is required"); return }
        if (escorts.length >= 5) { setAddErr("Max 5 escorts per account"); return }
        const { data: { session } } = await supabase.auth.getSession()
        const { data, error } = await supabase.from("fleet_escorts").insert({
                fleet_manager_id: session?.user?.id,
                name: newName.trim(),
                phone: newPhone.trim(),
                state: newState.trim(),
                location: newLocation.trim(),
                available: true,
        }).select().single()
        if (error) { setAddErr(error.message); return }
        setEscorts(prev => [...prev, data])
        setNewName(""); setNewPhone(""); setNewState(""); setNewLocation("")
  }

  async function removeEscort(id: string) {
        await supabase.from("fleet_escorts").delete().eq("id", id)
        setEscorts(prev => prev.filter(e => e.id !== id))
  }

  async function toggleAvailable(e: FleetEscort) {
        await supabase.from("fleet_escorts").update({ available: !e.available }).eq("id", e.id)
        setEscorts(prev => prev.map(x => x.id === e.id ? { ...x, available: !e.available } : x))
  }

  async function sendSms() {
        if (!smsTarget || !smsMsg) return
        try {
                await fetch("https://api.textrequest.com/api/messages", {
                          method: "POST",
                          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.NEXT_PUBLIC_TEXTREQUEST_KEY}` },
                          body: JSON.stringify({ to: smsTarget, message: smsMsg }),
                })
                setSmsSent(true)
        } catch { setSmsSent(false) }
  }

  if (loading) return <div style={{ color: "#fff", padding: 40, textAlign: "center" }}>Loading...</div>div>

      const s = { color: "#fff", fontFamily: "sans-serif", background: "#0a0a0a", minHeight: "100vh", padding: 24 }
    const card = { background: "#111", border: "1px solid #222", borderRadius: 10, padding: 20, marginBottom: 16 }
    const btn = (color = "#ff6600") => ({ background: color, color: "#fff", border: "none", borderRadius: 6, padding: "8px 16px", cursor: "pointer", fontWeight: 700, fontSize: 13 })
    const inp = { background: "#1a1a1a", border: "1px solid #333", borderRadius: 6, padding: "8px 12px", color: "#fff", fontSize: 13, width: "100%" }

  return (
        <div style={s}>
                <div style={{ maxWidth: 1000, margin: "0 auto" }}>
                          <div style={{ marginBottom: 24 }}>
                                      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Fleet Manager Pro</h1>h1>
                                      <p style={{ color: "#9ca3af", fontSize: 13 }}>Manage your escort roster and dispatch loads.</p>p>
                          </div>div>

          {/* Stats */}
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 24 }}>
                            {[
          { label: "Total Escorts", value: escorts.length },
          { label: "Active Escorts", value: escorts.filter(e => e.available).length },
          { label: "States Covered", value: [...new Set(escorts.map(e => e.state).filter(Boolean))].length },
                    ].map(stat => (
                                  <div key={stat.label} style={{ ...card, textAlign: "center" }}>
                                                  <div style={{ fontSize: 28, fontWeight: 800, color: "#ff6600" }}>{stat.value}</div>div>
                                                  <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>{stat.label}</div>div>
                                  </div>div>
                                ))}
                          </div>div>

                  {/* Tabs */}
                          <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
                            {TABS.map(t => (
                      <button key={t} onClick={() => setTab(t)} style={{ ...btn(tab === t ? "#ff6600" : "#1a1a1a"), border: tab === t ? "none" : "1px solid #333" }}>
                        {t}
                      </button>button>
                    ))}
                          </div>div>

                  {/* My Roster Tab */}
                  {tab === "My Roster" && (
                    <div>
                                <div style={card}>
                                              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Add Escort {escorts.length >= 5 && <span style={{ color: "#ef4444", fontSize: 12 }}>(Max reached)</span>span>}</h2>h2>
                                              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginBottom: 12 }}>
                                                              <input style={inp} placeholder="Name *" value={newName} onChange={e => setNewName(e.target.value)} />
                                                              <input style={inp} placeholder="Phone" value={newPhone} onChange={e => setNewPhone(e.target.value)} />
                                                              <input style={inp} placeholder="State (e.g. TX)" value={newState} onChange={e => setNewState(e.target.value)} />
                                                              <input style={inp} placeholder="Location / City" value={newLocation} onChange={e => setNewLocation(e.target.value)} />
                                              </div>div>
                                  {addErr && <p style={{ color: "#ef4444", fontSize: 12, marginBottom: 8 }}>{addErr}</p>p>}
                                              <button onClick={addEscort} disabled={escorts.length >= 5} style={btn()}>Add to Roster</button>button>
                                </div>div>
                      {escorts.length === 0 ? (
                                    <div style={{ ...card, textAlign: "center", color: "#9ca3af" }}>No escorts yet. Add up to 5.</div>div>
                                  ) : (
                                    <div style={card}>
                                                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                                                                      <thead>
                                                                                          <tr style={{ borderBottom: "1px solid #333" }}>
                                                                                            {["Name", "Phone", "State", "Location", "Available", "Actions"].map(h => (
                                                              <th key={h} style={{ textAlign: "left", padding: "8px 12px", color: "#9ca3af", fontWeight: 600 }}>{h}</th>th>
                                                            ))}
                                                                                            </tr>tr>
                                                                      </thead>thead>
                                                                      <tbody>
                                                                        {escorts.map(e => (
                                                            <tr key={e.id} style={{ borderBottom: "1px solid #1a1a1a" }}>
                                                                                    <td style={{ padding: "10px 12px", fontWeight: 600 }}>{e.name}</td>td>
                                                                                    <td style={{ padding: "10px 12px", color: "#9ca3af" }}>{e.phone || "-"}</td>td>
                                                                                    <td style={{ padding: "10px 12px" }}>{e.state || "-"}</td>td>
                                                                                    <td style={{ padding: "10px 12px", color: "#9ca3af" }}>{e.location || "-"}</td>td>
                                                                                    <td style={{ padding: "10px 12px" }}>
                                                                                                              <button onClick={() => toggleAvailable(e)} style={{ ...btn(e.available ? "#22c55e" : "#555"), padding: "4px 10px", fontSize: 11 }}>
                                                                                                                {e.available ? "Active" : "Inactive"}
                                                                                                                </button>button>
                                                                                      </td>td>
                                                                                    <td style={{ padding: "10px 12px" }}>
                                                                                                              <button onClick={() => removeEscort(e.id)} style={{ ...btn("#ef4444"), padding: "4px 10px", fontSize: 11 }}>Remove</button>button>
                                                                                      </td>td>
                                                            </tr>tr>
                                                          ))}
                                                                      </tbody>tbody>
                                                    </table>table>
                                    </div>div>
                                )}
                    </div>div>
                        )}
                
                  {/* Find Loads Tab */}
                  {tab === "Find Loads" && (
                    <div style={card}>
                                <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Load Board</h2>h2>
                                <p style={{ color: "#9ca3af", fontSize: 13 }}>Loads filtered to states where your escorts are active: <strong>{[...new Set(escorts.filter(e => e.available).map(e => e.state).filter(Boolean))].join(", ") || "None"}</strong>strong></p>p>
                                <div style={{ marginTop: 16, padding: 20, background: "#1a1a1a", borderRadius: 8, textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
                                              Load board integration renders here — filtered by escort states.
                                </div>div>
                    </div>div>
                        )}
                
                  {/* Fleet Deadhead Tab */}
                  {tab === "Fleet Deadhead" && (
                    <div style={card}>
                                <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Fleet Deadhead Minimizer</h2>h2>
                                <p style={{ color: "#9ca3af", fontSize: 13, marginBottom: 16 }}>Finds nearest open load to each active roster escort simultaneously.</p>p>
                      {escorts.filter(e => e.available).length === 0 ? (
                                    <div style={{ color: "#9ca3af", textAlign: "center", padding: 20 }}>No active escorts. Mark escorts as Active in My Roster.</div>div>
                                  ) : (
                                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                      {escorts.filter(e => e.available).map(e => (
                                                        <div key={e.id} style={{ background: "#1a1a1a", borderRadius: 8, padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                                            <div>
                                                                                                  <div style={{ fontWeight: 700 }}>{e.name}</div>div>
                                                                                                  <div style={{ color: "#9ca3af", fontSize: 12 }}>{e.location || e.state || "Location unknown"}</div>div>
                                                                            </div>div>
                                                                            <div style={{ color: "#9ca3af", fontSize: 12 }}>Searching nearby loads...</div>div>
                                                        </div>div>
                                                      ))}
                                    </div>div>
                                )}
                    </div>div>
                        )}
                
                  {/* Active Matches Tab */}
                  {tab === "Active Matches" && (
                    <div style={card}>
                                <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Active Matches</h2>h2>
                                <div style={{ color: "#9ca3af", fontSize: 13, padding: 20, textAlign: "center" }}>
                                              Loads currently matched to your roster escorts will appear here.
                                </div>div>
                    </div>div>
                        )}
                
                  {/* SMS Dispatch Tab */}
                  {tab === "SMS Dispatch" && (
                    <div style={card}>
                                <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>SMS Dispatch</h2>h2>
                                <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 480 }}>
                                              <div>
                                                              <label style={{ fontSize: 12, color: "#9ca3af", marginBottom: 4, display: "block" }}>Send to escort</label>label>
                                                              <select value={smsTarget} onChange={e => setSmsTarget(e.target.value)} style={{ ...inp }}>
                                                                                <option value="">Select escort...</option>option>
                                                                {escorts.map(e => <option key={e.id} value={e.phone}>{e.name} ({e.phone || "no phone"})</option>option>)}
                                                              </select>select>
                                              </div>div>
                                              <div>
                                                              <label style={{ fontSize: 12, color: "#9ca3af", marginBottom: 4, display: "block" }}>Message</label>label>
                                                              <textarea value={smsMsg} onChange={e => setSmsMsg(e.target.value)} rows={4} style={{ ...inp, resize: "vertical" }} placeholder="Load details, pickup location, etc." />
                                              </div>div>
                                              <button onClick={sendSms} style={btn()}>Send SMS via TextRequest</button>button>
                                  {smsSent && <p style={{ color: "#22c55e", fontSize: 13 }}>SMS sent successfully.</p>p>}
                                </div>div>
                    </div>div>
                        )}
                </div>div>
        </div>div>
      )
}</div>
