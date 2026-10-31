'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createOrb, type Orb, type OrbState } from '@/components/wraith/orb'
import './wraith.css'

type Turn = { role: 'user' | 'assistant'; content: string }
type Link = { label: string; href: string }
/* eslint-disable @typescript-eslint/no-explicit-any */
type SR = any

const LABEL: Record<OrbState, string> = { idle: 'ready', listening: 'listening', thinking: 'thinking', speaking: 'speaking' }

export default function WraithClient() {
  const stageRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const orbRef = useRef<Orb | null>(null)
  const recRef = useRef<SR>(null)
  const sessionRef = useRef(false)
  const stateRef = useRef<OrbState>('idle')
  const turnsRef = useRef<Turn[]>([])
  const silenceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const askingRef = useRef(false)

  const [state, setStateRaw] = useState<OrbState>('idle')
  const [line, setLine] = useState('Tap talk and ask.')
  const [links, setLinks] = useState<Link[]>([])
  const [ice, setIce] = useState(false)
  const [talking, setTalking] = useState(false)
  const [note, setNote] = useState('')
  const [showTyped, setShowTyped] = useState(false)
  const [text, setText] = useState('')

  const setState = useCallback((s: OrbState) => { stateRef.current = s; setStateRaw(s); orbRef.current?.setState(s) }, [])

  useEffect(() => {
    const orb = createOrb(canvasRef.current!, stageRef.current!)
    orbRef.current = orb
    const onResize = () => orb.resize()
    window.addEventListener('resize', onResize)
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(onResize) : null
    ro?.observe(stageRef.current!)
    const w = window as any
    if (!(w.SpeechRecognition || w.webkitSpeechRecognition)) { setShowTyped(true); setNote('Voice listening is not available here. Type instead.') }
    return () => {
      window.removeEventListener('resize', onResize); ro?.disconnect()
      sessionRef.current = false
      try { recRef.current?.stop() } catch { /* already stopped */ }
      try { window.speechSynthesis?.cancel() } catch { /* none */ }
      if (silenceRef.current) clearTimeout(silenceRef.current)
      orb.dispose(); orbRef.current = null
    }
  }, [])

  const stopSession = useCallback(() => {
    sessionRef.current = false; setTalking(false)
    try { recRef.current?.stop() } catch { /* already stopped */ }
    if (silenceRef.current) clearTimeout(silenceRef.current)
    setState('idle'); setNote('')
  }, [setState])

  const armSilence = useCallback(() => {
    if (silenceRef.current) clearTimeout(silenceRef.current)
    silenceRef.current = setTimeout(() => { if (stateRef.current === 'listening') stopSession() }, 10000)
  }, [stopSession])

  const listenAgain = useCallback(() => {
    if (!sessionRef.current || !recRef.current) { setState('idle'); return }
    setState('listening'); setLine('Listening...'); armSilence()
    try { recRef.current.start() } catch { /* already running */ }
  }, [armSilence, setState])

  const speak = useCallback((reply: string) => {
    const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined
    if (!synth) { askingRef.current = false; listenAgain(); return }
    try {
      const u = new SpeechSynthesisUtterance(reply)
      u.rate = 1.02; u.pitch = 0.98
      const v = synth.getVoices().find((x) => /^en[-_]/i.test(x.lang))
      if (v) u.voice = v
      const end = () => { askingRef.current = false; listenAgain() }
      u.onend = end; u.onerror = end
      synth.speak(u)
    } catch { askingRef.current = false; listenAgain() }
  }, [listenAgain])

  const ask = useCallback(async (question: string) => {
    if (askingRef.current) return
    askingRef.current = true
    setLine(question); setLinks([]); setState('thinking')
    const messages = [...turnsRef.current.slice(-6), { role: 'user' as const, content: question }]
    let reply = "I couldn't answer just now. Try again in a minute.", got: Link[] = []
    try {
      const res = await fetch('/api/wraith', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages }) })
      if (res.status === 401) { window.location.href = '/signin?redirect=/wraith'; return }
      const d = await res.json().catch(() => ({}))
      if (res.status === 404) reply = 'Wraith is not switched on yet.'
      else if (typeof d.reply === 'string' && d.reply) { reply = d.reply; got = Array.isArray(d.links) ? d.links.filter((l: Link) => typeof l?.href === 'string' && l.href.startsWith('/')) : [] }
      else if (typeof d.error === 'string') reply = d.error
    } catch { /* network: keep the default reply */ }
    turnsRef.current = [...messages, { role: 'assistant' as const, content: reply }].slice(-8)
    setLine(reply); setLinks(got); setState('speaking'); speak(reply)
  }, [setState, speak])

  const startSession = useCallback(() => {
    const w = window as any
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition
    if (!Ctor) { setShowTyped(true); setNote('Voice listening is not available here. Type instead.'); return }
    if (!recRef.current) {
      const rec = new Ctor()
      rec.lang = 'en-US'; rec.continuous = true; rec.interimResults = true
      rec.onresult = (ev: any) => {
        armSilence()
        let t = ''
        for (let i = ev.resultIndex; i < ev.results.length; i++) t += ev.results[i][0].transcript
        const at = t.toLowerCase().indexOf('hey wraith')
        if (at !== -1) t = t.slice(at + 10)
        const last = ev.results[ev.results.length - 1]
        if (last.isFinal && t.trim()) { try { rec.stop() } catch { /* ok */ } ask(t.trim()) }
        else if (!askingRef.current) setLine(t.trim() || 'Listening...')
      }
      rec.onerror = (ev: any) => {
        if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed') { stopSession(); setShowTyped(true); setNote('Microphone blocked. Type instead.') }
      }
      rec.onend = () => { if (sessionRef.current && !askingRef.current && (stateRef.current === 'listening' || stateRef.current === 'idle')) { try { rec.start() } catch { /* ok */ } } }
      recRef.current = rec
    }
    sessionRef.current = true; setTalking(true); setNote('Speak your command.')
    setState('listening'); setLine('Listening...'); armSilence()
    try { recRef.current.start() } catch { /* already running */ }
  }, [armSilence, ask, setState, stopSession])

  const sendTyped = () => { const v = text.trim(); if (!v) return; setText(''); ask(v) }

  return (
    <div ref={stageRef} className={`wr-stage${ice ? ' ice' : ''}`}>
      <canvas ref={canvasRef} />
      <div className="wr-scrim" />
      <div className="wr-top"><a href="/dashboard">&larr; OEH</a></div>
      <div className="wr-hud">
        <div className="wr-wake">wraith</div>
        <div className="wr-status">{LABEL[state]}</div>
        <div className="wr-line" aria-live="polite">{line}</div>
        {links.length > 0 && <div className="wr-links">{links.map((l) => <a key={l.href} className="wr-link" href={l.href}>{l.label}</a>)}</div>}
        <div className="wr-row">
          <button type="button" className={`wr-pill${talking ? ' on' : ''}`} onClick={() => (talking ? stopSession() : startSession())}>{talking ? 'stop' : 'talk'}</button>
          <button type="button" className="wr-pill" onClick={() => { const n = !ice; setIce(n); orbRef.current?.setTheme(n ? 'ice' : 'orange') }}>{ice ? 'orange' : 'ice'}</button>
          {!showTyped && <button type="button" className="wr-pill" onClick={() => setShowTyped(true)}>type</button>}
        </div>
        {showTyped && (
          <div className="wr-typed">
            <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') sendTyped() }} placeholder="ask Wraith" autoComplete="off" enterKeyHint="send" />
            <button type="button" onClick={sendTyped}>send</button>
          </div>
        )}
        <div className="wr-note">{note}</div>
      </div>
    </div>
  )
}
