import { useState } from 'preact/hooks'
import {
  ADD_MOVES,
  addDur,
  addOptions,
  beatsOf,
  compareDur,
  formatNote,
  noteOptions,
  ratioOf,
  removeNote,
  subDur,
  swapNote,
  type BarNote,
  type Dur,
  type LineNote,
  type LineStep,
  type MeterMap,
  type Note,
} from '../theory'
import type { Part } from '../sketch/parts'
import type { AlongNote } from './along'
import { TAG_LABELS } from './lines-view'
import { BAR_REM } from './MelodyLane'
import { melodyStrips } from './melody-strips'
import { recipeLabel } from './parts-view'

// A row as the workspace shows and plays it: its part, its name and its
// notes over the chords as they are now.
export type PartView = { part: Part; label: string; notes: AlongNote[] }

// A chord of the progression as the rows place it.
export type RowChord = {
  node: string
  symbol: string
  start: Dur
  length: Dur
  bar: number
}

// A frozen row as the line tools edit it (parts-view's frozenLine).
export type FrozenLine = {
  notes: LineNote[]
  steps: LineStep[]
  range: number[]
}

// What is tapped in a row: a chord's bar, or a note (by its place in the
// row's notes).
type Picked = { id: string; step?: number; note?: number }

// The rows under the progression strip (David's request): each line or
// arpeggio added with + on the Lines and Arpeggio tabs. Each row is laid
// out bar by bar in time strips as wide as the melody lane's, so rows and
// melody line up under the chords (PLAN Phase 7 task 6): each note as wide
// as it lasts, labelled by interval and coloured as the tabs colour it.
// Tapping a chord's name in a row gives that bar's tools: play it, move it
// by octaves, silence it. A row can be frozen into its notes (David's
// request), and then tapping a note changes it as the Lines tab does:
// another note in its place, notes added after it, or taken out. Each row
// can be muted, moved by octaves or removed; Play on the strip plays the
// chords with every row that isn't muted.
export function PartRows({
  rows,
  chords,
  time,
  barCount,
  sounding,
  onMute,
  onRemove,
  onClearBar,
  onShift,
  onPlayBar,
  onFreeze,
  frozenLine,
  onEditBar,
  onShiftNote,
  onPlayNote,
}: {
  rows: PartView[]
  chords: RowChord[]
  time: MeterMap
  // How many bars the lane shows, so the rows line up with it.
  barCount: number
  sounding?: AlongNote
  onMute: (id: string, muted: boolean) => void
  onRemove: (id: string) => void
  // Leaves one bar of a row silent.
  onClearBar: (id: string, step: number) => void
  // Moves a row, or one bar of it, up (1) or down (-1) an octave.
  onShift: (id: string, by: number, step?: number) => void
  // Plays one bar of a row with its chord (David's request).
  onPlayBar: (id: string, step: number) => void
  // Freezes a row into the notes it plays now.
  onFreeze: (id: string) => void
  frozenLine: (id: string) => FrozenLine | undefined
  // A frozen row's bar with notes edited by hand.
  onEditBar: (id: string, step: number, notes: BarNote[]) => void
  // Moves one note of an arpeggio row's bar by octaves, by its place in
  // the bar's pattern (David's request).
  onShiftNote: (id: string, step: number, place: number, by: number) => void
  onPlayNote: (note: Note, length: Dur) => void
}) {
  const [picked, setPicked] = useState<Picked>()
  if (rows.length === 0) return null
  return (
    <section class="part-rows" aria-label="Rows">
      {rows.map(({ part, label, notes }) => {
        const frozen = part.frozen !== undefined
        const strips = melodyStrips(notes, time, barCount)
        const mine = picked?.id === part.id ? picked : undefined
        const pickedNote =
          mine?.note === undefined ? undefined : notes[mine.note]
        return (
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
              {!frozen && (
                <button
                  type="button"
                  title="Keep the notes this row plays now, to change them by hand; it no longer follows the chords (Undo brings it back)"
                  onClick={() => {
                    onFreeze(part.id)
                    setPicked(undefined)
                  }}
                >
                  ❄ Freeze
                </button>
              )}
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
            <div class="lane-bars">
              {strips.map((strip) => {
                const end = addDur(strip.start, strip.length)
                const pct = (d: Dur) => `${ratioOf(d, strip.length) * 100}%`
                const starting = chords
                  .map((c, step) => ({ ...c, step }))
                  .filter(
                    (c) =>
                      compareDur(c.start, strip.start) >= 0 &&
                      compareDur(c.start, end) < 0,
                  )
                return (
                  <div
                    key={strip.bar}
                    class="lane-bar"
                    style={{
                      width: `${ratioOf(strip.length, { n: 1, d: 1 }) * BAR_REM}rem`,
                    }}
                  >
                    <div class="row-chords">
                      {starting.map((c) => (
                        <button
                          type="button"
                          key={c.step}
                          class={
                            mine?.step === c.step
                              ? 'row-chord selected'
                              : 'row-chord'
                          }
                          style={{ left: pct(subDur(c.start, strip.start)) }}
                          aria-pressed={mine?.step === c.step}
                          title={`${c.symbol}, bar ${c.bar}: tap for this bar’s tools`}
                          onClick={() =>
                            setPicked(
                              mine?.step === c.step
                                ? undefined
                                : { id: part.id, step: c.step },
                            )
                          }
                        >
                          {c.symbol}
                        </button>
                      ))}
                    </div>
                    <div class="lane-ruler">
                      {beatsOf(strip.meter).map((b, k) => (
                        <span key={k} style={{ left: pct(b.onset) }} />
                      ))}
                    </div>
                    <div class="lane-track">
                      {strip.segments.map((g, k) => {
                        if (g.kind !== 'note') {
                          return (
                            <span
                              key={k}
                              class={
                                g.kind === 'rest' ? 'row-rest' : 'lane-empty'
                              }
                              style={{
                                left: pct(g.from),
                                width: pct(subDur(g.to, g.from)),
                              }}
                            />
                          )
                        }
                        const n = notes[g.index]
                        return (
                          <button
                            type="button"
                            key={k}
                            class={[
                              'lane-note',
                              'row-note',
                              n.look ?? '',
                              g.tiedIn ? 'tied-in' : '',
                              g.tiedOut ? 'tied-out' : '',
                              n === sounding ? 'sounding' : '',
                              mine?.note === g.index ? 'selected' : '',
                            ].join(' ')}
                            style={{
                              left: pct(g.from),
                              width: pct(subDur(g.to, g.from)),
                            }}
                            aria-pressed={mine?.note === g.index}
                            title={`${n.label ?? ''} ${formatNote(n.note)}${frozen ? ': tap to change it' : ''}`}
                            onClick={() => {
                              if (mine?.note === g.index) {
                                setPicked(undefined)
                                return
                              }
                              setPicked({ id: part.id, note: g.index })
                              onPlayNote(n.note, n.length)
                            }}
                          >
                            <span class="lane-name">
                              <b>{n.label}</b> {formatNote(n.note)}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
            {mine?.step !== undefined && (
              <BarTools
                part={part}
                label={label}
                chord={chords[mine.step]}
                playing={notes.some((n) => n.step === mine.step)}
                onPlay={() => onPlayBar(part.id, mine.step as number)}
                onShift={(by) => onShift(part.id, by, mine.step)}
                onClear={() => {
                  onClearBar(part.id, mine.step as number)
                  setPicked(undefined)
                }}
                onClose={() => setPicked(undefined)}
              />
            )}
            {pickedNote && mine?.note !== undefined && (
              <NoteTools
                note={pickedNote}
                line={frozen ? frozenLine(part.id) : undefined}
                onEdit={(step, bar) => onEditBar(part.id, step, bar)}
                onShift={
                  pickedNote.place === undefined
                    ? undefined
                    : (by) => {
                        onShiftNote(
                          part.id,
                          pickedNote.step,
                          pickedNote.place as number,
                          by,
                        )
                        const octave = (pickedNote.note.octave ?? 4) + by
                        onPlayNote(
                          { ...pickedNote.note, octave },
                          pickedNote.length,
                        )
                      }
                }
                onPlayNote={onPlayNote}
                onFreeze={() => onFreeze(part.id)}
                onDone={() => setPicked(undefined)}
              />
            )}
          </div>
        )
      })}
    </section>
  )
}

// A bar of a row: what it plays, ▶ to hear it, ▼ ▲ to move it by octaves
// and × to silence it.
function BarTools({
  part,
  label,
  chord,
  playing,
  onPlay,
  onShift,
  onClear,
  onClose,
}: {
  part: Part
  label: string
  chord: RowChord
  playing: boolean
  onPlay: () => void
  onShift: (by: number) => void
  onClear: () => void
  onClose: () => void
}) {
  // What the bar plays when it has a setting of its own.
  const cell = part.cells?.[chord.node]
  const own = cell && part.frozen === undefined ? recipeLabel(cell) : undefined
  return (
    <div class="lane-place row-tools">
      <strong>
        {chord.symbol} · bar {chord.bar}
      </strong>{' '}
      {own && <span class="part-cell">{own}</span>}
      {!playing && <span class="muted">silent</span>}{' '}
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        class="close-tools"
      >
        ×
      </button>
      <div class="place-options">
        <button
          type="button"
          title="Play this bar of the row with its chord"
          onClick={onPlay}
        >
          ▶ Play
        </button>
        {playing && (
          <>
            <button
              type="button"
              aria-label={`${label} over ${chord.symbol} in bar ${chord.bar} down an octave`}
              title="This bar down an octave"
              onClick={() => onShift(-1)}
            >
              ▼ Octave
            </button>
            <button
              type="button"
              aria-label={`${label} over ${chord.symbol} in bar ${chord.bar} up an octave`}
              title="This bar up an octave"
              onClick={() => onShift(1)}
            >
              ▲ Octave
            </button>
            <button
              type="button"
              aria-label={`Silence ${label} over ${chord.symbol} in bar ${chord.bar}`}
              title="Silence this bar of the row (Undo brings it back)"
              onClick={onClear}
            >
              𝄽 Silence it
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// A note of a row: what it is and why; in a frozen row, the Lines tab's
// tools to change it (David's request).
function NoteTools({
  note,
  line,
  onEdit,
  onShift,
  onPlayNote,
  onFreeze,
  onDone,
}: {
  note: AlongNote
  line?: FrozenLine
  onEdit: (step: number, bar: BarNote[]) => void
  // An arpeggio note that follows the chords, moved by octaves.
  onShift?: (by: number) => void
  onPlayNote: (note: Note, length: Dur) => void
  onFreeze: () => void
  onDone: () => void
}) {
  const tagged = line?.notes[note.ref]
  const head = (
    <>
      <strong>
        {note.label} {formatNote(note.note)}
        {tagged ? ` · ${tagged.tags.map((t) => TAG_LABELS[t]).join(', ')}` : ''}
      </strong>{' '}
      <button
        type="button"
        aria-label="Close"
        onClick={onDone}
        class="close-tools"
      >
        ×
      </button>
    </>
  )
  // ▼ ▲ for a note (David's request): a frozen row's note, or an arpeggio
  // note, which keeps the move as the row follows the chords.
  const octaves = (shift: (by: number) => void) => (
    <div class="place-options" role="group" aria-label="Octave">
      <button
        type="button"
        title="This note down an octave"
        onClick={() => shift(-1)}
      >
        ▼ Octave
      </button>
      <button
        type="button"
        title="This note up an octave"
        onClick={() => shift(1)}
      >
        ▲ Octave
      </button>
    </div>
  )
  if (!line || !tagged) {
    return (
      <div class="lane-place row-tools">
        {head}
        {onShift && octaves(onShift)}
        <p class="muted">
          This row follows the chords.{' '}
          {onShift
            ? 'A note moved here stays moved when the chords change. '
            : ''}
          Freeze it to keep its notes and change them by hand.{' '}
          <button type="button" onClick={onFreeze}>
            ❄ Freeze
          </button>
        </p>
      </div>
    )
  }
  const { notes, steps, range } = line
  const at = note.ref
  const swaps = noteOptions(notes, at, steps, range)
  const adds = addOptions(notes, at, steps)
  const removed = removeNote(notes, at, steps)
  return (
    <div class="lane-place row-tools">
      {head}
      <p class="line-why">{tagged.explanation}</p>
      {octaves((by) => {
        const octave = (tagged.note.octave ?? 4) + by
        if (octave < 0 || octave > 8) return
        const moved = { ...tagged.note, octave }
        onEdit(tagged.step, swapNote(notes, at, steps, moved))
        onPlayNote(moved, tagged.length)
      })}
      <div class="note-options" role="group" aria-label="Play instead">
        <span class="muted">Play instead:</span>
        {swaps.map((o) => (
          <button
            key={o.candidate.midi}
            type="button"
            class={[
              'line-note',
              `tag-${o.tags[0]}`,
              o.tags.includes('chromatic') ? 'chromatic' : '',
            ].join(' ')}
            title={[o.explanation, ...o.contextNotes].join(' ')}
            onClick={() => {
              onEdit(tagged.step, swapNote(notes, at, steps, o.candidate.note))
              onPlayNote(o.candidate.note, tagged.length)
            }}
          >
            <span class="label">{o.candidate.label}</span>
            <span class="name">{formatNote(o.candidate.note)}</span>
          </button>
        ))}
      </div>
      <div class="note-options" role="group" aria-label="Add after it">
        <span class="muted">Add after it:</span>
        {adds.map((o) => (
          <button
            key={o.tags[1]}
            type="button"
            title={o.explanation}
            onClick={() => {
              onEdit(tagged.step, o.candidate)
              onDone()
            }}
          >
            + {ADD_LABELS[o.tags[1]] ?? o.tags[1]}
          </button>
        ))}
        {adds.length === 0 && (
          <span class="muted">no room: it’s a semiquaver already</span>
        )}
        {removed && (
          <button
            type="button"
            class="remove-note"
            title="Take this note out: the note before holds on"
            onClick={() => {
              onEdit(tagged.step, removed)
              onDone()
            }}
          >
            × Take it out
          </button>
        )}
      </div>
    </div>
  )
}

const ADD_LABELS: Record<string, string> = Object.fromEntries(
  ADD_MOVES.map((m) => [m.id, m.label.toLowerCase()]),
)

// "+1 oct", "−2 oct".
function octaveText(octave: number): string {
  return `${octave > 0 ? '+' : '−'}${Math.abs(octave)} oct`
}
