export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/loads?board=flat_rate|open_loads|bid_board
export async function GET(req: NextRequest) {
  const board = req.nextUrl.searchParams.get('board')
  try {
    // Query regular loads
    let query = supabase
      .from('loads')
      .select('*')
      .neq('status', 'filled')
      .order('created_at', { ascending: false })
    if (board) {
      query = query.contains('boards', [board])
    }
    const { data: regularLoads, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Query external loads (scraped from Loads Covered) — only for open_loads board
    let externalLoads: any[] = []
    if (!board || board === 'open_loads') {
      const now = new Date().toISOString()
      const { data: extData } = await supabase
        .from('external_loads')
        .select('*')
        .eq('status', 'open')
        .gt('expires_at', now)
        .order('posted_at', { ascending: false })
      // Tag external loads so UI can badge them
      externalLoads = (extData ?? []).map(l => ({ ...l, is_external: true, boards: ['open_loads'] }))
    }

    // Merge and sort by date
    const allLoads = [...(regularLoads ?? []), ...externalLoads]
      .sort((a, b) => new Date(b.created_at ?? b.posted_at).getTime() - new Date(a.created_at ?? a.posted_at).getTime())

    return NextResponse.json({ loads: allLoads })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// POST /api/loads — create a multi-board load (no duplicate rows)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { carrierId, boards, pickupCity, pickupState, deliveryCity, deliveryState, dotNumber, ...rest } = body
    if (!carrierId || !boards?.length) {
      return NextResponse.json({ error: 'carrierId and boards required' }, { status: 400 })
    }

    // FMCSA DOT verification (if DOT number provided)
    let fmcsaVerified = false
    let carrierLegalName = ''
    if (dotNumber) {
      try {
        const apiKey = process.env.FMCSA_API_KEY
        if (apiKey) {
          const fmcsaRes = await fetch(
            `https://mobile.fmcsa.dot.gov/qc/services/carriers/${encodeURIComponent(dotNumber)}?webKey=${apiKey}`,
            { next: { revalidate: 3600 } }
          )
          if (fmcsaRes.ok) {
            const fmcsaData = await fmcsaRes.json()
            const carrier = fmcsaData?.content?.carrier
            if (carrier) {
              fmcsaVerified = true
 true
              carrierLegalName = carrier.legalName ?? carrier.dbaName ?? ''
            }
          }
        }
      } catch { /* ignore FMCSA errors, don't block posting */ }
    }

    // Insert single record with boards array
    const { data, error } = await supabase.from('loads').insert({
      carrier_id: carrierId,
      boards,
      pickup_city: pickupCity,
      pickup_state: pickupState,
      delivery_city: deliveryCity,
      delivery_state: deliveryState,
      dot_number: dotNumber ?? null,
      fmcsa_verified: fmcsaVerified,
      carrier_legal_name: carrierLegalName || null,
      status: 'open',
      created_at: new Date().toISOString(),
      ...rest,
    }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ load: data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// PATCH /api/loads — update status across all boards atomically
export async function PATCH(req: NextRequest) {
  try {
    const { loadId, status } = await req.json()
    if (!loadId || !status) return NextResponse.json({ error: 'loadId and status required' }, { status: 400 })
    const { data, error } = await supabase
      .from('loads')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', loadId)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ load: data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
