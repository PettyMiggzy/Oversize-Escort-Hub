'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

// The buttons on the Wraith updates page. Signed-out visitors (people who came from a post or an ad) are offered a free account;
// signed-in people get the way into Wraith (when it is switched on).
export default function WraithCta({ live }: { live: boolean }) {
  const [signedIn, setSignedIn] = useState<boolean | null>(null)
  useEffect(() => {
    let off = false
    createClient().auth.getSession().then(({ data }) => { if (!off) setSignedIn(!!data.session) }).catch(() => { if (!off) setSignedIn(false) })
    return () => { off = true }
  }, [])
  if (signedIn === null) return <div style={{ minHeight: 44 }} aria-hidden="true" />
  if (signedIn) {
    return live
      ? <Link href="/wraith" className="ui-btn">Open Wraith</Link>
      : <span className="ui-note">Wraith is switched off right now.</span>
  }
  return (
    <>
      <Link href="/signin?mode=signup" className="ui-btn">Create a free account</Link>
      <Link href="/signin?redirect=/wraith/updates" className="ui-btn ghost">Sign in</Link>
    </>
  )
}
