'use client'
import { useEffect, useState, type ReactNode } from 'react'
import { isNativeApp } from '@/lib/native'

// Wraps a page that sells something. Inside the phone app it shows a plain note instead:
// no prices, no pay buttons. On the website it renders the page as usual.
export default function WebOnly({ children }: { children: ReactNode }) {
  const [native, setNative] = useState(false)
  useEffect(() => { setNative(isNativeApp()) }, [])
  if (!native) return <>{children}</>
  return (
    <div className="ui-page">
      <div className="ui-wrap" style={{ maxWidth: 560 }}>
        <div className="ui-empty">
          <h3>Plans are managed on our website</h3>
          <p>Your account works the same in the app. Everything you use here is already on your account.</p>
          <a href="/dashboard" className="ui-btn">Back to dashboard</a>
        </div>
      </div>
    </div>
  )
}
