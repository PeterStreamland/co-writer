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
// and bar with the notes it plays there, as the tabs show them (David's
// request). A bar added on its own says what it plays; any bar can be
// silenced with its ×. Each row can be muted or removed; Play
// on the strip plays the chords with every row that isn't muted.
export function PartRows({
  rows,
  path,
  bars,
  sounding,
  onMute,
  onRemove,
  onClearBar,
  onShift,
  onPlayBar,
}: {
  rows: PartView[]
  path: ChordNode[]
  // The bar each chord starts in.
  bars: number[]
  sounding?: AlongNote
  onMute: (id: string, muted: boolean) => void
  onRemove: (id: string) => void
  // Leaves one bar of a row silent.
  onClearBar: (id: string, step: number) => void
  // Moves a row, or one bar of it, up (1) or down (-1) an octave.
  onShift: (id: string, by: number, step?: number) => void
  // Plays one bar of a row with its chord (David's request).
  onPlayBar: (id: string, step: number) => void
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
            <span class="octave-one" role="group" aria-label="Row octave">
              <button
                type="button"
                aria-label={`${label} down an octave`}
                title="The whole row down an octave"
                onClick={() => onShift(part.id, -1)}
              >
                ▼
              </button>
              {part.octave ? (
                <span class="octave-label">{octaveText(part.octave)}</span>
              ) : null}
              <button
                type="button"
                aria-label={`${label} up an octave`}
                title="The whole row up an octave"
                onClick={() => onShift(part.id, 1)}
              >
                ▲
              </button>
            </span>
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
          <ol class="line-chords part-chords">
            {path.map((n, i) => {
              const own = part.cells?.[n.id]
              const played = notes.filter((note) => note.step === i)
              return (
                <li
                  key={i}
                  class={played.length ? 'line-chord' : 'line-chord silent'}
                >
                  <div class="bar-head">
                    <button
                      type="button"
                      class="line-chord-name"
                      title="Play this bar of the row with its chord"
                      onClick={() => onPlayBar(part.id, i)}
                    >
                      {chordSymbol(n.chord)}
                      <span class="muted"> · bar {bars[i]}</span>
                    </button>
                    {played.length > 0 && (
                      <span class="octave-one">
                        <button
                          type="button"
                          aria-label={`${label} over ${chordSymbol(n.chord)} in bar ${bars[i]} down an octave`}
                          title="This bar down an octave"
                          onClick={() => onShift(part.id, -1, i)}
                        >
                          ▼
                        </button>
                        {part.octaves?.[n.id] ? (
                          <span class="octave-label">
                            {octaveText(part.octaves[n.id])}
                          </span>
                        ) : null}
                        <button
                          type="button"
                          aria-label={`${label} over ${chordSymbol(n.chord)} in bar ${bars[i]} up an octave`}
                          title="This bar up an octave"
                          onClick={() => onShift(part.id, 1, i)}
                        >
                          ▲
                        </button>
                      </span>
                    )}
                    {played.length > 0 && (
                      <button
                        type="button"
                        class="clear-bar"
                        aria-label={`Silence ${label} over ${chordSymbol(n.chord)} in bar ${bars[i]}`}
                        title="Silence this bar of the row (Undo brings it back)"
                        onClick={() => onClearBar(part.id, i)}
                      >
                        ×
                      </button>
                    )}
                  </div>
                  {own && (
                    <span class="part-cell" title={recipeLabel(own)}>
                      {recipeLabel(own)}
                    </span>
                  )}
                  {played.length ? (
                    <span class="line-notes">
                      {played.map((note, k) => (
                        <span
                          key={k}
                          class={[
                            'line-note',
                            note.look ?? '',
                            note === sounding ? 'sounding' : '',
                          ].join(' ')}
                        >
                          <span class="label">{note.label}</span>
                          <span class="name">{formatNote(note.note)}</span>
                        </span>
                      ))}
                    </span>
                  ) : (
                    <span class="muted">silent</span>
                  )}
                </li>
              )
            })}
          </ol>
        </div>
      ))}
    </section>
  )
}

// "+1 oct", "−2 oct".
function octaveText(octave: number): string {
  return `${octave > 0 ? '+' : '−'}${Math.abs(octave)} oct`
}
