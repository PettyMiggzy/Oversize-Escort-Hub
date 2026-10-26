import { revalidatePath } from 'next/cache'

/** The public jobs board is cached for a few minutes; a post, close or removal should show at once. Never fails the caller. */
export function refreshJobsBoard(id?: string) {
  try {
    revalidatePath('/jobs')
    if (id) revalidatePath(`/jobs/${id}`)
    revalidatePath('/sitemap.xml')
  } catch { /* outside a request (tests) */ }
}
