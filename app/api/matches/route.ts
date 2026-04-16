import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { load_id, action } = await request.json()

    if (action === 'accept') {
      await supabase.from('loads').update({ status: 'matched' }).eq('id', load_id)
    } else if (action === 'decline') {
      await supabase.from('loads').update({ status: 'open', matched_escort_id: null }).eq('id', load_id)
    } else {
      // escort claiming load — set pending_match
      await supabase.from('loads').update({ status: 'pending_match', matched_escort_id: user.id }).eq('id', load_id)

      // Notify carrier
      try {
        const { data: loadData } = await supabase.from('loads').select('posted_by').eq('id', load_id).single()
        if (loadData?.posted_by) {
          await supabase.from('notifications').insert({
            user_id: loadData.posted_by,
            message: 'An escort has claimed your load. Review and accept or decline in your dashboard.',
            read: false,
            created_at: new Date().toISOString(),
          })
        }
      } catch(_) {}
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
