import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-auth'
import { serviceClient } from '@/lib/service-client'

export const dynamic = 'force-dynamic'

const DAY = 86400000

type Person = {
  id: string
  role: string | null
  created_at: string | null
  state: string | null
  bgc_verified: boolean | null
  pevo_verified: boolean | null
  p_evo_verified: boolean | null
}

type LoadRow = { id: string; created_at: string | null; status: string | null }
type BidRow = { id: string; load_id: string | null }

function since(days: number) {
  return new Date(Date.now() - days * DAY).toISOString()
}

function recent(created: string | null, cutoff: string) {
  return typeof created === 'string' && created >= cutoff
}

function stateSet(value: string | null) {
  return typeof value === 'string' && value.trim() !== ''
}

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const svc = serviceClient()
  const [peopleRes, loadsRes, bidsRes] = await Promise.all([
    svc.from('profiles').select('id, role, created_at, state, bgc_verified, pevo_verified, p_evo_verified'),
    svc.from('loads').select('id, created_at, status'),
    svc.from('bids').select('id, load_id'),
  ])
  if (peopleRes.error || loadsRes.error || bidsRes.error) {
    return NextResponse.json({ error: 'Could not load the funnel' }, { status: 500 })
  }

  const people = (peopleRes.data ?? []) as Person[]
  const loads = (loadsRes.data ?? []) as LoadRow[]
  const bids = (bidsRes.data ?? []) as BidRow[]
  const week = since(7)
  const month = since(30)
  const loadIds = new Set(loads.map((load) => load.id))
  const loadsWithBid = new Set<string>()
  for (const bid of bids) {
    if (bid.load_id && loadIds.has(bid.load_id)) loadsWithBid.add(bid.load_id)
  }

  return NextResponse.json({
    signupsTotal: people.length,
    signups7: people.filter((p) => recent(p.created_at, week)).length,
    signups30: people.filter((p) => recent(p.created_at, month)).length,
    roleEscort: people.filter((p) => p.role === 'escort').length,
    roleCarrier: people.filter((p) => p.role === 'carrier').length,
    roleBroker: people.filter((p) => p.role === 'broker').length,
    roleFleetManager: people.filter((p) => p.role === 'fleet_manager').length,
    withState: people.filter((p) => stateSet(p.state)).length,
    withBgc: people.filter((p) => p.bgc_verified === true).length,
    withPevo: people.filter((p) => p.pevo_verified === true || p.p_evo_verified === true).length,
    loadsTotal: loads.length,
    loads7: loads.filter((load) => recent(load.created_at, week)).length,
    loads30: loads.filter((load) => recent(load.created_at, month)).length,
    loadsWithBid: loadsWithBid.size,
    bidsTotal: bids.length,
    loadsFilled: loads.filter((load) => load.status === 'filled').length,
    loadsOpen: loads.filter((load) => load.status === 'open').length,
  })
}
