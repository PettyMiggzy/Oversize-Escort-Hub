'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import SiteHeader from '@/components/SiteHeader'
import PageTitle from '@/components/PageTitle'
import { LABELS, PAY_MODELS } from '@/lib/jobs'
import { ALL_PLACE_CODES, CA_PLACE_CODES, placeFor, STATIC_STATE_CODES } from '@/lib/state-codes'

const CERTS = ['NY Cert', 'CSE (Ontario MTO)', 'BC Pilot Car', 'WITPAC', 'TWIC', 'AZ Cert', 'CTTS BC', 'CTTS AB', 'OAPC', 'Saskatchewan']

const PAY_UNIT: Record<(typeof PAY_MODELS)[number], string> = {
  percent: '%',
  weekly_flat: 'per week',
  day_rate: 'per day',
  per_mile: 'per mile',
  hourly: 'per hour',
  negotiable: '',
}

function Chip({ on, children, onClick }: { on: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      className={on ? 'ui-chip on' : 'ui-chip'}
      onClick={onClick}
      style={{ maxWidth: '100%', height: 'auto', whiteSpace: 'normal', textAlign: 'left' }}
    >
      {children}
    </button>
  )
}

function toggle(list: string[], value: string) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
}

export function PostJobForm() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [company, setCompany] = useState('')
  const [description, setDescription] = useState('')
  const [classification, setClassification] = useState('')
  const [equipment, setEquipment] = useState('')
  const [schedule, setSchedule] = useState('')
  const [travel, setTravel] = useState('')
  const [payModel, setPayModel] = useState('')
  const [payMin, setPayMin] = useState('')
  const [payMax, setPayMax] = useState('')
  const [payNote, setPayNote] = useState('')
  const [baseCity, setBaseCity] = useState('')
  const [baseState, setBaseState] = useState('')
  const [states, setStates] = useState<string[]>([])
  const [certs, setCerts] = useState<string[]>([])
  const [startDate, setStartDate] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  const showPay = payModel !== '' && payModel !== 'negotiable'
  const unit = showPay ? PAY_UNIT[payModel as (typeof PAY_MODELS)[number]] : ''

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    setError('')
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          company,
          description,
          classification,
          equipment,
          pay_model: payModel,
          pay_min: showPay ? payMin : null,
          pay_max: showPay ? payMax : null,
          pay_note: payNote,
          schedule,
          travel,
          base_city: baseCity,
          base_state: baseState,
          states,
          cert_types: certs,
          start_date: startDate || null,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || typeof data.id !== 'string') {
        setError(typeof data.error === 'string' ? data.error : 'Could not post the job')
        return
      }
      router.push(`/jobs/${data.id}`)
    } catch {
      setError('Could not post the job')
    } finally {
      setSending(false)
    }
  }

  function placeChips(codes: readonly string[]) {
    return codes.map((code) => (
      <Chip key={code} on={states.includes(code)} onClick={() => setStates((prev) => toggle(prev, code))}>
        {placeFor(code)?.name || code}
      </Chip>
    ))
  }

  return (
    <>
      <SiteHeader />
      <div className="ui-page">
        <div className="ui-wrap" style={{ maxWidth: 720 }}>
          <PageTitle
            eyebrow="Jobs"
            title="Post a job"
            lead="Say what the work is and how you pay. Do not put phone numbers or links in the post. Contact details are shared after you accept someone."
          />
          <form onSubmit={submit} className="ui-stack">
            <div className="ui-card">
              <h2>The job</h2>
              <div className="ui-stack">
                <div>
                  <label className="ui-label" htmlFor="job-title">Title</label>
                  <input id="job-title" className="ui-input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} required />
                </div>
                <div>
                  <label className="ui-label" htmlFor="job-company">Company</label>
                  <input id="job-company" className="ui-input" value={company} onChange={(e) => setCompany(e.target.value)} maxLength={120} />
                </div>
                <div>
                  <label className="ui-label" htmlFor="job-description">Description</label>
                  <textarea id="job-description" className="ui-textarea" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={3000} rows={6} />
                </div>
                <div>
                  <p className="ui-label">Classification</p>
                  <div className="ui-chips">
                    {Object.entries(LABELS.classification).map(([value, text]) => (
                      <Chip key={value} on={classification === value} onClick={() => setClassification(value)}>{text}</Chip>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="ui-label">Equipment</p>
                  <div className="ui-chips">
                    {Object.entries(LABELS.equipment).map(([value, text]) => (
                      <Chip key={value} on={equipment === value} onClick={() => setEquipment(value)}>{text}</Chip>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="ui-label">Schedule</p>
                  <div className="ui-chips">
                    {Object.entries(LABELS.schedule).map(([value, text]) => (
                      <Chip key={value} on={schedule === value} onClick={() => setSchedule(value)}>{text}</Chip>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="ui-card">
              <h2>Pay</h2>
              <div className="ui-stack">
                <div>
                  <p className="ui-label">How pay works</p>
                  <div className="ui-chips">
                    {Object.entries(LABELS.pay_model).map(([value, text]) => (
                      <Chip key={value} on={payModel === value} onClick={() => setPayModel(value)}>{text}</Chip>
                    ))}
                  </div>
                </div>
                {showPay ? (
                  <div className="ui-form-grid">
                    <div>
                      <label className="ui-label" htmlFor="pay-min">Low ({unit})</label>
                      <input id="pay-min" className="ui-input" inputMode="decimal" value={payMin} onChange={(e) => setPayMin(e.target.value)} />
                    </div>
                    <div>
                      <label className="ui-label" htmlFor="pay-max">High ({unit})</label>
                      <input id="pay-max" className="ui-input" inputMode="decimal" value={payMax} onChange={(e) => setPayMax(e.target.value)} />
                    </div>
                  </div>
                ) : null}
                <div>
                  <label className="ui-label" htmlFor="pay-note">Pay note</label>
                  <input id="pay-note" className="ui-input" value={payNote} onChange={(e) => setPayNote(e.target.value)} maxLength={200} />
                </div>
              </div>
            </div>

            <div className="ui-card">
              <h2>Where</h2>
              <div className="ui-stack">
                <div className="ui-city">
                  <div>
                    <label className="ui-label" htmlFor="base-city">Home city</label>
                    <input id="base-city" className="ui-input" value={baseCity} onChange={(e) => setBaseCity(e.target.value)} maxLength={80} />
                  </div>
                  <div>
                    <label className="ui-label" htmlFor="base-state">Home state</label>
                    <select id="base-state" className="ui-select" value={baseState} onChange={(e) => setBaseState(e.target.value)}>
                      <option value="">--</option>
                      {ALL_PLACE_CODES.map((code) => (
                        <option key={code} value={code}>{code}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <p className="ui-label">Travel</p>
                  <div className="ui-chips">
                    {Object.entries(LABELS.travel).map(([value, text]) => (
                      <Chip key={value} on={travel === value} onClick={() => setTravel(value)}>{text}</Chip>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="ui-label">States you cover</p>
                  <p className="ui-note" style={{ marginBottom: 8 }}>United States</p>
                  <div className="ui-chips">{placeChips(STATIC_STATE_CODES)}</div>
                  <p className="ui-note" style={{ margin: '12px 0 8px' }}>Canada</p>
                  <div className="ui-chips">{placeChips(CA_PLACE_CODES)}</div>
                </div>
              </div>
            </div>

            <div className="ui-card">
              <h2>Requirements</h2>
              <div className="ui-stack">
                <div>
                  <p className="ui-label">Certs wanted</p>
                  <div className="ui-chips">
                    {CERTS.map((cert) => (
                      <Chip key={cert} on={certs.includes(cert)} onClick={() => setCerts((prev) => toggle(prev, cert))}>{cert}</Chip>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="ui-label" htmlFor="start-date">Start date</label>
                  <input id="start-date" className="ui-input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
              </div>
            </div>

            {error ? (
              <div role="alert" style={{ border: '1px solid rgba(255,90,90,.55)', background: 'rgba(255,90,90,.08)', borderRadius: 12, padding: 12, color: '#ff8a8a' }}>
                {error}
              </div>
            ) : null}
            <button type="submit" className="ui-btn" disabled={sending}>{sending ? 'Posting…' : 'Post a job'}</button>
          </form>
        </div>
      </div>
    </>
  )
}
