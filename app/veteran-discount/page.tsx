import { redirect } from 'next/navigation'

// Not offered. We never ask for a DD-214.
export default function VeteranDiscountPage() {
  redirect('/coming-later')
}
