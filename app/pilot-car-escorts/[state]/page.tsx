import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import SiteHeader from '@/components/SiteHeader'
import PageTitle from '@/components/PageTitle'
import EmptyState from '@/components/EmptyState'
import { serviceClient } from '@/lib/service-client'
import { PUBLIC_PROFILE_SELECT } from '@/lib/profile-columns'
import { placeFor, STATIC_STATE_CODES } from '@/lib/state-codes'
import { VERIFICATION_LIVE } from '@/lib/verification'

export const revalidate = 3600

type EscortRow = {
  id: string
  full_name: string | null
  tier: string | null
  bgc_verified: boolean | null
  pevo_verified: boolean | null
  p_evo_verified: boolean | null
  availability_states: string[] | null
  states_licensed: string[] | null
}

type Props = { params: Promise<{ state: string }> }

export function generateStaticParams() {
  return STATIC_STATE_CODES.map((code) => ({ state: code.toLowerCase() }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state } = await params
  const place = placeFor(state)
  if (!place) return {}
  const code = place.code.toLowerCase()
  // A page with nobody on it is thin content: keep it out of search results until an escort lists the state
  const { rows } = await loadEscorts(place.code)
  return {
    robots: rows.length === 0 ? { index: false, follow: true } : undefined,
    title: { absolute: `Pilot car escorts in ${place.name} | Oversize Escort Hub` },
    description: `Pilot car escorts who list ${place.name} on Oversize Escort Hub. Open a profile, post a load, or join as an escort.`,
    alternates: { canonical: `/pilot-car-escorts/${code}` },
  }
}

function covered(row: EscortRow): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of [...(row.availability_states ?? []), ...(row.states_licensed ?? [])]) {
    const code = String(raw || '').trim().toUpperCase()
    if (!code || seen.has(code)) continue
    seen.add(code)
    out.push(code)
  }
  return out
}

async function loadEscorts(code: string): Promise<{ rows: EscortRow[]; failed: boolean }> {
  try {
    const svc = serviceClient()
    const byAvail = await svc
      .from('profiles')
      .select(PUBLIC_PROFILE_SELECT)
      .eq('role', 'escort')
      .or('suspended.is.null,suspended.eq.false')
      .contains('availability_states', [code])
      .limit(60)
    const byLicensed = await svc
      .from('profiles')
      .select(PUBLIC_PROFILE_SELECT)
      .eq('role', 'escort')
      .or('suspended.is.null,suspended.eq.false')
      .contains('states_licensed', [code])
      .limit(60)
    if (byAvail.error || byLicensed.error) return { rows: [], failed: true }
    const seen = new Set<string>()
    const rows: EscortRow[] = []
    for (const raw of [...(byAvail.data ?? []), ...(byLicensed.data ?? [])]) {
      const row = raw as unknown as EscortRow
      if (!row?.id || seen.has(row.id)) continue
      seen.add(row.id)
      rows.push(row)
    }
    rows.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''))
    return { rows: rows.slice(0, 60), failed: false }
  } catch {
    return { rows: [], failed: true }
  }
}

export default async function PilotCarEscortsStatePage({ params }: Props) {
  const { state } = await params
  const place = placeFor(state)
  if (!place) notFound()
  const { rows, failed } = await loadEscorts(place.code)

  return (
    <>
      <SiteHeader />
      <div className="ui-page">
        <div className="ui-wrap">
          <PageTitle
            eyebrow="Find escorts"
            title={`Pilot car escorts in ${place.name}`}
            lead={`Escorts who list ${place.name} on their profile are shown below. A listing means they added ${place.name}. It does not mean they can take a job today.`}
          />
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', margin: '-8px 0 28px' }}>
            <Link className="ui-btn" href="/quick-post">Post a load</Link>
            <Link className="ui-btn ghost" href="/signin?mode=signup">Join as an escort</Link>
          </div>
          {failed ? (
            <EmptyState
              title="Escorts did not load"
              text="We could not load the list just now. Refresh the page in a little while."
            />
          ) : rows.length === 0 ? (
            <EmptyState
              title={`No escorts list ${place.name} yet`}
              text="When an escort adds this place to their profile, they will show up here."
            />
          ) : (
            <div className="ui-grid">
              {rows.map((row) => {
                const states = covered(row)
                return (
                  <Link key={row.id} href={`/escorts/${row.id}`} className="ui-load" style={{ textDecoration: 'none' }}>
                    <div>
                      <div className="ui-route">{row.full_name?.trim() || 'Unnamed'}</div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                        {row.tier === 'pro' && <span className="ui-badge orange">Pro</span>}
                        {VERIFICATION_LIVE && row.bgc_verified && <span className="ui-badge green">BGC</span>}
                        {VERIFICATION_LIVE && (row.pevo_verified || row.p_evo_verified) && <span className="ui-badge blue">P/EVO</span>}
                      </div>
                      {states.length > 0 && (
                        <div className="ui-meta" style={{ marginTop: 10 }}>States covered: {states.join(', ')}</div>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
