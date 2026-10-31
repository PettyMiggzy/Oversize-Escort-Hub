'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createOrb, type Orb, type OrbState } from '@/components/wraith/orb'
import { isNativeApp } from '@/lib/native'
import './wraith.css'

type Turn = { role: 'user' | 'assistant'; content: string }
type Link = { label: string; href: string }
/* eslint-disable @typescript-eslint/no-explicit-any */
type SR = any

const LABEL: Record<OrbState, [string, string]> = {
  idle: ['Ready', 'System standing by'],
  listening: ['Listening', 'Microphone open'],
  thinking: ['Thinking', 'Checking your OEH data'],
  speaking: ['Speaking', 'Voice response'],
}

export default function WraithClient({ paid: paidProp, freeLeft: freeProp, priceText, canSubscribe, justSubscribed }: { paid: boolean; freeLeft: number | null; priceText: string | null; canSubscribe: boolean; justSubscribed: boolean }) {
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
  const [line, setLine] = useState('Standing by. Tap talk and ask about loads, bids or documents.')
  const [links, setLinks] = useState<Link[]>([])
  const [ice, setIce] = useState(false)
  const [talking, setTalking] = useState(false)
  const [note, setNote] = useState('')
  const [showTyped, setShowTyped] = useState(false)
  const [text, setText] = useState('')
  const [paid, setPaid] = useState(paidProp)
  const [freeLeft, setFreeLeft] = useState<number | null>(freeProp)
  const [inApp, setInApp] = useState(false)
  const [planBusy, setPlanBusy] = useState(false)

  const setState = useCallback((s: OrbState) => { stateRef.current = s; setStateRaw(s); orbRef.current?.setState(s) }, [])

  useEffect(() => {
    const orb = createOrb(canvasRef.current!, stageRef.current!)
    orbRef.current = orb
    const onResize = () => orb.resize()
    window.addEventListener('resize', onResize)
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(onResize) : null
    ro?.observe(stageRef.current!)
    setInApp(isNativeApp())
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
      u.rate = 0.96; u.pitch = 0.95
      const english = synth.getVoices().filter((x) => /^en[-_]/i.test(x.lang))
      const score = (x: SpeechSynthesisVoice) => (/^en[-_]gb/i.test(x.lang) ? 5 : 0) + (/natural|neural|premium|enhanced|online/i.test(x.name) ? 6 : 0) + (x.default ? 1 : 0)
      const v = english.sort((a, b) => score(b) - score(a))[0]
      if (v) { u.voice = v; u.lang = v.lang }
      const end = () => { askingRef.current = false; listenAgain() }
      u.onboundary = (e: SpeechSynthesisEvent) => {
        const word = (reply.slice(e.charIndex || 0).match(/^[^\s,.;!?]+/) || [''])[0]
        const syl = Math.max(1, (word.toLowerCase().match(/[aeiouy]+/g) || []).length)
        orbRef.current?.setActivity(Math.min(0.98, 0.28 + syl * 0.17), 0.26)
      }
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
      if (typeof d.paid === 'boolean') setPaid(d.paid)
      if ('freeLeft' in d) setFreeLeft(typeof d.freeLeft === 'number' ? d.freeLeft : null)
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
        orbRef.current?.setActivity(Math.min(0.95, 0.2 + t.trim().length * 0.045), 0.3)
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

  useEffect(() => {
    if (!justSubscribed || paidProp) return
    let tries = 0
    const t = setInterval(async () => {
      tries++
      try {
        const d = await fetch('/api/wraith').then((r) => r.json())
        if (d.paid) { setPaid(true); setFreeLeft(null); setLine('Wraith Pro is on. Ask me anything.'); clearInterval(t) }
      } catch { /* try again */ }
      if (tries >= 10) clearInterval(t)
    }, 3000)
    return () => clearInterval(t)
  }, [justSubscribed, paidProp])

  async function planAction(kind: 'checkout' | 'portal') {
    setPlanBusy(true)
    try {
      const res = await fetch(`/api/wraith/${kind}`, { method: 'POST' })
      const d = await res.json().catch(() => ({}))
      if (res.ok && typeof d.url === 'string') { window.location.href = d.url; return }
      setNote(typeof d.error === 'string' ? d.error : 'Something went wrong. Try again.')
    } catch { setNote('Something went wrong. Try again.') }
    setPlanBusy(false)
  }

  const sendTyped = () => { const v = text.trim(); if (!v) return; setText(''); ask(v) }

  return (
    <div ref={stageRef} className={`wr-stage${ice ? ' ice' : ''}`}>
      <canvas ref={canvasRef} className="wr-orb" aria-label="Animated Wraith voice assistant orb" />
      <div className="wr-vignette" aria-hidden="true" />
      <header className="wr-top">
        <a href="/dashboard" className="wr-brand" aria-label="Back to OEH">
          <div className="wr-mark" aria-hidden="true" />
          <div><div className="wr-brandname">WRAITH</div><div className="wr-sub">Voice console</div></div>
        </a>
        <div className="wr-actions">
          <div className="wr-tag"><span className="wr-dot" /><span>Read only</span></div>
          <button type="button" className="wr-theme" aria-label={ice ? 'Switch to ember orange theme' : 'Switch to ice blue theme'} onClick={() => { const n = !ice; setIce(n); orbRef.current?.setTheme(n ? 'ice' : 'orange') }}>
            <span className="wr-symbol">&#9672;</span><span>{ice ? 'Ember' : 'Ice blue'}</span>
          </button>
        </div>
      </header>
      <div className="wr-micro">Your own OEH data only</div>
      <section className="wr-dock" aria-label="Wraith assistant controls">
        <div className={`wr-card${state !== 'idle' ? ' active' : ''}`}>
          <div className="wr-statusrow">
            <div className="wr-cluster">
              <span className={`wr-light${state === 'listening' ? ' pulse' : ''}`} />
              <span className="wr-word">{LABEL[state][0]}</span>
              <span className="wr-note">{LABEL[state][1]}</span>
            </div>
          </div>
          <div className="wr-reply" aria-live="polite">{line}</div>
          {links.length > 0 && <div className="wr-links">{links.map((l) => <a key={l.href} className="wr-link" href={l.href}>{l.label}</a>)}</div>}
        </div>
        {showTyped && (
          <form className="wr-input" onSubmit={(e) => { e.preventDefault(); sendTyped() }} autoComplete="off">
            <input className="wr-query" value={text} onChange={(e) => setText(e.target.value)} maxLength={500} placeholder="Ask about loads, bids or documents" aria-label="Type a message for Wraith" enterKeyHint="send" />
            <button type="submit" className="wr-send">Send</button>
          </form>
        )}
        <div className="wr-controls">
          <button type="button" className="wr-voice" aria-pressed={talking} onClick={() => (talking ? stopSession() : startSession())}>
            <span className="wr-mic" aria-hidden="true" /><span>{talking ? 'Stop' : 'Talk to Wraith'}</span>
          </button>
          {!showTyped && <button type="button" className="wr-alt" onClick={() => setShowTyped(true)}>Type</button>}
        </div>
        <div className="wr-plan">
          {paid ? (
            <>
              <span>Wraith Pro</span>
              {!inApp && <button type="button" className="wr-plan-btn" disabled={planBusy} onClick={() => planAction('portal')}>Manage</button>}
            </>
          ) : (
            <>
              <span>{freeLeft === null ? 'Free taste' : freeLeft > 0 ? `${freeLeft} free question${freeLeft === 1 ? '' : 's'} left today` : 'No free questions left today'}</span>
              {!inApp && canSubscribe && <button type="button" className="wr-plan-btn go" disabled={planBusy} onClick={() => planAction('checkout')}>{priceText ? `Get Wraith Pro, ${priceText}` : 'Get Wraith Pro'}</button>}
            </>
          )}
        </div>
        <div className="wr-foot"><i /><span>{note || (justSubscribed && !paid ? 'Payment received. Switching Wraith Pro on...' : 'Tap talk, then speak')}</span><i /></div>
      </section>
    </div>
  )
}
