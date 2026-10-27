'use client'
import { useEffect } from 'react'
import { isNativeApp } from '@/lib/native'

// Marks the page when it runs inside the phone app so the styles can leave room for the status bar.
export default function NativeFlag() {
  useEffect(() => {
    try { if (isNativeApp()) document.documentElement.classList.add('native-app') } catch { /* not in the app */ }
  }, [])
  return null
}
