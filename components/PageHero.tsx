// Photo header band for inner pages: a real photo under a dark gradient, a title and one plain line.
import type { ReactNode } from 'react'

type Props = { image: string; title: string; lead?: string; position?: string; children?: ReactNode }

export default function PageHero({ image, title, lead, position = 'center', children }: Props) {
  return (
    <div className="pgh" style={{ backgroundImage: `url(${image})`, backgroundPosition: position }}>
      <h1 className="bb">{title}</h1>
      {lead && <p>{lead}</p>}
      {children}
    </div>
  )
}
