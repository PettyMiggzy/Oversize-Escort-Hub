'use client'

import '@/app/globals.css'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import * as QRCode from 'qrcode'
import { createClient } from '@/lib/supabase/client'
import { isAdminEmail } from '@/lib/supabase'
import { isNativeApp } from '@/lib/native'
import { withFreeLaunch, effectiveTier } from '@/lib/free-launch'
import SiteHeader from '@/components/SiteHeader'
import PageTitle from '@/components/PageTitle'
import EmptyState from '@/components/EmptyState'
const BG = 'transparent'
const SURFACE = 'transparent'
const ORANGE = 'var(--ui-or)'
const TEXT = 'var(--ui-text)'
const MUTED = 'var(--ui-muted)'

interface Profile {
  availability_states?: string[] | null;
  tier?: string;
  email?: string;
  id: string
  role: string
  full_name: string | null
  company_name: string | null
  stripe_customer_id: string | null
  fmcsa_verified?: boolean | null
}

interface Load {
  id: string
  pu_city: string
  pu_state: string
  dl_city: string
  dl_state: string
  start_date: string | null
  status: string
  per_mile_rate?: number | null
  escort_type?: string | null
}

function loadLabel(load: { pu_city?: string | null; pu_state?: string | null; dl_city?: string | null; dl_state?: string | null } | null | undefined) {
  if (!load) return 'Load'
  const from = [load.pu_city, load.pu_state].filter(Boolean).join(', ')
  const to = [load.dl_city, load.dl_state].filter(Boolean).join(', ')
  if (from && to) return `${from} → ${to}`
  return from || to || 'Load'
}

interface Match {
  id: string
  load_id: string
  status: string
  loads: Load | null
  escort?: { full_name?: string; phone?: string; tier?: string; bgc_verified?: boolean } | null
}

function ShareProfileCard({ userId }: { userId: string }) {
  const url = `https://www.oversize-escort-hub.com/escorts/${userId}`
  const [svg, setSvg] = useState('')
  const [note, setNote] = useState('')
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  useEffect(() => {
    let live = true
    QRCode.toString(url, { type: 'svg', margin: 1 }).then((markup) => {
      if (!live) return
      const start = markup.indexOf('<svg')
      const body = start >= 0 ? markup.slice(start) : ''
      setSvg(body.replace('<svg ', '<svg width="180" height="180" '))
    }).catch(() => {
      if (live) setSvg('')
    })
    return () => { live = false }
  }, [url])

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setNote('Copied')
    } catch {
      try {
        const area = document.createElement('textarea')
        area.value = url
        area.setAttribute('readonly', '')
        area.style.position = 'fixed'
        area.style.left = '-9999px'
        document.body.appendChild(area)
        area.select()
        const ok = document.execCommand('copy')
        document.body.removeChild(area)
        setNote(ok ? 'Copied' : 'Select the link and copy it')
      } catch {
        setNote('Select the link and copy it')
      }
    }
  }

  async function share() {
    if (typeof navigator.share !== 'function') return
    try {
      await navigator.share({ url, title: 'My escort profile' })
    } catch {
      /* dismissed */
    }
  }

  return (
    <section className="ui-card">
      <h2>Share your profile</h2>
      <p className="ui-note">This link opens your public profile. Anyone with it can view the page.</p>
      <p style={{ margin: '12px 0 0', wordBreak: 'break-all', color: '#fff', fontWeight: 700 }}>{url}</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
        <button type="button" className="ui-btn" onClick={copy}>Copy</button>
        {canShare && (
          <button type="button" className="ui-btn ghost" onClick={share}>Share</button>
        )}
      </div>
      {note && <p className="ui-ok">{note}</p>}
      {svg && (
        <div
          style={{ marginTop: 16, background: '#fff', width: 196, padding: 8, borderRadius: 12, lineHeight: 0 }}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      )}
    </section>
  )
}

type MyJob = {
  id: string
  title: string
  status: string
  applications?: { total?: number; fresh?: number }
}

type JobApplicant = {
  id: string
  message: string | null
  status: string
  applicant: {
    full_name?: string | null
    tier?: string | null
    bgc_verified?: boolean | null
    p_evo_verified?: boolean | null
    pevo_verified?: boolean | null
    rating?: number | null
    avg_rating?: number | null
  } | null
}

const JOB_STATUS: Record<string, string> = {
  open: 'Open',
  filled: 'Filled',
  closed: 'Closed',
  removed: 'Removed',
  new: 'New',
  accepted: 'Accepted',
  declined: 'Declined',
  withdrawn: 'Withdrawn',
}

function jobStatus(value: string) {
  return JOB_STATUS[value] || value
}

type MyApplication = { id: string; job_id: string; status: string; message: string | null; created_at: string; job: { title: string; company: string | null; status: string } | null }

function MyApplications() {
  const [apps, setApps] = useState<MyApplication[] | null>(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState('')

  async function load() {
    const res = await fetch('/api/jobs/applications')
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      setErr(typeof data.error === 'string' ? data.error : 'Could not load your applications')
      setApps([])
      return
    }
    setApps(Array.isArray(data.applications) ? data.applications : [])
  }

  useEffect(() => { load().catch(() => setErr('Could not load your applications')) }, [])

  async function withdraw(id: string) {
    setBusy(id)
    setErr('')
    try {
      const res = await fetch(`/api/jobs/applications/${id}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'withdraw' }) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) setErr(typeof data.error === 'string' ? data.error : 'Could not withdraw')
      await load()
    } finally {
      setBusy('')
    }
  }

  // Nothing to show and nothing wrong: keep the dashboard quiet for people who never applied
  if (apps !== null && apps.length === 0 && !err) return null
  return (
    <section>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', margin: '0 0 1rem' }}>My applications</h2>
      {err ? <p className="ui-err">{err}</p> : null}
      {apps === null ? <p className="ui-meta">Loading your applications…</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {apps.map((a) => (
            <div key={a.id} className="ui-load">
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 700 }}>{a.job?.title || 'This job is no longer listed'}</p>
                <div className="ui-chips" style={{ marginTop: 8 }}>
                  <span className={a.status === 'accepted' ? 'ui-badge green' : 'ui-badge dim'}>{jobStatus(a.status)}</span>
                  {a.job?.company ? <span className="ui-badge dim">{a.job.company}</span> : null}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {a.job && a.job.status === 'open' ? <a className="ui-btn ghost" href={`/jobs/${a.job_id}`}>View job</a> : null}
                {a.status === 'new' ? <button type="button" className="ui-btn ghost" disabled={busy === a.id} onClick={() => withdraw(a.id)}>Withdraw</button> : null}
                {a.status === 'accepted' ? <ApplicantContact applicationId={a.id} /> : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function ApplicantContact({ applicationId }: { applicationId: string }) {
  const [info, setInfo] = useState<null | 'loading' | { name: string; phone: string; email: string; error: string }>(null)

  async function load() {
    setInfo('loading')
    try {
      const res = await fetch(`/api/jobs/contact?applicationId=${encodeURIComponent(applicationId)}`)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setInfo({ name: '', phone: '', email: '', error: typeof data.error === 'string' ? data.error : 'Could not load contact details' })
        return
      }
      setInfo({
        name: typeof data.name === 'string' ? data.name : '',
        phone: typeof data.phone === 'string' ? data.phone : '',
        email: typeof data.email === 'string' ? data.email : '',
        error: '',
      })
    } catch {
      setInfo({ name: '', phone: '', email: '', error: 'Could not load contact details' })
    }
  }

  if (!info) {
    return <button type="button" className="ui-btn ghost" onClick={load}>Contact</button>
  }
  if (info === 'loading') return <p className="ui-meta">Loading contact…</p>
  if (info.error) return <p className="ui-err">{info.error}</p>
  return (
    <div className="ui-note">
      {info.name ? <div style={{ color: '#fff', fontWeight: 700 }}>{info.name}</div> : null}
      <div>{info.phone ? <a className="ui-link" href={`tel:${info.phone}`}>{info.phone}</a> : 'No phone listed'}</div>
      <div>{info.email ? <a className="ui-link" href={`mailto:${info.email}`}>{info.email}</a> : 'No email listed'}</div>
    </div>
  )
}

function MyJobsSection() {
  const [jobs, setJobs] = useState<MyJob[] | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const [apps, setApps] = useState<Record<string, JobApplicant[]>>({})
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState('')

  async function load() {
    const res = await fetch('/api/jobs')
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      setErr(typeof data.error === 'string' ? data.error : 'Could not load your jobs')
      setJobs([])
      return
    }
    setJobs(Array.isArray(data.jobs) ? data.jobs : [])
  }

  useEffect(() => { load().catch(() => setErr('Could not load your jobs')) }, [])

  async function act(id: string, action: 'close' | 'filled' | 'reopen') {
    setBusy(id + action)
    setErr('')
    try {
      const res = await fetch(`/api/jobs/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErr(typeof data.error === 'string' ? data.error : 'Could not update the job')
        return
      }
      await load()
    } catch {
      setErr('Could not update the job')
    } finally {
      setBusy('')
    }
  }

  async function loadApps(id: string) {
    setErr('')
    try {
      const res = await fetch(`/api/jobs/${id}/applications`)
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErr(typeof data.error === 'string' ? data.error : 'Could not load applicants')
        setApps((prev) => ({ ...prev, [id]: [] }))
        return
      }
      setApps((prev) => ({ ...prev, [id]: Array.isArray(data.applications) ? data.applications : [] }))
    } catch {
      setErr('Could not load applicants')
    }
  }

  function expand(id: string) {
    if (openId === id) { setOpenId(null); return }
    setOpenId(id)
    loadApps(id)
  }

  async function decide(jobId: string, appId: string, action: 'accept' | 'decline') {
    setBusy(appId)
    setErr('')
    try {
      const res = await fetch(`/api/jobs/applications/${appId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErr(typeof data.error === 'string' ? data.error : 'Could not update the application')
        return
      }
      await load()
      await loadApps(jobId)
    } catch {
      setErr('Could not update the application')
    } finally {
      setBusy('')
    }
  }

  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', margin: 0 }}>My jobs</h2>
        <a href="/post-job" className="ui-btn ghost">Post a job</a>
      </div>
      {err ? <p className="ui-err">{err}</p> : null}
      {jobs === null ? (
        <p className="ui-meta">Loading your jobs…</p>
      ) : jobs.length === 0 ? (
        <EmptyState title="No jobs posted" text="Jobs you post show up here, with the people who apply." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {jobs.map((job) => {
            const fresh = job.applications?.fresh || 0
            const total = job.applications?.total || 0
            const open = openId === job.id
            const people = apps[job.id]
            return (
              <div key={job.id} className="ui-load">
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 700 }}>{job.title}</p>
                  <div className="ui-chips" style={{ marginTop: 8 }}>
                    <span className="ui-badge dim">{jobStatus(job.status)}</span>
                    <span className="ui-badge dim">{total} applicant{total === 1 ? '' : 's'}</span>
                    {fresh > 0 ? <span className="ui-badge orange">{fresh} new</span> : null}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {job.status === 'open' ? (
                    <>
                      <button type="button" className="ui-btn ghost" disabled={busy === job.id + 'close'} onClick={() => act(job.id, 'close')}>Close</button>
                      <button type="button" className="ui-btn ghost" disabled={busy === job.id + 'filled'} onClick={() => act(job.id, 'filled')}>Mark filled</button>
                    </>
                  ) : null}
                  {job.status === 'closed' || job.status === 'filled' ? (
                    <button type="button" className="ui-btn ghost" disabled={busy === job.id + 'reopen'} onClick={() => act(job.id, 'reopen')}>Reopen</button>
                  ) : null}
                  <button type="button" className="ui-btn" onClick={() => expand(job.id)}>{open ? 'Hide applicants' : 'Applicants'}</button>
                </div>
                {open ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {!people ? <p className="ui-meta">Loading applicants…</p> : null}
                    {people && people.length === 0 ? <p className="ui-note">No applicants yet.</p> : null}
                    {people?.map((app) => {
                      const person = app.applicant
                      const rating = person?.avg_rating ?? person?.rating
                      const pevo = Boolean(person?.p_evo_verified || person?.pevo_verified)
                      return (
                        <div key={app.id} style={{ borderTop: '1px solid rgba(255,255,255,.1)', paddingTop: 10 }}>
                          <p style={{ margin: 0, fontWeight: 700 }}>{person?.full_name || 'Applicant'}</p>
                          <div className="ui-chips" style={{ marginTop: 8 }}>
                            {person?.tier ? <span className="ui-badge dim">{person.tier}</span> : null}
                            {person?.bgc_verified ? <span className="ui-badge green">BGC</span> : null}
                            {pevo ? <span className="ui-badge blue">P/EVO</span> : null}
                            {typeof rating === 'number' ? <span className="ui-badge dim">Rating {Number(rating).toFixed(1)}</span> : null}
                            <span className={app.status === 'new' ? 'ui-badge orange' : 'ui-badge dim'}>{jobStatus(app.status)}</span>
                          </div>
                          {app.message ? <p className="ui-note" style={{ marginTop: 8 }}>{app.message}</p> : null}
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                            {app.status === 'new' ? (
                              <>
                                <button type="button" className="ui-btn" disabled={busy === app.id} onClick={() => decide(job.id, app.id, 'accept')}>Accept</button>
                                <button type="button" className="ui-btn ghost" disabled={busy === app.id} onClick={() => decide(job.id, app.id, 'decline')}>Decline</button>
                              </>
                            ) : null}
                            {app.status === 'accepted' ? <ApplicantContact applicationId={app.id} /> : null}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

export function DashboardPageClient() {
  const [inApp, setInApp] = useState(false)
  useEffect(() => { setInApp(isNativeApp()) }, [])
  const supabase = createClient()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loads, setLoads] = useState<Load[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [completedLoads, setCompletedLoads] = useState<Load[]>([])
  const [bids, setBids] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [actionMsg, setActionMsg] = useState('')
  const [deadheadModal, setDeadheadModal] = useState<{loadId: string} | null>(null)
  const [dhCity, setDhCity] = useState('')
  const [dhState, setDhState] = useState('')
  const [dhSubmitting, setDhSubmitting] = useState(false)
  const [deadheadOpps, setDeadheadOpps] = useState<any[]>([])

  useEffect(() => {
    const init = async () => {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search)
    if (params.get('upgraded') === 'true') {
      setActionMsg('Subscription activated! Your account has been upgraded.')
      setTimeout(() => setActionMsg(''), 5000)
      window.history.replaceState({}, '', window.location.pathname)
    }
  }
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/signin')
        return
      }
      const uid = user.id

      const meRes = await fetch('/api/profile/me')
      const meBody = await meRes.json().catch(() => ({}))
      const prof = meRes.ok ? meBody.profile : null

      if (!prof) {
        setLoading(false)
        return
      }
      if (prof.role === 'fleet_manager') {
        router.replace('/fleet-dashboard')
        return
      }
      setProfile(withFreeLaunch(prof))

      const { count } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', uid)
        .eq('read', false)
      setUnreadCount(count ?? 0)

      if (prof.role === 'carrier' || prof.role === 'admin') {
        const { data: openLoads } = await supabase
          .from('loads')
          .select('*')
          .eq('carrier_id', uid)
          .eq('status', 'open')
          .order('created_at', { ascending: false })
        setLoads(openLoads ?? [])

        // Fetch pending bids for carrier's open loads
        const loadIds = (openLoads ?? []).map((l: any) => l.id)
        if (loadIds.length > 0) {
          const { data: bidsData } = await supabase
            .from('bids')
            .select('*, profiles!escort_id(full_name, bgc_verified, rating)')
            .in('load_id', loadIds)
            .eq('status', 'pending')
            .order('rate', { ascending: false })
          setBids(bidsData ?? [])
        } else {
          setBids([])
        }

        // Pending matches = the carrier's own loads an escort has claimed
        // (status 'pending_match', escort in matched_escort_id). Single source
        // of truth is the loads table; we shape rows to the Match interface.
        const { data: pendingLoads } = await supabase
          .from('loads')
          .select('*, escort:profiles!matched_escort_id(full_name, tier, bgc_verified)')
          .eq('carrier_id', uid)
          .eq('status', 'pending_match')
          .order('match_requested_at', { ascending: false })
        setMatches((pendingLoads ?? []).map((l: any) => ({
          id: l.id, load_id: l.id, status: l.status, loads: l, escort: l.escort ?? null,
        })))

        const { data: done } = await supabase
          .from('loads')
          .select('*')
          .eq('carrier_id', uid)
          .eq('status', 'filled')
          .order('created_at', { ascending: false })
          .limit(10)
        setCompletedLoads(done ?? [])
      }

      // Deadhead exclusive window: open loads stamped within the last 5 minutes
      // (boards hide these; Pro/Fleet see them here).
      const deadheadTiers = new Set(['pro', 'fleet_starter', 'fleet_plus', 'fleet_pro'])
      if (
        (prof.role === 'escort' || prof.role === 'fleet_manager') &&
        (deadheadTiers.has(effectiveTier(prof.tier, prof.role) ?? '') || isAdminEmail(prof.email))
      ) {
        const since = new Date(Date.now() - 5 * 60 * 1000).toISOString()
        const { data: dhLoads } = await supabase
          .from('loads')
          .select('id, pu_city, pu_state, dl_city, dl_state, per_mile_rate, escort_type, deadhead_notified_at')
          .eq('status', 'open')
          .not('deadhead_notified_at', 'is', null)
          .gte('deadhead_notified_at', since)
          .order('deadhead_notified_at', { ascending: false })
          .limit(20)
        setDeadheadOpps(dhLoads ?? [])
      }

      setLoading(false)
    }
    init()
  }, [router])

  const refreshBids = async () => {
    const loadIds = loads.map(l => l.id)
    if (loadIds.length === 0) { setBids([]); return }
    const { data } = await supabase
      .from('bids')
      .select('*, profiles!escort_id(full_name, bgc_verified, rating)')
      .in('load_id', loadIds)
      .eq('status', 'pending')
      .order('rate', { ascending: false })
    setBids(data ?? [])
  }

  const handleBidAccept = async (bid: any) => {
    setActionMsg('')
    const res = await fetch('/api/bids/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ load_id: bid.load_id, bid_id: bid.id, escort_id: bid.escort_id }),
    })
    if (res.ok) {
      setActionMsg('Bid accepted — escort notified.')
      await refreshBids()
    } else {
      const data = await res.json().catch(() => ({}))
      setActionMsg('Error: ' + (data.error || 'Failed to accept bid'))
    }
  }

  const handleBidReject = async (bid: any) => {
    setActionMsg('')
    const res = await fetch('/api/bids/reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bid_id: bid.id, load_id: bid.load_id }),
    })
    if (res.ok) {
      setActionMsg('Bid rejected.')
      await refreshBids()
    } else {
      const data = await res.json().catch(() => ({}))
      setActionMsg('Error: ' + (data.error || 'Failed to reject bid'))
    }
  }

  const handleMatchAction = async (matchId: string, action: 'accept' | 'decline', loadId?: string) => {
    setActionMsg('')
    if (!loadId || !profile?.id) {
      setActionMsg('Action failed. Please try again.')
      return
    }
    const res = await fetch('/api/loads/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ load_id: loadId, action, carrier_id: profile.id }),
    })
    if (res.ok) {
      setMatches(prev => prev.filter(m => m.id !== matchId))
      setActionMsg(`Match ${action}ed.`)
      // /api/loads/match auto-fills the deadhead destination from the load's
      // drop-off on accept; offer the carrier a chance to override it.
      if (action === 'accept') {
        setDeadheadModal({ loadId })
      }
    } else {
      setActionMsg('Action failed. Please try again.')
    }
  }

  const handleStripePortal = async () => {
    const res = await fetch('/api/stripe/portal', { method: 'POST' })
    if (res.ok) {
      const { url } = await res.json()
      if (url) window.location.href = url
    }
  }

  // DOT lookup (E2)
  const [dotInput, setDotInput] = useState('')
  const [dotLoading, setDotLoading] = useState(false)
  const [dotResult, setDotResult] = useState<any>(null)
  const [dotErr, setDotErr] = useState<string | null>(null)
  const [fmcsaVerifying, setFmcsaVerifying] = useState(false)

  const handleDotLookup = async () => {
    const dot = dotInput.trim()
    if (!dot) { setDotErr('Enter a DOT number.'); return }
    setDotLoading(true); setDotErr(null); setDotResult(null)
    try {
      const res = await fetch(`/api/fmcsa?dot=${encodeURIComponent(dot)}`)
      const data = await res.json()
      if (!res.ok || data?.verified === false) {
        setDotErr(data?.reason || data?.error || 'Lookup failed')
      } else {
        setDotResult(data)
      }
    } catch (e: any) {
      setDotErr(e?.message || 'Lookup failed')
    } finally {
      setDotLoading(false)
    }
  }

  const handleMarkFmcsaVerified = async () => {
    if (!profile) return
    setFmcsaVerifying(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          fmcsa_verified: true,
          dot_number: dotResult?.dotNumber ?? null,
          mc_number: dotResult?.mcNumber ?? null,
          company_name: profile.company_name || dotResult?.legalName || null,
        })
        .eq('id', profile.id)
      if (error) { setDotErr(error.message); return }
      setProfile({ ...profile, company_name: profile.company_name || dotResult?.legalName || null, fmcsa_verified: true })
      setActionMsg('FMCSA verified — profile updated.')
    } finally {
      setFmcsaVerifying(false)
    }
  }

  // Invoice download (E3)
  const handleDownloadInvoice = async (loadId: string) => {
    try {
      const res = await fetch('/api/invoices/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ load_id: loadId }),
      })
      const { pdf, error } = await res.json()
      if (!res.ok || !pdf) { setActionMsg(error || 'Invoice failed'); return }
      const link = document.createElement('a')
      link.href = pdf
      link.download = `OEH-Invoice-${loadId.slice(0, 8)}.pdf`
      link.click()
    } catch (e: any) {
      setActionMsg(e?.message || 'Invoice failed')
    }
  }

  // ==== ESCORT DASHBOARD STATE ====
  const [escortJobs, setEscortJobs] = useState<any[]>([])
  const [earnings, setEarnings] = useState<{month: number; lifetime: number; jobsCount: number} | null>(null)
  const [expenses, setExpenses] = useState<any[]>([])
  const [expKind, setExpKind] = useState<'mileage'|'fuel'|'lodging'|'meal'|'toll'|'other'>('mileage')
  const [expAmount, setExpAmount] = useState('')
  const [expMiles, setExpMiles] = useState('')
  const [expNote, setExpNote] = useState('')
  const [expSubmitting, setExpSubmitting] = useState(false)
  const [breakdownOn, setBreakdownOn] = useState<boolean>(false)
  const [breakdownSaving, setBreakdownSaving] = useState(false)

  useEffect(() => {
    if (!profile) return
    if (!(profile.role === 'escort' || profile.role === 'pro' || (profile as any).tier === 'pro')) return
    const loadEscort = async () => {
      const { data: acceptedBids } = await supabase
        .from('bids')
        .select('id, rate, created_at, load_id, status, loads:load_id(id, pu_city, pu_state, dl_city, dl_state, start_date, status)')
        .eq('escort_id', profile.id)
        .eq('status', 'accepted')
        .order('created_at', { ascending: false })
      setEscortJobs(acceptedBids ?? [])
      try {
        const r = await fetch('/api/escort/earnings'); const d = await r.json()
        if (r.ok) setEarnings({ month: d.month, lifetime: d.lifetime, jobsCount: d.jobsCount })
      } catch {}
      try {
        const r = await fetch('/api/expenses'); const d = await r.json()
        if (r.ok) setExpenses(d.expenses ?? [])
      } catch {}
      setBreakdownOn(Boolean((profile as any).breakdown_protocol_enabled))
    }
    loadEscort()
  }, [profile])

  const handleAddExpense = async () => {
    setActionMsg('')
    if (!expAmount) { setActionMsg('Amount required'); return }
    setExpSubmitting(true)
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: expKind, amount: Number(expAmount), miles: expMiles || null, note: expNote || null }),
      })
      const d = await res.json()
      if (!res.ok) { setActionMsg(d.error || 'Failed to add expense'); return }
      setExpenses(prev => [d.expense, ...prev])
      setExpAmount(''); setExpMiles(''); setExpNote('')
      setActionMsg('Expense saved.')
    } finally { setExpSubmitting(false) }
  }

  const handleDeleteExpense = async (id: string) => {
    const res = await fetch('/api/expenses?id=' + encodeURIComponent(id), { method: 'DELETE' })
    if (res.ok) setExpenses(prev => prev.filter(e => e.id !== id))
  }

  const handleToggleBreakdown = async () => {
    setBreakdownSaving(true)
    const next = !breakdownOn
    try {
      const res = await fetch('/api/escort/breakdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: next }),
      })
      if (res.ok) setBreakdownOn(next)
      else setActionMsg('Failed to update breakdown protocol')
    } finally { setBreakdownSaving(false) }
  }


  if (loading) {
    return (
      <>
        <SiteHeader />
        <div className="ui-page"><div className="ui-wrap" style={{ textAlign: 'center' }}><p className="ui-meta">Loading dashboard…</p></div></div>
      </>
    )
  }

  if (!profile) {
    return (
      <>
        <SiteHeader />
        <div className="ui-page"><div className="ui-wrap"><EmptyState title="We could not load your profile" text="Please refresh the page or sign in again." /></div></div>
      </>
    )
  }

  const isCarrier = profile.role === 'carrier' || profile.role === 'admin'
  const isEscort = profile.role === 'escort' || profile.role === 'pro' || (profile as any).tier === 'pro'
  const isPro = profile.tier === 'pro' || profile.tier === 'fleet_pro' || profile.role === 'pro'

  return (
    <>
    <SiteHeader />
    <div className="ui-page">
    <div className="ui-wrap">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <PageTitle eyebrow="Account" title="Dashboard" lead={`${profile.full_name || profile.company_name || 'Welcome'} — ${profile.role}${isPro ? ' • Pro' : ''}`} />
        {unreadCount > 0 && (
          <div style={{ background: ORANGE, color: '#000', borderRadius: '9999px', padding: '4px 12px', fontWeight: 700, fontSize: '0.875rem' }}>
            {unreadCount} unread
          </div>
        )}
      </div>

      {actionMsg && (
        <div style={{ background: SURFACE, border: `1px solid ${ORANGE}`, borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1.5rem', color: ORANGE }}>
          {actionMsg}
        </div>
      )}

      {/* CARRIER VIEW */}
      {isCarrier && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Verify DOT Number (E2) */}
          <section className="ui-load">
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', marginBottom: '0.75rem' }}>Verify DOT Number</h2>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <input
                value={dotInput}
                onChange={(e) => setDotInput(e.target.value)}
                placeholder="Enter DOT number"
                style={{ flex: 1, minWidth: 180, background: BG, border: '1px solid rgba(255,255,255,.12)', borderRadius: 6, color: TEXT, padding: '12px 14px', fontSize: 16, minHeight: 44 }}
              />
              <button
                onClick={handleDotLookup}
                disabled={dotLoading}
                style={{ background: ORANGE, color: '#000', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 700, cursor: dotLoading ? 'default' : 'pointer', fontSize: 13 }}
              >
                {dotLoading ? 'Looking up…' : 'Look Up'}
              </button>
            </div>
            {dotErr && <p style={{ color: '#fca5a5', fontSize: 12, marginTop: '0.5rem' }}>{dotErr}</p>}
            {dotResult && (
              <div style={{ marginTop: '0.75rem', fontSize: 13, color: TEXT, display: 'grid', gap: 4 }}>
                <div><strong>{dotResult.legalName || '—'}</strong></div>
                <div style={{ color: MUTED }}>DOT: {dotResult.dotNumber || '—'} | MC: {dotResult.mcNumber || '—'}</div>
                <div style={{ color: MUTED }}>Status: {dotResult.operatingStatus || '—'}{dotResult.outOfService ? ` (OOS since ${dotResult.outOfService})` : ''}</div>
                {dotResult.operatingStatus === 'active' && !profile?.fmcsa_verified && (
                  <button
                    onClick={handleMarkFmcsaVerified}
                    disabled={fmcsaVerifying}
                    style={{ marginTop: 6, background: 'transparent', color: ORANGE, border: `1px solid ${ORANGE}`, borderRadius: 6, padding: '6px 12px', cursor: fmcsaVerifying ? 'default' : 'pointer', fontSize: 12, fontWeight: 600, alignSelf: 'flex-start' }}
                  >
                    {fmcsaVerifying ? 'Updating…' : 'Mark as FMCSA Verified'}
                  </button>
                )}
                {profile?.fmcsa_verified && (
                  <div style={{ color: '#22c55e', fontSize: 12, marginTop: 4 }}>✓ Already FMCSA verified</div>
                )}
              </div>
            )}
          </section>
          {/* Active Loads */}
          <section>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', marginBottom: '1rem' }}>
              Active Loads ({loads.length})
            </h2>
            {loads.length === 0 ? (
              <EmptyState title="No active loads" text="Loads you have posted or been matched to show up here." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {loads.map(load => (
                  <div key={load.id} className="ui-load">
                    <p style={{ margin: 0, fontWeight: 600 }}>{loadLabel(load)}</p>
                    <p style={{ margin: '4px 0 0', color: MUTED, fontSize: '0.875rem' }}>
                      {load.pu_city}, {load.pu_state} → {load.dl_city}, {load.dl_state}
                    </p>
                    <p style={{ margin: '4px 0 0', color: MUTED, fontSize: '0.875rem' }}>Needed: {load.start_date || '—'}</p>
                    <div style={{ marginTop: 8 }}>
                      <button onClick={() => handleDownloadInvoice(load.id)} style={{ fontSize: 11, color: 'var(--ui-or)', background: 'none', border: '1px solid var(--ui-or)', borderRadius: 4, padding: '3px 10px', cursor: 'pointer' }}>
                        📄 Invoice
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <><MyJobsSection /><MyApplications /></>

          {/* Pending Bids */}
          <section>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', marginBottom: '1rem' }}>
              Pending Bids ({bids.length})
            </h2>
            {bids.length === 0 ? (
              <EmptyState title="No pending bids" text="When escorts bid on your loads, you will see every bid here." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {bids.map((bid: any) => {
                  const load = loads.find(l => l.id === bid.load_id)
                  const prof = bid.profiles || {}
                  return (
                    <div key={bid.id} className="ui-load">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                        <div>
                          <p style={{ margin: 0, fontWeight: 600 }}>
                            {prof.full_name || 'Escort'}
                            {prof.bgc_verified && (
                              <span style={{ marginLeft: 8, fontSize: 11, color: '#22c55e', border: '1px solid #22c55e', borderRadius: 4, padding: '2px 6px' }}>✓ BGC</span>
                            )}
                          </p>
                          <p style={{ margin: '4px 0 0', color: MUTED, fontSize: '0.875rem' }}>
                            {load ? loadLabel(load) : 'Load'}
                          </p>
                          {prof.rating != null && (
                            <p style={{ margin: '4px 0 0', color: MUTED, fontSize: '0.875rem' }}>★ {Number(prof.rating).toFixed(1)}</p>
                          )}
                          {bid.note && (
                            <p style={{ margin: '4px 0 0', color: TEXT, fontSize: '0.875rem', fontStyle: 'italic' }}>"{bid.note}"</p>
                          )}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ margin: 0, fontWeight: 700, fontSize: '1.25rem', color: ORANGE }}>${bid.rate}</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                        <button
                          onClick={() => handleBidAccept(bid)}
                          style={{ background: '#22c55e', color: '#000', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 700, cursor: 'pointer' }}
                        >✓ Accept</button>
                        <button
                          onClick={() => handleBidReject(bid)}
                          style={{ background: 'transparent', color: '#ef4444', border: '1px solid #ef4444', borderRadius: 6, padding: '8px 16px', fontWeight: 600, cursor: 'pointer' }}
                        >✗ Reject</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          {/* Pending Matches */}
          <section>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', marginBottom: '1rem' }}>
              Pending Matches ({matches.length})
            </h2>
            {matches.length === 0 ? (
              <EmptyState title="No pending matches" text="Match requests from escorts wait here for you to confirm." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {matches.map(match => (
                  <div key={match.id} className="ui-load">
                    <p style={{ margin: 0, fontWeight: 600 }}>{loadLabel(match.loads)}</p>
                    {match.loads && (
                      <p style={{ margin: '4px 0 0', color: MUTED, fontSize: '0.875rem' }}>
                        {match.loads.pu_city}, {match.loads.pu_state} → {match.loads.dl_city}, {match.loads.dl_state}
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                      <button
                        onClick={() => handleMatchAction(match.id, 'accept', match.load_id)}
                        style={{ background: ORANGE, color: '#000', border: 'none', borderRadius: 6, padding: '6px 16px', fontWeight: 700, cursor: 'pointer' }}
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleMatchAction(match.id, 'decline', match.load_id)}
                        style={{ background: 'transparent', color: MUTED, border: `1px solid ${MUTED}`, borderRadius: 6, padding: '6px 16px', cursor: 'pointer' }}
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Completed Loads */}
          <section>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', marginBottom: '1rem' }}>
              Completed Loads ({completedLoads.length})
            </h2>
            {completedLoads.length === 0 ? (
              <EmptyState title="No completed loads yet" text="Finished jobs and their invoices will be listed here." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {completedLoads.map(load => (
                  <div key={load.id} className="ui-load" style={{ opacity: 0.75 }}>
                    <p style={{ margin: 0, fontWeight: 600 }}>{loadLabel(load)}</p>
                    <p style={{ margin: '4px 0 0', color: MUTED, fontSize: '0.875rem' }}>
                      {load.pu_city}, {load.pu_state} → {load.dl_city}, {load.dl_state}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* ESCORT / PRO VIEW */}
      {isEscort && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {(!Array.isArray(profile.availability_states) || profile.availability_states.length === 0) && (
            <section className="ui-card warn">
              <h2>Add the states you cover</h2>
              <p className="ui-note">Right now no states are set on your profile. Add them to get load alerts for your area and to show up when carriers look for escorts in your state.</p>
              <div style={{ marginTop: 14 }}><a href="/available" className="ui-btn">Choose my states</a></div>
            </section>
          )}
          <ShareProfileCard userId={profile.id} />
          {/* Earnings */}
          <section>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', marginBottom: '1rem' }}>Earnings</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
              <div className="ui-load">
                <p style={{ margin: 0, color: MUTED, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 1 }}>Est. this month</p>
                <p style={{ margin: '6px 0 0', fontSize: '1.5rem', fontWeight: 700, color: ORANGE }}>${earnings ? earnings.month.toFixed(2) : '0.00'}</p>
              </div>
              <div className="ui-load">
                <p style={{ margin: 0, color: MUTED, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 1 }}>Est. lifetime</p>
                <p style={{ margin: '6px 0 0', fontSize: '1.5rem', fontWeight: 700, color: ORANGE }}>${earnings ? earnings.lifetime.toFixed(2) : '0.00'}</p>
              </div>
              <div className="ui-load">
                <p style={{ margin: 0, color: MUTED, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 1 }}>Jobs accepted</p>
                <p style={{ margin: '6px 0 0', fontSize: '1.5rem', fontWeight: 700, color: ORANGE }}>{earnings ? earnings.jobsCount : 0}</p>
              </div>
            </div>
          </section>

          {/* Active Jobs */}
          <section>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', marginBottom: '1rem' }}>Active Jobs ({escortJobs.length})</h2>
            {escortJobs.length === 0 ? (
              <p style={{ color: MUTED }}>No active jobs. <a href="/loads" style={{ color: ORANGE }}>Browse available loads →</a></p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {escortJobs.map((bid: any) => {
                  const ld = bid.loads || {}
                  return (
                    <div key={bid.id} className="ui-load">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                        <div>
                          <p style={{ margin: 0, fontWeight: 600 }}>{loadLabel(ld)}</p>
                          <p style={{ margin: '4px 0 0', color: MUTED, fontSize: '0.875rem' }}>
                            {ld.pu_city || '—'}, {ld.pu_state || ''} → {ld.dl_city || '—'}, {ld.dl_state || ''}
                          </p>
                          {ld.start_date && <p style={{ margin: '4px 0 0', color: MUTED, fontSize: '0.875rem' }}>Needed: {ld.start_date}</p>}
                        </div>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: '1.25rem', color: ORANGE }}>${Number(bid.rate).toFixed(2)}</p>
                      </div>
                      {ld.id && (
                        <div style={{ marginTop: 8 }}>
                          <button onClick={() => handleDownloadInvoice(ld.id)} style={{ fontSize: 11, color: ORANGE, background: 'none', border: '1px solid ' + ORANGE, borderRadius: 4, padding: '3px 10px', cursor: 'pointer' }}>
                            📄 Invoice
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          <><MyJobsSection /><MyApplications /></>

          {/* Mileage / Expense Tracker */}
          <section>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', marginBottom: '1rem' }}>Mileage &amp; Expenses</h2>
            <div className="ui-load">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.5rem' }}>
                <select value={expKind} onChange={e => setExpKind(e.target.value as any)} style={{ background: BG, border: '1px solid rgba(255,255,255,.12)', borderRadius: 6, color: TEXT, padding: '8px', fontSize: 13 }}>
                  <option value="mileage">Mileage</option>
                  <option value="fuel">Fuel</option>
                  <option value="lodging">Lodging</option>
                  <option value="meal">Meal</option>
                  <option value="toll">Toll</option>
                  <option value="other">Other</option>
                </select>
                <input value={expAmount} onChange={e => setExpAmount(e.target.value)} placeholder="Amount $" type="number" step="0.01" style={{ background: BG, border: '1px solid rgba(255,255,255,.12)', borderRadius: 6, color: TEXT, padding: '8px', fontSize: 13 }} />
                <input value={expMiles} onChange={e => setExpMiles(e.target.value)} placeholder="Miles (opt)" type="number" style={{ background: BG, border: '1px solid rgba(255,255,255,.12)', borderRadius: 6, color: TEXT, padding: '8px', fontSize: 13 }} />
                <input value={expNote} onChange={e => setExpNote(e.target.value)} placeholder="Note" style={{ background: BG, border: '1px solid rgba(255,255,255,.12)', borderRadius: 6, color: TEXT, padding: '8px', fontSize: 13 }} />
                <button onClick={handleAddExpense} disabled={expSubmitting} style={{ background: ORANGE, color: '#000', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 700, cursor: expSubmitting ? 'default' : 'pointer', fontSize: 13 }}>
                  {expSubmitting ? 'Saving…' : 'Add'}
                </button>
              </div>
              {expenses.length > 0 && (
                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {expenses.map((ex: any) => (
                    <div key={ex.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: BG, borderRadius: 6, border: '1px solid rgba(255,255,255,.12)' }}>
                      <div style={{ fontSize: 13 }}>
                        <strong style={{ color: ORANGE, textTransform: 'capitalize' }}>{ex.kind}</strong>
                        <span style={{ color: MUTED, marginLeft: 8 }}>{ex.incurred_on}</span>
                        {ex.miles ? <span style={{ color: MUTED, marginLeft: 8 }}>{ex.miles}mi</span> : null}
                        {ex.note ? <span style={{ color: TEXT, marginLeft: 8, fontStyle: 'italic' }}>— {ex.note}</span> : null}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 700, color: ORANGE }}>${Number(ex.amount).toFixed(2)}</span>
                        <button onClick={() => handleDeleteExpense(ex.id)} style={{ background: 'transparent', color: '#ef4444', border: 'none', cursor: 'pointer', fontSize: 14 }}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {expenses.length === 0 && <p style={{ color: MUTED, fontSize: 13, marginTop: 12, marginBottom: 0 }}>No expenses logged yet.</p>}
            </div>
          </section>

          {/* Breakdown Protocol Toggle */}
          <section>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', marginBottom: '1rem' }}>Breakdown Protocol</h2>
            <div style={{ background: SURFACE, borderRadius: 8, padding: '1rem', border: '1px solid rgba(255,255,255,.12)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <p style={{ margin: 0, fontWeight: 600 }}>{breakdownOn ? 'Enabled' : 'Disabled'}</p>
                <p style={{ margin: '4px 0 0', color: MUTED, fontSize: '0.875rem' }}>When enabled, you receive automated breakdown alerts and route safety prompts during active jobs.</p>
              </div>
              <button onClick={handleToggleBreakdown} disabled={breakdownSaving} style={{ background: breakdownOn ? '#22c55e' : 'transparent', color: breakdownOn ? '#000' : ORANGE, border: '1px solid ' + (breakdownOn ? '#22c55e' : ORANGE), borderRadius: 6, padding: '8px 20px', fontWeight: 700, cursor: breakdownSaving ? 'default' : 'pointer', fontSize: 13 }}>
                {breakdownSaving ? 'Saving…' : breakdownOn ? 'Turn Off' : 'Turn On'}
              </button>
            </div>
          </section>

          {/* Find Work */}
          <section>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', marginBottom: '1rem' }}>Find Work</h2>
            <a href="/loads" style={{ display: 'inline-block', background: ORANGE, color: '#000', borderRadius: 6, padding: '10px 24px', fontWeight: 700, textDecoration: 'none' }}>
              Browse Available Loads
            </a>
          </section>

          {/* Profile Summary */}
          <section>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', marginBottom: '1rem' }}>Profile</h2>
            <div className="ui-load">
              <p style={{ margin: 0 }}><span style={{ color: MUTED }}>Name:</span> {profile.full_name || '—'}</p>
              <p style={{ margin: '8px 0 0' }}><span style={{ color: MUTED }}>Role:</span> {profile.role}</p>
              <a href="/profile" style={{ display: 'inline-block', marginTop: '0.75rem', color: ORANGE, fontSize: '0.875rem' }}>Edit Profile →</a>
            </div>
          </section>

          {!inApp && (
          <section>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fff', marginBottom: '1rem' }}>Subscription</h2>
            <div style={{ background: SURFACE, borderRadius: 8, padding: '1rem', border: '1px solid rgba(255,255,255,.12)', textAlign: 'center', marginTop: 8 }}>
              {(profile.stripe_customer_id || isPro) ? (
                <button onClick={handleStripePortal} style={{ background: ORANGE, color: '#000', border: 'none', borderRadius: 6, padding: '10px 24px', fontWeight: 700, cursor: 'pointer' }}>
                  Manage Subscription
                </button>
              ) : (
                <a href="/checkout" style={{ display: 'inline-block', background: ORANGE, color: '#000', borderRadius: 6, padding: '10px 24px', fontWeight: 700, textDecoration: 'none' }}>
                  Upgrade to Pro
                </a>
              )}
            </div>
          </section>
          )}
        </div>
      )}

      {!isCarrier && !isEscort && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <p style={{ color: MUTED }}>Unrecognized role: {profile.role}</p>
          <><MyJobsSection /><MyApplications /></>
        </div>
      )}

      {/* Deadhead Destination Modal */}
      {deadheadModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'rgba(255,255,255,.12)', borderRadius: 12, padding: '2rem', width: '100%', maxWidth: 400 }}>
            <h2 style={{ color: '#fff', margin: '0 0 0.5rem' }}>🚛 Where do you want to end up?</h2>
            <p style={{ color: 'var(--ui-muted)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>After this job — so we can match you with nearby loads.</p>
            <input
              placeholder="City"
              value={dhCity}
              onChange={e => setDhCity(e.target.value)}
              style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,.16)', background: 'rgba(255,255,255,.05)', color: '#e2e8f0', marginBottom: '0.75rem', fontSize: 16, minHeight: 44, boxSizing: 'border-box' as const }}
            />
            <input
              placeholder="State (e.g. TX)"
              value={dhState}
              onChange={e => setDhState(e.target.value)}
              style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,.16)', background: 'rgba(255,255,255,.05)', color: '#e2e8f0', marginBottom: '1rem', fontSize: 16, minHeight: 44, boxSizing: 'border-box' as const }}
            />
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                disabled={dhSubmitting || !dhCity || !dhState}
                onClick={async () => {
                  setDhSubmitting(true)
                  const res = await fetch(`/api/loads/${deadheadModal.loadId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ deadhead_destination_city: dhCity, deadhead_destination_state: dhState }),
                  })
                  if (!res.ok) {
                    const d = await res.json().catch(() => ({}))
                    setActionMsg(d.error || 'Could not save deadhead destination')
                    setDhSubmitting(false)
                    return
                  }
                  setDeadheadModal(null)
                  setDhCity('')
                  setDhState('')
                  setDhSubmitting(false)
                }}
                style={{ flex: 1, padding: '0.6rem', background: 'var(--ui-or)', color: '#000', border: 'none', borderRadius: 6, fontWeight: 700, cursor: 'pointer' }}
              >
                {dhSubmitting ? 'Saving…' : 'Save Destination'}
              </button>
              <button onClick={() => setDeadheadModal(null)} style={{ padding: '0.6rem 1rem', background: 'rgba(255,255,255,.16)', color: '#e2e8f0', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                Skip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deadhead Opportunities - Pro/Fleet only (5-minute exclusive window) */}
      {(() => {
        const dhOk = ['pro', 'fleet_starter', 'fleet_plus', 'fleet_pro'].includes(profile?.tier || '')
          || profile?.role === 'fleet_manager'
          || isAdminEmail(profile?.email)
        if (dhOk && deadheadOpps.length > 0) {
          return (
            <section style={{ marginTop: '2rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>🚛 Deadhead Opportunities</h2>
              {deadheadOpps.map((load: any) => (
                <div key={load.id} style={{ background: 'rgba(255,255,255,.12)', borderRadius: 8, padding: '1rem', marginBottom: '0.75rem', border: '1px solid rgba(255,255,255,.16)' }}>
                  <p style={{ margin: 0, fontWeight: 600 }}>{load.pu_city}, {load.pu_state} → {load.dl_city}, {load.dl_state}</p>
                  <p style={{ margin: '0.25rem 0 0', color: 'var(--ui-muted)', fontSize: '0.875rem' }}>${load.per_mile_rate ?? '—'}{load.per_mile_rate != null ? '/mi' : ''} &bull; {load.escort_type}</p>
                  <a href={`/loads/${load.id}`} style={{ color: 'var(--ui-or)', fontSize: '0.875rem', display: 'inline-block', marginTop: '0.5rem' }}>Claim load →</a>
                </div>
              ))}
            </section>
          )
        }
        if (!dhOk && isEscort) {
          return (
            <section style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(255,255,255,.12)', borderRadius: 8, border: '1px solid rgba(255,255,255,.16)' }}>
              <p style={{ margin: 0, color: 'var(--ui-muted)' }}>🚛 <strong style={{ color: 'var(--ui-or)' }}>Deadhead Opportunities</strong> — available to Pro and Fleet members. <a href="/pricing" style={{ color: 'var(--ui-or)' }}>Upgrade to Pro</a></p>
            </section>
          )
        }
        return null
      })()}
    </div>
    </div>
    </>
  )
}
