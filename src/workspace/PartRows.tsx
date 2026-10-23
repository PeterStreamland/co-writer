import { chordSymbol, formatNote } from '../theory'
import type { ChordNode } from '../sketch/progression'
import type { Part } from '../sketch/parts'
import type { AlongNote } from './along'
import { recipeLabel } from './parts-view'

// A row as the workspace shows and plays it: its part, its name and its
// notes over the chords as they are now.
export type PartView = { part: Part; label: string; notes: AlongNote[] }

// The rows under the progression strip (David's request): each line or
// arpeggio added with + on the Lines and Arpeggio tabs, a box per chord
// with the notes it plays there. A bar added on its own says what it
// plays; any bar can be silenced with its ×. Each row can be muted or removed; Play
// on the strip plays the chords with every row that isn't muted.
export function PartRows({
  rows,
  path,
  sounding,
  onMute,
  onRemove,
  onClearBar,
}: {
  rows: PartView[]
  path: ChordNode[]
  sounding?: AlongNote
  onMute: (id: string, muted: boolean) => void
  onRemove: (id: string) => void
  // Leaves one bar of a row silent.
  onClearBar: (id: string, step: number) => void
}) {
  if (rows.length === 0) return null
  return (
    <section class="part-rows" aria-label="Rows">
      {rows.map(({ part, label, notes }) => (
        <div
          key={part.id}
          class={part.muted ? 'part-row muted-row' : 'part-row'}
        >
          <div class="part-head">
            <strong>{label}</strong>
            <button
              type="button"
              aria-pressed={part.muted === true}
              title={part.muted ? 'Unmute this row' : 'Mute this row'}
              onClick={() => onMute(part.id, !part.muted)}
            >
              {part.muted ? '🔇 Muted' : '🔈 On'}
            </button>
            <button
              type="button"
              aria-label={`Remove the row ${label}`}
              title="Remove this row (Undo brings it back)"
              onClick={() => onRemove(part.id)}
            >
              ×
            </button>
          </div>
          <ol class="part-chords">
            {path.map((n, i) => {
              const own = part.cells?.[n.id]
              const sounds = notes.some((note) => note.step === i)
              return (
                <li key={i}>
                  <span class="part-bar">
                    <span class="muted">{chordSymbol(n.chord)}</span>
                    {own && (
                      <span class="part-cell" title={recipeLabel(own)}>
                        {recipeLabel(own)}
                      </span>
                    )}
                    {sounds && (
                      <button
                        type="button"
                        class="clear-bar"
                        aria-label={`Silence ${label} over ${chordSymbol(n.chord)}`}
                        title="Silence this bar of the row (Undo brings it back)"
                        onClick={() => onClearBar(part.id, i)}
                      >
                        ×
                      </button>
                    )}
                  </span>
                  <span class="part-notes">
                    {notes
                      .filter((note) => note.step === i)
                      .map((note, k) => (
                        <span
                          key={k}
                          class={note === sounding ? 'sounding' : undefined}
                        >
                          {formatNote(note.note)}
                        </span>
                      ))}
                  </span>
                </li>
              )
            })}
          </ol>
        </div>
      ))}
    </section>
  )
}
