'use client'
import { useState } from 'react'
import ShareButtons from '@/components/ShareButtons'
import { loadLink, piecesFromRow, shareText } from '@/lib/share-text'

// One small "Share" link on a load; it opens the copy and Facebook buttons. The link goes to a public card anyone can read.
export default function ShareLoad({ load }: { load: any }) {
  const [open, setOpen] = useState(false)
  if (!load?.id) return null
  return (
    <div style={{ marginTop: 8 }}>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open}
        style={{ background: 'none', border: 'none', color: 'var(--ui-or, #ff6a13)', fontSize: 13, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>
        {open ? 'Hide share options' : 'Share this load'}
      </button>
      {open && <div style={{ marginTop: 8 }}><ShareButtons url={loadLink(String(load.id))} text={shareText(piecesFromRow(load))} compact /></div>}
    </div>
  )
}
