'use client'
import { useEffect } from 'react'
import { isNativeApp } from '@/lib/native'
import { createClient } from '@/lib/supabase/client'

// Inside the iPhone and Android apps only, and only once the owner switches NEXT_PUBLIC_NATIVE_PUSH on:
// ask permission, send this phone's token to the server, open the right page when a notification is tapped.
// An older app version without the push plugin simply fails quietly here.
export default function NativePushRegister() {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_NATIVE_PUSH !== 'on') return
    let cancelled = false
    ;(async () => {
      try {
        if (!isNativeApp()) return
        const { data } = await createClient().auth.getSession()
        if (!data.session || cancelled) return
        const { Capacitor } = await import('@capacitor/core')
        if (!Capacitor.isNativePlatform()) return
        const platform = Capacitor.getPlatform()
        if (platform !== 'ios' && platform !== 'android') return
        const { PushNotifications } = await import('@capacitor/push-notifications')
        const perm = await PushNotifications.requestPermissions()
        if (perm.receive !== 'granted') return
        await PushNotifications.addListener('registration', (t) => {
          fetch('/api/push/device', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ platform, token: t.value }) }).catch(() => {})
        })
        await PushNotifications.addListener('pushNotificationActionPerformed', (a) => {
          const u = (a.notification?.data as { url?: unknown } | undefined)?.url
          if (typeof u === 'string' && u.startsWith('/') && !u.startsWith('//')) window.location.href = u
        })
        await PushNotifications.register()
      } catch { /* not available in this app version, or not allowed: nothing to do */ }
    })()
    return () => { cancelled = true }
  }, [])
  return null
}
