import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import SiteHeader from '@/components/SiteHeader'
import PageTitle from '@/components/PageTitle'
import { LABELS, payText } from '@/lib/jobs'
import { placeFor } from '@/lib/state-codes'
import { ApplyBox } from './apply-box'
import { loadOpenJob, postedLabel } from '../query'

export const revalidate = 300

type Props = { params: Promise<{ id: string }> }


function words(group: keyof typeof LABELS, value: string) {
  const map = LABELS[group] as Record<string, string>
  return map[value] || value
}

function startText(iso: string | null) {
  if (!iso) return null
  const t = Date.parse(iso.slice(0, 10) + 'T00:00:00Z')
  if (!Number.isFinite(t)) return null
  return new Date(t).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'long', day: 'numeric', year: 'numeric' })
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const job = await loadOpenJob(id)
  if (!job) return { title: 'Job not found' }
  const description = (job.description || job.title).replace(/\s+/g, ' ').trim().slice(0, 160)
  return {
    title: job.title,
    description,
    alternates: { canonical: `/jobs/${job.id}` },
  }
}

export default async function JobPage({ params }: Props) {
  const { id } = await params
  const job = await loadOpenJob(id)
  if (!job || job.status !== 'open') notFound()

  const where = [job.base_city, job.base_state ? (placeFor(job.base_state)?.name || job.base_state) : ''].filter(Boolean).join(', ')
  const starts = startText(job.start_date)
  const facts: { k: string; v: string }[] = [
    { k: 'Pay', v: payText(job) },
    { k: 'Pay model', v: words('pay_model', job.pay_model) },
    { k: 'Classification', v: words('classification', job.classification) },
    { k: 'Equipment', v: words('equipment', job.equipment) },
    { k: 'Schedule', v: words('schedule', job.schedule) },
    { k: 'Travel', v: words('travel', job.travel) },
    { k: 'Based in', v: where || 'Not listed' },
  ]
  if (job.pay_note) facts.push({ k: 'Pay note', v: job.pay_note })
  if (starts) facts.push({ k: 'Start date', v: starts })

  return (
    <>
      <SiteHeader />
      <div className="ui-page">
        <div className="ui-wrap" style={{ maxWidth: 800 }}>
          <Link href="/jobs" className="ui-back">Jobs</Link>
          <PageTitle
            eyebrow="Jobs"
            title={job.title}
            lead={[job.company, postedLabel(job.created_at)].filter(Boolean).join(' · ')}
          />
          <div className="ui-stack">
            <div className="ui-card">
              <h2>The work</h2>
              <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{job.description || 'No description was added.'}</p>
            </div>
            <div className="ui-card">
              <h2>Details</h2>
              <div style={{ display: 'grid', gap: 14 }}>
                {facts.map((row) => (
                  <div key={row.k} style={{ minWidth: 0 }}>
                    <div className="ui-k">{row.k}</div>
                    <div style={{ color: '#fff', overflowWrap: 'anywhere' }}>{row.v}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="ui-card">
              <h2>States covered</h2>
              {job.states.length === 0 ? (
                <p className="ui-note">No extra states listed.</p>
              ) : (
                <div className="ui-chips">
                  {job.states.map((code) => (
                    <span key={code} className="ui-badge dim">{placeFor(code)?.name || code}</span>
                  ))}
                </div>
              )}
            </div>
            <div className="ui-card">
              <h2>Certs wanted</h2>
              {job.cert_types.length === 0 ? (
                <p className="ui-note">None listed.</p>
              ) : (
                <div className="ui-chips">
                  {job.cert_types.map((cert) => (
                    <span key={cert} className="ui-badge dim">{cert}</span>
                  ))}
                </div>
              )}
            </div>
            <ApplyBox jobId={job.id} posterId={job.poster_id} />
          </div>
        </div>
      </div>
    </>
  )
}
