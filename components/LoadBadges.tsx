'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cleanEquipment, equipmentShort, regularsLeftMinutes, regularsOpen } from '@/lib/quality'

export type QualityLoad = { urgent?: boolean | null; regulars_until?: string | null; required_equipment?: string[] | null; carrier_id?: string | null }

/** The carriers whose "regulars" list the signed-in escort is on (empty for everyone else). */
export function useRegularOf(): Set<string> {
  const [ids, setIds] = useState<Set<string>>(new Set())
  useEffect(() => {
    let off = false
    ;(async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data } = await supabase.from('favorite_escorts').select('carrier_id').eq('escort_id', user.id)
        if (!off && Array.isArray(data)) setIds(new Set(data.map((r: { carrier_id: string }) => r.carrier_id)))
      } catch { /* the badges just show without it */ }
    })()
    return () => { off = true }
  }, [])
  return ids
}

/** True when the regulars-first window is still running and this escort is not one of the carrier's regulars. */
export const heldForRegulars = (load: QualityLoad, regularOf: Set<string>) =>
  regularsOpen(load.regulars_until) && !(load.carrier_id && regularOf.has(load.carrier_id))

/** Ask the escort to confirm the equipment a load needs before they claim or bid. Returns true to go ahead. */
export function confirmEquipment(load: QualityLoad): boolean {
  const need = cleanEquipment(load.required_equipment)
  if (!need.length) return true
  return window.confirm(`This load needs: ${need.map(equipmentShort).join(', ')}.\n\nBy continuing you say you have all of it on your vehicle.`)
}

/** Urgent, regulars-first and equipment badges for a load card. */
export default function LoadBadges({ load, regularOf }: { load: QualityLoad; regularOf?: Set<string> }) {
  const need = cleanEquipment(load.required_equipment)
  const open = regularsOpen(load.regulars_until)
  const mine = !!(load.carrier_id && regularOf?.has(load.carrier_id))
  if (!load.urgent && !open && !need.length) return null
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 8 }}>
      {load.urgent && <span className="ui-badge" style={{ background: 'rgba(255,90,90,.18)', color: '#ff8a8a', border: '1px solid rgba(255,90,90,.5)', fontWeight: 800 }}>URGENT</span>}
      {open && (mine
        ? <span className="ui-badge green">You have first look · {regularsLeftMinutes(load.regulars_until)} min</span>
        : <span className="ui-badge amber">Regulars first · {regularsLeftMinutes(load.regulars_until)} min left</span>)}
      {need.length > 0 && <span className="ui-meta" style={{ color: '#9aa3b2' }}>Needs: {need.map(equipmentShort).join(', ')}</span>}
    </div>
  )
}
