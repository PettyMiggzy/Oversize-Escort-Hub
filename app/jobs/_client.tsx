'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import EmptyState from '@/components/EmptyState'
import { LABELS } from '@/lib/jobs'
import { ALL_PLACE_CODES, placeFor } from '@/lib/state-codes'

export type JobCard = {
  id: string
  title: string
  company: string | null
  pay: string
  classification: string
  equipment: string
  schedule: string
  pay_model: string
  base_city: string | null
  base_state: string | null
  states: string[]
  posted: string
}

const word = (group: keyof typeof LABELS, value: string) => {
  const map = LABELS[group] as Record<string, string>
  return map[value] || value
}

function matchesClassification(job: JobCard, filter: string) {
  if (!filter) return true
  if (job.classification === filter) return true
  return job.classification === 'either'
}

export function JobsBoard({ jobs }: { jobs: JobCard[] }) {
  const [state, setState] = useState('')
  const [classification, setClassification] = useState('')
  const [equipment, setEquipment] = useState('')
  const [schedule, setSchedule] = useState('')
  const [payModel, setPayModel] = useState('')

  const shown = useMemo(() => jobs.filter((job) => {
    if (state) {
      const code = state.toUpperCase()
      const covered = job.base_state === code || job.states.includes(code)
      if (!covered) return false
    }
    if (!matchesClassification(job, classification)) return false
    if (equipment && job.equipment !== equipment) return false
    if (schedule && job.schedule !== schedule) return false
    if (payModel && job.pay_model !== payModel) return false
    return true
  }), [jobs, state, classification, equipment, schedule, payModel])

  const place = (code: string | null) => {
    if (!code) return ''
    return placeFor(code)?.name || code
  }

  return (
    <>
      <div className="ui-filters">
        <select className="ui-select" aria-label="State" value={state} onChange={(e) => setState(e.target.value)}>
          <option value="">Any state</option>
          {ALL_PLACE_CODES.map((code) => (
            <option key={code} value={code}>{placeFor(code)?.name || code}</option>
          ))}
        </select>
        <select className="ui-select" aria-label="Classification" value={classification} onChange={(e) => setClassification(e.target.value)}>
          <option value="">1099 or W-2</option>
          <option value="1099">{LABELS.classification['1099']}</option>
          <option value="w2">{LABELS.classification.w2}</option>
        </select>
        <select className="ui-select" aria-label="Equipment" value={equipment} onChange={(e) => setEquipment(e.target.value)}>
          <option value="">Any equipment</option>
          {Object.entries(LABELS.equipment).map(([value, text]) => (
            <option key={value} value={value}>{text}</option>
          ))}
        </select>
        <select className="ui-select" aria-label="Schedule" value={schedule} onChange={(e) => setSchedule(e.target.value)}>
          <option value="">Any schedule</option>
          {Object.entries(LABELS.schedule).map(([value, text]) => (
            <option key={value} value={value}>{text}</option>
          ))}
        </select>
        <select className="ui-select" aria-label="Pay model" value={payModel} onChange={(e) => setPayModel(e.target.value)}>
          <option value="">Any pay</option>
          {Object.entries(LABELS.pay_model).map(([value, text]) => (
            <option key={value} value={value}>{text}</option>
          ))}
        </select>
      </div>

      {jobs.length === 0 ? (
        <EmptyState
          title="No open jobs right now"
          text="When a fleet or escort company posts a job, it shows up here."
          action={<Link href="/post-job" className="ui-btn">Post a job</Link>}
        />
      ) : shown.length === 0 ? (
        <EmptyState title="No jobs match these filters" text="Try another state, schedule, or pay." />
      ) : (
        <div className="ui-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))' }}>
          {shown.map((job) => {
            const where = [job.base_city, place(job.base_state) || job.base_state].filter(Boolean).join(', ')
            return (
              <Link key={job.id} href={`/jobs/${job.id}`} className="ui-load" style={{ textDecoration: 'none', color: 'inherit', minWidth: 0 }}>
                <div style={{ minWidth: 0 }}>
                  <div className="ui-route">{job.title}</div>
                  {job.company ? <div className="ui-meta" style={{ marginTop: 6 }}>{job.company}</div> : null}
                  <div className="ui-v or" style={{ fontSize: 18, marginTop: 10 }}>{job.pay}</div>
                  <div className="ui-chips" style={{ marginTop: 12 }}>
                    <span className="ui-badge orange">{word('classification', job.classification)}</span>
                    <span className="ui-badge dim">{word('equipment', job.equipment)}</span>
                  </div>
                  <div className="ui-meta" style={{ marginTop: 12 }}>
                    {where || 'Location not listed'}
                    {' · '}
                    {job.posted}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </>
  )
}
