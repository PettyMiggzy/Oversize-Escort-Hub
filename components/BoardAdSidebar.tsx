'use client'
import { useEffect, useState } from 'react'
import { isNativeApp } from '@/lib/native'

// Side column on the boards: a paid placement and a fuel offer. Hidden inside the phone app,
// where nothing is sold and no outside offers are shown.
export function BoardAdSidebar() {
  const [native, setNative] = useState(false)
  useEffect(() => { setNative(isNativeApp()) }, [])
  if (native) return null
  return (
    <aside style={{ position: 'sticky', top: 88 }}>
      <a href="/pricing" style={{ textDecoration: 'none', display: 'block' }}>
        <div className="ui-side-card" style={{ borderColor: 'rgba(255,196,107,.4)' }}>
          <span className="ui-badge amber">Sponsored</span>
          <div className="t">Get featured here</div>
          <p>Your profile shown to carriers in your zone, with direct contact unlocked.</p>
          <span className="ui-btn block" style={{ background: '#ffc46b', boxShadow: 'none' }}>$29.99 / 30 days &mdash; Get started</span>
        </div>
      </a>
      <a href="https://upside.app.link/9WR232" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'block' }}>
        <div className="ui-side-card" style={{ borderColor: 'rgba(53,212,137,.4)' }}>
          <span className="ui-badge green">Save on fuel</span>
          <div className="t">Upside cash back</div>
          <p>15&cent;/gal extra cash back on your first fill-up. Upside is an affiliate; OEH may earn a commission.</p>
          <span className="ui-btn block" style={{ background: '#35d489', boxShadow: 'none' }}>Use code 9WR232</span>
        </div>
      </a>
    </aside>
  )
}
