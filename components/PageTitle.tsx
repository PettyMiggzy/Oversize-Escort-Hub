// Page heading block for inner pages: a small orange eyebrow, a bold title, one plain line, optional actions on the right.
import type { ReactNode } from 'react'

type Props = { eyebrow?: string; title: string; lead?: string; right?: ReactNode }

export default function PageTitle({ eyebrow, title, lead, right }: Props) {
  return (
    <div className="ui-pt ui-pt-row">
      <div>
        {eyebrow && <div className="ui-eyebrow"><i />{eyebrow}</div>}
        <h1>{title}</h1>
        {lead && <p>{lead}</p>}
      </div>
      {right}
    </div>
  )
}
