'use client'
import { useEffect, useState, type ReactNode } from 'react'
import { isNativeApp } from '@/lib/native'

// Renders its children on the website and nothing inside the phone app.
// Used for anything that shows a price or a pay/upgrade button.
export default function HideInApp({ children }: { children: ReactNode }) {
  const [native, setNative] = useState(true) // assume the phone app until the browser proves otherwise, so a price is never in the first HTML
  useEffect(() => { setNative(isNativeApp()) }, [])
  return native ? null : <>{children}</>
}
