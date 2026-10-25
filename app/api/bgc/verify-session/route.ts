import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { STRIPE_PRICE_IDS } from '@/lib/stripe-utils'

export const dynamic = 'force-dynamic'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' })

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { session_id } = await req.json().catch(() => ({}))
  if (!session_id) return NextResponse.json({ error: 'session_id required' }, { status: 400 })
  try {
    const session = await stripe.checkout.sessions.retrieve(session_id, { expand: ['line_items'] })
    // must be this user's paid BGC purchase, not any other paid checkout (a Member plan, say)
    const boughtBgc = session.metadata?.type === 'bgc'
      && !!session.line_items?.data.some((li) => li.price?.id === STRIPE_PRICE_IDS.BGC_BADGE)
    const ok = session.payment_status === 'paid' && boughtBgc
      && (session.metadata?.userId === user.id || session.client_reference_id === user.id)
    if (!ok) return NextResponse.json({ paid: false }, { status: 200 })
    // Trust webhook to flip bgc_paid; fall back to direct flip if webhook lagged.
    const { data: prof } = await supabase.from('profiles').select('bgc_paid').eq('id', user.id).single()
    if (!prof?.bgc_paid) {
      // the paid flag is written with the service key: profile rows cannot set it from a user session
      const svc = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
      await svc.from('profiles').update({ bgc_paid: true }).eq('id', user.id)
    }
    return NextResponse.json({ paid: true })
  } catch (e: any) {
    console.error('[bgc verify-session]', e)
    return NextResponse.json({ error: 'Could not check the payment' }, { status: 500 })
  }
}
