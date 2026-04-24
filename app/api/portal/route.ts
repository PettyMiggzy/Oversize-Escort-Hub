import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' as any })
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(req: NextRequest) {
  const { error: __authErr } = await requireAuth()
  if (__authErr) return __authErr
  try {
    const { userId } = await req.json()
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

    const { data: authData } = await supabase.auth.admin.getUserById(userId)
    if (!authData?.user?.email) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const existing = await stripe.customers.list({ email: authData.user.email, limit: 1 })
    let customerId: string
    if (existing.data.length > 0) {
      customerId = existing.data[0].id
    } else {
      const customer = await stripe.customers.create({
        email: authData.user.email,
        metadata: { userId },
      })
      customerId = customer.id
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: process.env.NEXT_PUBLIC_SITE_URL || 'https://oversizeescorthub.com',
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('[portal] error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
