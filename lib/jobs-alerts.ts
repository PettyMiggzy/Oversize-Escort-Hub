// Emails for the jobs board. Best effort: a failed email never fails the action. Poster and applicant see only
// names and job titles here; contact details are never put in an email.
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/email'
import { ADMIN_EMAILS } from '@/lib/supabase'

const SITE = 'https://www.oversize-escort-hub.com'
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string))
const svc = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function notify(userId: string, subject: string, headline: string, body: string, path: string) {
  const client = svc()
  const { data: p } = await client.from('profiles').select('id, email, suspended, email_alerts').eq('id', userId).maybeSingle()
  if (!p || p.suspended) return
  try { await client.from('notifications').insert({ user_id: userId, message: `${headline}: ${body}`.slice(0, 500) }) } catch {}
  if (!p.email || p.email_alerts === false) return
  await sendEmail({ to: p.email, subject, html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#111"><h2 style="margin:0 0 12px">${esc(headline)}</h2><p style="font-size:15px;line-height:1.5">${esc(body)}</p><p style="margin:20px 0"><a href="${SITE}${path}" style="background:#ff6a13;color:#000;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:bold">Open in Oversize Escort Hub</a></p></div>` })
}

export async function alertPosterNewApplicant(jobId: string) {
  const { data: job } = await svc().from('job_posts').select('poster_id, title').eq('id', jobId).maybeSingle()
  if (job) await notify(job.poster_id, `New applicant: ${job.title}`, 'New applicant for your job', `Someone applied for "${job.title}". Review them in your dashboard.`, '/dashboard')
}
export async function alertApplicantDecision(jobId: string, applicantId: string, accepted: boolean) {
  const { data: job } = await svc().from('job_posts').select('title').eq('id', jobId).maybeSingle()
  if (!job) return
  await notify(applicantId, accepted ? `You were accepted: ${job.title}` : `Update on your application: ${job.title}`,
    accepted ? 'The company accepted you' : 'Application update',
    accepted ? `They accepted your application for "${job.title}". Their contact details are now on your dashboard.` : `They went with someone else for "${job.title}". Keep looking, new jobs are posted all the time.`, '/dashboard')
}
export async function alertAdminsNewJob(title: string, company: string) {
  await Promise.allSettled(ADMIN_EMAILS.map((to) => sendEmail({ to, subject: `New job posted: ${title}`, html: `<p style="font-family:Arial,sans-serif">${esc(company || 'A company')} posted "${esc(title)}".<br><a href="${SITE}/jobs">Open the jobs board</a></p>` })))
}
