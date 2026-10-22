import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function ensureVapid() {
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const priv = process.env.VAPID_PRIVATE_KEY
  if (!pub || !priv) return false
  try {
    webpush.setVapidDetails('mailto:support@oversize-escort-hub.com', pub, priv)
    return true
  } catch {
    return false
  }
}

export type PushPayload = {
  title: string
  body: string
  url?: string
  data?: Record<string, unknown>
}

/** Send a web-push to every push_subscriptions row for the given user ids. */
export async function sendWebPushToUsers(
  userIds: string[],
  payload: PushPayload
): Promise<number> {
  if (!userIds.length || !ensureVapid()) return 0
  const unique = [...new Set(userIds)]
  const { data: rows } = await supabase
    .from('push_subscriptions')
    .select('user_id, subscription')
    .in('user_id', unique)
  if (!rows?.length) return 0

  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url ?? '/',
    ...(payload.data ? { data: payload.data } : {}),
  })

  let sent = 0
  for (const row of rows) {
    try {
      await webpush.sendNotification(row.subscription, body)
      sent++
    } catch (err) {
      console.error('[push] send failed', row.user_id, err)
    }
  }
  return sent
}

/** Look up one user's subscription and send. */
export async function sendWebPushToUser(
  userId: string | null | undefined,
  payload: PushPayload
): Promise<boolean> {
  if (!userId) return false
  return (await sendWebPushToUsers([userId], payload)) > 0
}
