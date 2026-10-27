import { redirect } from 'next/navigation'

// Veteran discounts are not offered and we do not collect DD-214s.
export default function DD214Page() {
  redirect('/coming-later')
}
