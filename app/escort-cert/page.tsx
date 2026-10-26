import { redirect } from 'next/navigation'

// The old upload form moved to the new documents page (same upload, plus choosing what shows on your profile).
export default function EscortCertPage() {
  redirect('/my-documents')
}
