import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { safeRedirectPath } from '@/lib/security'
import { alertWelcome, runAfter } from '@/lib/alerts'
import { serviceClient } from '@/lib/service-client'

export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )
    await supabase.auth.exchangeCodeForSession(code)

    // Ensure a profiles row exists for this user. Pulls signup metadata
    // (full_name, company_name, role) from auth.users.raw_user_meta_data.
    // Created once: an existing row is left alone, so a later sign-in never resets a name or demotes a role.
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const meta = (user.user_metadata ?? {}) as Record<string, unknown>
        const fullName = typeof meta.full_name === 'string' ? meta.full_name : null
        const companyName = typeof meta.company_name === 'string' ? meta.company_name : null
        const rawRole = typeof meta.role === 'string' ? meta.role : null
        const allowedRoles = ['escort', 'carrier', 'broker', 'fleet_manager']
        const role = rawRole && allowedRoles.includes(rawRole) ? rawRole : 'escort'

        await supabase.from('profiles').upsert(
          {
            id: user.id,
            email: user.email,
            full_name: fullName,
            company_name: companyName,
            role,
          },
          { onConflict: 'id', ignoreDuplicates: true }
        )
        // A phone number typed at sign-up goes on the profile once (the browser cannot read or write it, so the server does)
        const metaPhone = typeof meta.phone === 'string' ? meta.phone.replace(/[^\d+()\-.\s]/g, '').trim().slice(0, 30) : ''
        if (metaPhone.replace(/\D/g, '').length >= 10) {
          await serviceClient().from('profiles').update({ phone: metaPhone }).eq('id', user.id).is('phone', null)
        }
        // First sign-in of a brand new account (made in the last 10 minutes): send the welcome email once
        const { data: mine } = await supabase.from('profiles').select('created_at').eq('id', user.id).maybeSingle()
        if (mine?.created_at && Date.now() - new Date(String(mine.created_at)).getTime() < 10 * 60000) {
          const uid = user.id
          runAfter(async () => { await alertWelcome(uid) })
        }
      }
    } catch {
      // Non-fatal: if the profiles row can't be created here (RLS,
      // schema drift, etc.) the user can still sign in; downstream
      // surfaces will surface the issue.
    }
  }

  const redirect = requestUrl.searchParams.get('redirect')
  // a path on this site only ("/\evil.com" and "//evil.com" are not)
  const dest = safeRedirectPath(redirect)
  return NextResponse.redirect(new URL(dest, requestUrl.origin))
}
