'use client'
import { profileProgress, type ProfileLike } from '@/lib/profile-complete'

// Shown to pilot cars until their profile has the basics. Carriers search by state and rig, so an empty profile is never found.
export default function ProfileNudge({ profile }: { profile: ProfileLike }) {
  const { steps, done, total, pct, complete } = profileProgress(profile)
  if (complete) return null
  const next = steps.find((s) => !s.done)!
  return (
    <div className="ui-card" style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: '1 1 260px', minWidth: 0 }}>
          <h2 style={{ margin: '0 0 4px', fontSize: 18, color: '#fff' }}>Finish your profile</h2>
          <p className="ui-note" style={{ margin: 0 }}>Carriers look for pilot cars by state and equipment. Add the missing pieces so they can find you. We do not check what you enter.</p>
        </div>
        <a href={next.href} className="ui-btn">Next: {next.label.toLowerCase()}</a>
      </div>
      <div style={{ marginTop: 14 }} aria-label={`${done} of ${total} done`}>
        <div style={{ height: 8, borderRadius: 99, background: 'rgba(255,255,255,.1)', overflow: 'hidden' }}>
          <div style={{ width: `${Math.max(pct, 4)}%`, height: '100%', background: 'var(--ui-or, #ff6a13)' }} />
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
          {steps.map((s) => (
            <a key={s.key} href={s.href} className="ui-badge" style={{ textDecoration: 'none', opacity: s.done ? 0.55 : 1 }}>
              {s.done ? '✓ ' : ''}{s.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
