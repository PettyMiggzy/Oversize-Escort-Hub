// Loads made for the app-store reviewers and for testing are named ZZTEST in their notes. They stay on the board for
// the reviewers but are never announced to real people (new-load alerts, urgent alerts, the weekly email).
export function isDemoLoad(notes: unknown): boolean {
  return typeof notes === 'string' && notes.trim().toUpperCase().startsWith('ZZTEST')
}
