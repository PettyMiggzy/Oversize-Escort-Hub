// Loads made for the app-store reviewers and for testing are named ZZTEST in their notes. They stay on the board for
// the reviewers but are never announced to real people (new-load alerts, urgent alerts, the weekly email).
export function isDemoLoad(notes: unknown): boolean {
  return typeof notes === 'string' && notes.trim().toUpperCase().startsWith('ZZTEST')
}

// Who may see and use demo loads: the reviewer and demo accounts and the owner's own accounts (same rule as can_see_demo_loads() in the database).
export function canSeeDemoLoads(email: unknown): boolean {
  const e = typeof email === 'string' ? email.toLowerCase() : ''
  return /\+(oehreview|demodriver|democarrier)/.test(e) || e === 'bahmed3170@gmail.com' || e === 'brian@precisionpilotservices.com'
}
