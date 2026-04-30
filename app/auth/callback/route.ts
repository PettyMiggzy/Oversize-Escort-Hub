import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

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
    // Idempotent: onConflict('id') so re-confirms / sign-ins are safe.
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
          { onConflict: 'id', ignoreDuplicates: false }
        )
      }
    } catch {
      // Non-fatal: if the profiles row can't be created here (RLS,
      // schema drift, etc.) the user can still sign in; downstream
      // surfaces will surface the issue.
    }
  }

  const redirect = requestUrl.searchParams.get('redirect')
  const dest = redirect ? '/' + redirect.replace(/^\/+/, '') : '/dashboard'
  return NextResponse.redirect(new URL(dest, requestUrl.origin))
}
