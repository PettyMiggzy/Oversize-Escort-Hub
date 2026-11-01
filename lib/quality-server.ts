import type { SupabaseClient } from '@supabase/supabase-js'
import { cleanEquipment, equipmentLabel, missingEquipment, regularsLeftMinutes, regularsOpen } from '@/lib/quality'

/** Is this escort one of the carrier's regulars? */
export async function isRegularOf(svc: SupabaseClient, carrierId: string, escortId: string): Promise<boolean> {
  const { data } = await svc.from('favorite_escorts').select('escort_id').eq('carrier_id', carrierId).eq('escort_id', escortId).maybeSingle()
  return !!data
}

export async function countRegulars(svc: SupabaseClient, carrierId: string): Promise<number> {
  const { data } = await svc.from('favorite_escorts').select('escort_id').eq('carrier_id', carrierId)
  return Array.isArray(data) ? data.length : 0
}

type LoadQuality = { carrier_id?: string | null; regulars_until?: string | null; required_equipment?: unknown }

/**
 * The reasons a claim or a bid is refused for these two rules, checked on the server (the browser only hides buttons):
 * the carrier's regulars have first look for a while, and a load can ask for equipment the escort must have listed.
 * Returns the message to refuse with, or null when the escort may go ahead.
 */
export async function qualityRefusal(svc: SupabaseClient, load: LoadQuality, escortId: string): Promise<string | null> {
  if (regularsOpen(load.regulars_until) && load.carrier_id) {
    if (!(await isRegularOf(svc, load.carrier_id, escortId))) {
      return `This carrier's regulars have first look for about ${regularsLeftMinutes(load.regulars_until)} more minutes. Try again then.`
    }
  }
  const required = cleanEquipment(load.required_equipment)
  if (required.length) {
    const { data } = await svc.from('profiles').select('equipment').eq('id', escortId).maybeSingle()
    const missing = missingEquipment(required, (data as { equipment?: unknown } | null)?.equipment)
    if (missing.length) {
      return `This load needs: ${missing.map(equipmentLabel).join(', ')}. If you have it, add it to your profile (Edit Profile, My equipment) and try again.`
    }
  }
  return null
}
