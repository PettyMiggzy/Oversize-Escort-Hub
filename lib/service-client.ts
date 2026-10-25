import { createClient } from '@supabase/supabase-js'

// Server-only. Column grants on profiles do not apply to the service key, so own-row
// and authorized contact reads go through here after the browser loses those columns.
export function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
