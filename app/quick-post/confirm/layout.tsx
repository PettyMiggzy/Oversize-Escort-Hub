import type { Metadata } from 'next'
import type { ReactNode } from 'react'

// The link carries a one-time token: keep it out of search results
export const metadata: Metadata = { title: 'Confirm your load', robots: { index: false, follow: false } }

export default function Layout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
