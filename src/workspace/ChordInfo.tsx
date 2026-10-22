import { useState } from 'preact/hooks'
import type { ChordInsight } from '../theory'

// The ⓘ toggle (SPEC 6.2): a small button that opens the panel below it.
export function InfoToggle({
  open,
  label,
  onToggle,
}: {
  open: boolean
  label: string
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      class="info-toggle"
      aria-expanded={open}
      aria-label={`${open ? 'Hide' : 'Show'} more about ${label}`}
      title={`More about ${label}`}
      onClick={onToggle}
    >
      ⓘ
    </button>
  )
}

export function useToggle(): [boolean, () => void] {
  const [open, setOpen] = useState(false)
  return [open, () => setOpen(!open)]
}

// The ⓘ panel's body: the chord's reading in the key and its notes, then
// "More" (how it moves from the chord before, and any other reading of the
// same chord), then one line for each context effect on its ranking.
export function InfoPanel({
  insight,
  also,
  contextNotes = [],
}: {
  insight: ChordInsight
  also?: string
  contextNotes?: string[]
}) {
  const theory = [insight.motion, insight.common, insight.moves].filter(
    (line): line is string => line !== undefined,
  )
  return (
    <div class="info-panel">
      <p>
        <strong>{insight.reading}</strong> · {insight.notes}
      </p>
      {(theory.length > 0 || also) && (
        <>
          <h4>More</h4>
          {theory.map((line) => (
            <p key={line}>{line}</p>
          ))}
          {also && <p>Also: {also}</p>}
        </>
      )}
      {contextNotes.length > 0 && (
        <>
          <h4>Why it ranks here</h4>
          {contextNotes.map((note) => (
            <p key={note} class="context">
              {note}
            </p>
          ))}
        </>
      )}
    </div>
  )
}
