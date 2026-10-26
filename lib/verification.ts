// Oversize Escort Hub does not check or vouch for anyone: no background-check badge, no certificate or vehicle "verified"
// badge, no FMCSA "verified" tick, no veteran document review. Those were never promised to stay, they carry liability,
// and the other load boards do not do them. Everything is switched off in one place. The code stays (inert) so it can come
// back, but only if the owner decides to and a lawyer has read the wording: set NEXT_PUBLIC_VERIFICATION_LIVE=true and redeploy.
export const VERIFICATION_LIVE = process.env.NEXT_PUBLIC_VERIFICATION_LIVE === 'true'

export const NOT_AVAILABLE = 'This is not available. Oversize Escort Hub does not check or verify people or documents.'
