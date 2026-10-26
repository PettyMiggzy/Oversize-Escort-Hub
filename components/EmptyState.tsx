// Friendly empty state: an icon tile, a headline, one plain line and an optional action.
import type { ReactNode } from 'react'

type Props = { title: string; text?: string; action?: ReactNode; icon?: ReactNode }

const DefaultIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 7l9-4 9 4v10l-9 4-9-4zM3 7l9 4 9-4M12 11v10" /></svg>
)

export default function EmptyState({ title, text, action, icon }: Props) {
  return (
    <div className="ui-empty">
      <div className="ui-ei">{icon ?? <DefaultIcon />}</div>
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {action}
    </div>
  )
}
