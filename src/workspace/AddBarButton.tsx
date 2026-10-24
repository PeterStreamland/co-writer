import { useState } from 'preact/hooks'

// A row a bar can go into: its id and name.
export type RowChoice = { id: string; label: string }

// + on a bar of the Lines or Arpeggio tab (David's request): with no row
// of its kind it starts one; otherwise it asks which row the bar goes
// into, or a new row of its own, so rows are kept apart (Phase 7 task 12).
// `into` is the row's id, or 'new'.
export function AddBarButton({
  rows,
  text,
  label,
  onAdd,
}: {
  rows: RowChoice[]
  text: string
  // What the bar is, for the button's spoken name.
  label: string
  onAdd: (into: string) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        class="add-bar"
        aria-label={`Add ${label} to a row`}
        aria-expanded={rows.length ? open : undefined}
        title={
          rows.length
            ? 'Add this bar to a row, or start a new row'
            : 'Add this bar to a new row'
        }
        onClick={() => {
          if (rows.length) setOpen(!open)
          else onAdd('new')
        }}
      >
        {text}
      </button>
      {open && rows.length > 0 && (
        <span
          class="lane-clear-menu add-bar-menu"
          role="group"
          aria-label={`Add ${label} to`}
        >
          {rows.map((r) => (
            <button
              type="button"
              key={r.id}
              title={`This bar plays its own way in ${r.label}; the row's other bars stay`}
              onClick={() => {
                onAdd(r.id)
                setOpen(false)
              }}
            >
              Into {r.label}
            </button>
          ))}
          <button
            type="button"
            title="A row of its own, with just this bar"
            onClick={() => {
              onAdd('new')
              setOpen(false)
            }}
          >
            A new row
          </button>
        </span>
      )}
    </>
  )
}
