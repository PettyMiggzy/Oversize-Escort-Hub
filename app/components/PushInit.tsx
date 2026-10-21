'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i)
  return outputArray
}

export default function PushInit({ userId: userIdProp }: { userId?: string | null }) {
  const [sessionUserId, setSessionUserId] = useState<string | null>(userIdProp ?? null)
  const userId = userIdProp ?? sessionUserId

  useEffect(() => {
    if (userIdProp) return
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setSessionUserId(user?.id ?? null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionUserId(session?.user?.id ?? null)
    })
    return () => subscription.unsubscribe()
  }, [userIdProp])

  useEffect(() => {
    if (!userId || typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) return
    const run = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js')
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') return
        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        if (!vapidKey) return
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey)
        })
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription: sub.toJSON(), userId })
        })
      } catch {}
    }
    run()
  }, [userId])
  return null
}
