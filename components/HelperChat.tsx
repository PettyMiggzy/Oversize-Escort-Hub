'use client'
import { useEffect, useRef, useState } from 'react'
import { isNativeApp } from '@/lib/native'

type Turn = { role: 'user' | 'assistant'; content: string }
const KEY = 'oeh-helper-chat'
const HELLO = 'Hi, I am the OEH assistant. Ask me how the boards work, what is free, or how to get started. If I cannot help, I can pass your question to the team.'

// A small help chat on every page (not inside the phone app). Answers come from /api/helper.
export default function HelperChat() {
  const [native, setNative] = useState(true)
  const [open, setOpen] = useState(false)
  const [turns, setTurns] = useState<Turn[]>([])
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const end = useRef<HTMLDivElement>(null)

  /* eslint-disable react-hooks/set-state-in-effect -- browser-only values, read once after mount (same as HideInApp) */
  useEffect(() => {
    setNative(isNativeApp())
    try { const s = sessionStorage.getItem(KEY); if (s) setTurns(JSON.parse(s)) } catch { /* no storage */ }
  }, [])
  /* eslint-enable react-hooks/set-state-in-effect */
  useEffect(() => {
    try { sessionStorage.setItem(KEY, JSON.stringify(turns.slice(-20))) } catch { /* no storage */ }
    end.current?.scrollIntoView({ block: 'end' })
  }, [turns, open, busy])

  if (native) return null

  async function send() {
    const q = text.trim()
    if (!q || busy) return
    const next: Turn[] = [...turns, { role: 'user', content: q }]
    setTurns(next); setText(''); setBusy(true)
    try {
      const r = await fetch('/api/helper', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ messages: next.slice(-8) }) })
      const d = await r.json().catch(() => ({}))
      setTurns([...next, { role: 'assistant', content: String(d.reply || d.error || 'Something went wrong. Please try again.') }])
    } catch {
      setTurns([...next, { role: 'assistant', content: 'I could not connect. Check your signal and try again.' }])
    }
    setBusy(false)
  }

  return (
    <>
      {!open && (
        <button className="hc-fab" onClick={() => setOpen(true)} aria-label="Open the help chat">Help</button>
      )}
      {open && (
        <div className="hc-panel" role="dialog" aria-label="OEH assistant">
          <div className="hc-head">
            <div><strong>OEH assistant</strong><span>Automated. It can message the team.</span></div>
            <button onClick={() => setOpen(false)} aria-label="Close the help chat">×</button>
          </div>
          <div className="hc-body">
            <div className="hc-msg bot">{HELLO}</div>
            {turns.map((t, i) => <div key={i} className={`hc-msg ${t.role === 'user' ? 'me' : 'bot'}`}>{t.content}</div>)}
            {busy && <div className="hc-msg bot hc-dots">Thinking…</div>}
            <div ref={end} />
          </div>
          <form className="hc-form" onSubmit={(e) => { e.preventDefault(); send() }}>
            <input value={text} onChange={(e) => setText(e.target.value)} maxLength={600} placeholder="Ask a question" aria-label="Your question" />
            <button type="submit" disabled={busy || !text.trim()}>Send</button>
          </form>
        </div>
      )}
      <style>{`
.hc-fab{position:fixed;right:16px;bottom:calc(16px + env(safe-area-inset-bottom));z-index:900;min-height:48px;padding:0 22px;border:0;border-radius:999px;background:#ff6a13;color:#160800;font:700 15px 'Inter',system-ui,sans-serif;cursor:pointer;box-shadow:0 8px 28px rgba(255,106,19,.35)}
.hc-panel{position:fixed;right:16px;bottom:calc(16px + env(safe-area-inset-bottom));z-index:900;width:min(380px,calc(100vw - 32px));height:min(540px,calc(100dvh - 32px));display:flex;flex-direction:column;background:#0f1013;border:1px solid rgba(255,255,255,.14);border-radius:20px;box-shadow:0 20px 60px rgba(0,0,0,.6);overflow:hidden;font-family:'Inter',system-ui,sans-serif;color:#e8eaee}
.hc-head{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid rgba(255,255,255,.1);background:rgba(255,106,19,.08)}
.hc-head div{display:flex;flex-direction:column;gap:2px}.hc-head strong{font-size:15px;color:#fff}.hc-head span{font-size:12px;color:#9aa1ad}
.hc-head button{width:44px;height:44px;border:0;background:none;color:#e8eaee;font-size:26px;cursor:pointer}
.hc-body{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px}
.hc-msg{max-width:88%;padding:10px 14px;border-radius:16px;font-size:14.5px;line-height:1.45;white-space:pre-wrap;overflow-wrap:anywhere}
.hc-msg.bot{align-self:flex-start;background:rgba(255,255,255,.07)}.hc-msg.me{align-self:flex-end;background:#ff6a13;color:#160800}
.hc-dots{opacity:.7}
.hc-form{display:flex;gap:8px;padding:10px;border-top:1px solid rgba(255,255,255,.1)}
.hc-form input{flex:1;min-width:0;min-height:44px;padding:0 14px;border-radius:999px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.05);color:#fff;font-size:16px}
.hc-form button{min-height:44px;padding:0 18px;border:0;border-radius:999px;background:#ff6a13;color:#160800;font-weight:700;font-size:15px;cursor:pointer}
.hc-form button:disabled{opacity:.5;cursor:default}
@media (max-width:480px){.hc-panel{right:8px;left:8px;bottom:calc(8px + env(safe-area-inset-bottom));width:auto;height:min(78dvh,620px)}}
      `}</style>
    </>
  )
}
