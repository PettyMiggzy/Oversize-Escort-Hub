import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' })
const BGC_PRICE = 'price_1TF0EILmfugPCRbAvM6Q5rhW'

export async function POST(_req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !user.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Already paid? Don't create another session.
  const { data: prof } = await supabase.from('profiles').select('bgc_paid, bgc_verified').eq('id', user.id).single()
  if (prof?.bgc_verified) return NextResponse.json({ error: 'Already verified' }, { status: 400 })
  if (prof?.bgc_paid) return NextResponse.json({ error: 'Already paid', alreadyPaid: true }, { status: 400 })

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: [{ price: BGC_PRICE, quantity: 1 }],
    customer_email: user.email,
    client_reference_id: user.id,
    metadata: { userId: user.id, priceId: BGC_PRICE, type: 'bgc' },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/verify?bgc=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/verify?bgc=cancel`,
  })
  return NextResponse.json({ url: session.url })
}
