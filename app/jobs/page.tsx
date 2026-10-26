import type { Metadata } from 'next'
import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'
import PageTitle from '@/components/PageTitle'
import { payText } from '@/lib/jobs'
import { JobsBoard, type JobCard } from './_client'
import { loadOpenJobs, postedLabel } from './query'

export const revalidate = 300

export const metadata: Metadata = {
  title: { absolute: 'Escort and pilot car jobs | Oversize Escort Hub' },
  description: 'Open escort and pilot car jobs posted by fleets and escort companies. Oversize Escort Hub is the marketplace, not the employer.',
  alternates: { canonical: '/jobs' },
}

export default async function JobsPage() {
  const jobs = await loadOpenJobs()
  const cards: JobCard[] = jobs.map((job) => ({
    id: job.id,
    title: job.title,
    company: job.company,
    pay: payText(job),
    classification: job.classification,
    equipment: job.equipment,
    schedule: job.schedule,
    pay_model: job.pay_model,
    base_city: job.base_city,
    base_state: job.base_state,
    states: job.states,
    posted: postedLabel(job.created_at),
  }))

  return (
    <>
      <SiteHeader />
      <div className="ui-page">
        <div className="ui-wrap">
          <PageTitle
            eyebrow="Jobs"
            title="Escort and pilot car jobs"
            lead="Fleets and escort companies post the work and the pay in their own words. Oversize Escort Hub is the marketplace, not the employer."
            right={<Link href="/post-job" className="ui-btn">Post a job</Link>}
          />
          <JobsBoard jobs={cards} />
        </div>
      </div>
    </>
  )
}
