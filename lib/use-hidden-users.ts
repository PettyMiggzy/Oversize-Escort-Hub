'use client'
import { useEffect, useState } from 'react'

// People the signed-in user blocked, or who blocked them. Lists hide them both ways. Signed-out visitors get an empty set.
export function useHiddenUsers(): Set<string> {
  const [hidden, setHidden] = useState<Set<string>>(new Set())
  useEffect(() => {
    let live = true
    fetch('/api/blocks').then((r) => (r.ok ? r.json() : { hidden: [] })).then((d) => { if (live) setHidden(new Set<string>(d.hidden || [])) }).catch(() => {})
    return () => { live = false }
  }, [])
  return hidden
}
