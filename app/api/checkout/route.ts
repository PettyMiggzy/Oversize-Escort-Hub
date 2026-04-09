import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'


export const dynamic = 'force-dynamic'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' as any })
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(req: NextRequest) {
  try {
    const { priceId, userId } = await req.json()
    if (!priceId || !userId) return NextResponse.json({ error: 'Missing params' }, { status: 400 })
    const { data: authData } = await supabase.auth.admin.getUserById(userId)
    const isBGC = priceId === 'price_1TF0EILmfugPCRbAvM6Q5rhW'
    const session = await stripe.checkout.sessions.create({
      mode: isBGC ? 'payment' : 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      ...(authData?.user?.email ? { customer_email: authData.user.email } : {}),
      metadata: { userId, priceId },
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pricing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pricing`,
    })
    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}