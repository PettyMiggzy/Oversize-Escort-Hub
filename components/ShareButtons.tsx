'use client'
import { useState } from 'react'

// Copy the link, share to Facebook, or use the phone's own share sheet. Nothing here posts for anyone.
export default function ShareButtons({ url, text, compact = false }: { url: string; text: string; compact?: boolean }) {
  const [msg, setMsg] = useState('')
  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 2500) }

  async function copy(what: 'link' | 'text') {
    const value = what === 'link' ? url : `${text} ${url}`
    try { await navigator.clipboard.writeText(value); flash(what === 'link' ? 'Link copied' : 'Text and link copied') }
    catch { flash('Press and hold the link to copy it') }
  }
  async function nativeShare() {
    try { await navigator.share({ title: 'Pilot car load', text, url }) } catch { /* cancelled */ }
  }
  const hasNative = typeof navigator !== 'undefined' && typeof (navigator as any).share === 'function'
  const fb = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
  const small = compact ? { minHeight: 34, padding: '4px 14px', fontSize: 13 } : { minHeight: 40 }
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      <button type="button" className="ui-btn ghost" style={small} onClick={() => copy('text')}>Copy text + link</button>
      <a className="ui-btn ghost" style={small} href={fb} target="_blank" rel="noopener noreferrer">Share on Facebook</a>
      {hasNative && <button type="button" className="ui-btn ghost" style={small} onClick={nativeShare}>Share…</button>}
      <span role="status" className="ui-note" style={{ margin: 0 }}>{msg}</span>
    </div>
  )
}
