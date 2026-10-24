import { useState } from 'preact/hooks'
import {
  HARMONY_TAG_TEXT,
  beatsOf,
  formatNote,
  ratioOf,
  subDur,
  type Dur,
  type MeterMap,
  type Note,
  type Suggestion,
} from '../theory'
import { BAR_REM } from './MelodyLane'
import { melodyStrips } from './melody-strips'
import type { HarmonyRow } from './melody-view'

// The harmonies and the countermelody, each on a row of its own under the
// melody (PLAN Phase 7 task 11, David's note), laid out bar by bar in time
// strips as wide as the lane's so every row lines up under the chords. A
// harmony follows the melody note for note; tap a note to hear it, see why
// it's there and change it (David's request): another note in its place,
// an octave up or down, or taken out. Your notes stay on top while the
// harmony follows the melody, until the melody note under one changes.
// × stops the harmony playing. Tapping anywhere in a bar makes it the
// active bar (David's request).
export function HarmonyRows({
  rows,
  time,
  barCount,
  sounding,
  activeBar,
  onActivate,
  onRemove,
  onPlayNote,
  alternatives,
  onEdit,
  onRestore,
}: {
  rows: HarmonyRow[]
  time: MeterMap
  barCount: number
  // The note sounding: its row's id and its place in the row.
  sounding?: { id: string; index: number }
  activeBar?: number
  onActivate: (bar: number) => void
  onRemove: (id: string) => void
  onPlayNote: (note: Note, length: Dur) => void
  // Notes to play in place of a harmony's note, by its place in the melody.
  alternatives: (
    id: string,
    place: number,
    current: Note,
  ) => Suggestion<{ note: Note; kind: string }>[]
  // Your note under a melody note; none takes the harmony's note out.
  onEdit: (id: string, place: number, note?: Note) => void
  // The harmony's own note again, under one melody note or under all.
  onRestore: (id: string, place?: number) => void
}) {
  // The note tapped, by its place in the melody, so it stays picked as
  // it's changed.
  const [picked, setPicked] = useState<{ id: string; place: number }>()
  if (rows.length === 0) return null
  return (
    <section class="part-rows" aria-label="Harmonies">
      {rows.map((row) => {
        const strips = melodyStrips(row.notes, time, barCount)
        const mine = picked?.id === row.id ? picked.place : undefined
        const chosen =
          mine === undefined
            ? undefined
            : row.notes.find((n) => n.place === mine)
        return (
          <div key={row.id} class="part-row harmony-row">
            <div class="part-head">
              <strong>♫ {row.label}</strong>
              <span class="muted">follows the melody</span>
              {row.edited > 0 && (
                <button
                  type="button"
                  title="Put back every note the harmony worked out (Undo brings your notes back)"
                  onClick={() => {
                    onRestore(row.id)
                    setPicked(undefined)
                  }}
                >
                  ↺ Undo my {row.edited} change{row.edited === 1 ? '' : 's'}
                </button>
              )}
              <button
                type="button"
                aria-label={`Stop the harmony ${row.label}`}
                title="Stop this harmony playing (Undo brings it back)"
                onClick={() => onRemove(row.id)}
              >
                ×
              </button>
            </div>
            <div class="lane-bars">
              {strips.map((strip) => {
                const pct = (d: Dur) => `${ratioOf(d, strip.length) * 100}%`
                return (
                  <div
                    key={strip.bar}
                    class={
                      strip.bar === activeBar ? 'lane-bar active' : 'lane-bar'
                    }
                    style={{
                      width: `${ratioOf(strip.length, { n: 1, d: 1 }) * BAR_REM}rem`,
                    }}
                    onClick={() => onActivate(strip.bar)}
                  >
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
                        const n = row.notes[g.index]
                        const on =
                          sounding?.id === row.id && sounding.index === g.index
                        return (
                          <button
                            type="button"
                            key={k}
                            class={[
                              'lane-note',
                              'harmony-note',
                              n.tags.includes('chromatic') ? 'chromatic' : '',
                              n.edited ? 'edited' : '',
                              g.tiedIn ? 'tied-in' : '',
                              g.tiedOut ? 'tied-out' : '',
                              on ? 'sounding' : '',
                              mine === n.place ? 'selected' : '',
                            ].join(' ')}
                            style={{
                              left: pct(g.from),
                              width: pct(subDur(g.to, g.from)),
                            }}
                            aria-pressed={mine === n.place}
                            title={`${formatNote(n.note)}: tap to hear it and change it`}
                            onClick={() => {
                              if (mine === n.place) {
                                setPicked(undefined)
                                return
                              }
                              setPicked({ id: row.id, place: n.place })
                              onPlayNote(n.note, n.length)
                            }}
                          >
                            <span class="lane-name">
                              {g.tiedIn ? '⌒' : ''}
                              {formatNote(n.note)}
                              {g.tiedOut ? '⌒' : ''}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
            {chosen && (
              <div class="lane-place row-tools">
                <strong>
                  {formatNote(chosen.note)}
                  {chosen.edited ? ' · your choice' : ''}
                </strong>{' '}
                <button
                  type="button"
                  aria-label="Close"
                  class="close-tools"
                  onClick={() => setPicked(undefined)}
                >
                  ×
                </button>
                <p class="line-why">{chosen.explanation}</p>
                <div class="place-options" role="group" aria-label="Octave">
                  {[-1, 1].map((by) => (
                    <button
                      type="button"
                      key={by}
                      title={`This note ${by < 0 ? 'down' : 'up'} an octave`}
                      onClick={() => {
                        const octave = (chosen.note.octave ?? 4) + by
                        if (octave < 0 || octave > 8) return
                        const moved = { ...chosen.note, octave }
                        onEdit(row.id, chosen.place, moved)
                        onPlayNote(moved, chosen.length)
                      }}
                    >
                      {by < 0 ? '▼ Octave' : '▲ Octave'}
                    </button>
                  ))}
                </div>
                <div
                  class="note-options"
                  role="group"
                  aria-label="Play instead"
                >
                  <span class="muted">Play instead:</span>
                  {alternatives(row.id, chosen.place, chosen.note).map((o) => (
                    <button
                      type="button"
                      key={formatNote(o.candidate.note)}
                      class="next-note"
                      title={o.explanation}
                      onClick={() => {
                        onEdit(row.id, chosen.place, o.candidate.note)
                        onPlayNote(o.candidate.note, chosen.length)
                      }}
                    >
                      {formatNote(o.candidate.note)}{' '}
                      <span class="muted">
                        {o.tags
                          .map((t) => HARMONY_TAG_TEXT[t])
                          .filter(Boolean)
                          .join(', ')}
                      </span>
                    </button>
                  ))}
                </div>
                <div class="place-options">
                  <button
                    type="button"
                    class="remove-note"
                    title="Take this note out: a rest in its place (Undo brings it back)"
                    onClick={() => {
                      onEdit(row.id, chosen.place)
                      setPicked(undefined)
                    }}
                  >
                    × Take it out
                  </button>
                  {chosen.edited && (
                    <button
                      type="button"
                      title="The note the harmony worked out here"
                      onClick={() => onRestore(row.id, chosen.place)}
                    >
                      ↺ The harmony’s own note
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </section>
  )
}
