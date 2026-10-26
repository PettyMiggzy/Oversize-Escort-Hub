import { redirect } from 'next/navigation'
import { VERIFICATION_LIVE } from '@/lib/verification'
void VERIFICATION_LIVE
// Verification is not live (we do not check or vouch for anyone). The old page is kept in git history and can return behind NEXT_PUBLIC_VERIFICATION_LIVE.
export default function Page() {
  redirect('/coming-later')
}
