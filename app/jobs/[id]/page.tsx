import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import SiteHeader from '@/components/SiteHeader'
import PageTitle from '@/components/PageTitle'
import { LABELS, payText } from '@/lib/jobs'
import { CA_PLACE_CODES, placeFor } from '@/lib/state-codes'
import { ApplyBox } from './apply-box'
import { loadOpenJob, postedLabel, type JobPost } from '../query'

export const revalidate = 300

type Props = { params: Promise<{ id: string }> }

const CANADA = new Set<string>(CA_PLACE_CODES)

function words(group: keyof typeof LABELS, value: string) {
  const map = LABELS[group] as Record<string, string>
  return map[value] || value
}

function employmentType(job: JobPost) {
  if (job.classification === '1099') return 'CONTRACTOR'
  if (job.schedule === 'full_time') return 'FULL_TIME'
  if (job.schedule === 'part_time') return 'PART_TIME'
  return 'OTHER'
}

function startText(iso: string | null) {
  if (!iso) return null
  const t = Date.parse(iso.slice(0, 10) + 'T00:00:00Z')
  if (!Number.isFinite(t)) return null
  return new Date(t).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'long', day: 'numeric', year: 'numeric' })
}

function jobPosting(job: JobPost) {
  const address: Record<string, string> = { '@type': 'PostalAddress' }
  if (job.base_city) address.addressLocality = job.base_city
  if (job.base_state) {
    address.addressRegion = job.base_state
    address.addressCountry = CANADA.has(job.base_state) ? 'CA' : 'US'
  }
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description || job.title,
    datePosted: job.created_at,
    validThrough: job.expires_at,
    employmentType: employmentType(job),
    hiringOrganization: { '@type': 'Organization', name: job.company || 'Hiring company' },
    jobLocation: { '@type': 'Place', address },
  }
  if (job.pay_model !== 'negotiable' && job.pay_model !== 'percent' && job.pay_min != null) {
    const unitText = ({ weekly_flat: 'WEEK', day_rate: 'DAY', hourly: 'HOUR', per_mile: 'MILE' } as Record<string, string>)[job.pay_model]
    data.baseSalary = {
      '@type': 'MonetaryAmount',
      currency: 'USD',
      value: {
        '@type': 'QuantitativeValue',
        minValue: job.pay_min,
        maxValue: job.pay_max ?? job.pay_min,
        ...(unitText ? { unitText } : {}),
      },
    }
  }
  return data
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

  const json = JSON.stringify(jobPosting(job)).replace(/</g, '\\u003c')

  return (
    <>
      <SiteHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
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
