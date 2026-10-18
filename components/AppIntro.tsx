'use client'
import { useEffect, useRef, useState } from 'react'
import { isNativeApp } from '@/lib/native'

// The app's opening screen: a short film of the logo, a pilot car and an oversize load. It plays once each time the
// mobile app is opened (never in a browser), fades out when it ends, and a tap skips it. If the video cannot play
// (no connection, blocked autoplay) it is gone after a moment and the app simply opens.
const SEEN = 'oeh-intro-seen'
const MAX_MS = 9000

export default function AppIntro() {
  const [show, setShow] = useState(false)
  const [fading, setFading] = useState(false)
  const video = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    try {
      if (!isNativeApp() || sessionStorage.getItem(SEEN)) return
      sessionStorage.setItem(SEEN, '1')
    } catch { return }
    setShow(true)
    const t = setTimeout(finish, MAX_MS)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!show) return
    const v = video.current
    // some webviews refuse autoplay: drop the intro rather than leave a frozen picture
    v?.play().catch(() => finish())
  }, [show])

  function finish() {
    setFading(true)
    setTimeout(() => setShow(false), 450)
  }

  if (!show) return null
  return (
    <div
      onClick={finish}
      role="presentation"
      style={{
        position: 'fixed', inset: 0, zIndex: 100000, background: '#0a0a0a',
        opacity: fading ? 0 : 1, transition: 'opacity .45s ease', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <video
        ref={video}
        src="/intro-portrait.mp4"
        poster="/intro-poster.jpg"
        muted
        playsInline
        preload="auto"
        onEnded={finish}
        onError={finish}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
      <button
        onClick={(e) => { e.stopPropagation(); finish() }}
        style={{
          position: 'absolute', right: 16, top: 'max(16px, env(safe-area-inset-top))', background: 'rgba(0,0,0,.45)', color: '#fff',
          border: '1px solid rgba(255,255,255,.35)', borderRadius: 999, padding: '6px 14px', fontSize: 12, letterSpacing: '.08em',
        }}
      >
        SKIP
      </button>
    </div>
  )
}
