import { useState } from 'preact/hooks'
import {
  beatsOf,
  formatNote,
  ratioOf,
  subDur,
  type Dur,
  type MeterMap,
  type Note,
} from '../theory'
import { BAR_REM } from './MelodyLane'
import { melodyStrips } from './melody-strips'
import type { HarmonyRow } from './melody-view'

// The harmonies and the countermelody, each on a row of its own under the
// melody (PLAN Phase 7 task 11, David's note), laid out bar by bar in time
// strips as wide as the lane's so every row lines up under the chords. A
// harmony follows the melody note for note, so it isn't edited here: tap a
// note to hear it and see why it's there, × to stop the harmony playing.
// Tapping anywhere in a bar makes it the active bar (David's request).
export function HarmonyRows({
  rows,
  time,
  barCount,
  sounding,
  activeBar,
  onActivate,
  onRemove,
  onPlayNote,
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
}) {
  const [picked, setPicked] = useState<{ id: string; index: number }>()
  if (rows.length === 0) return null
  return (
    <section class="part-rows" aria-label="Harmonies">
      {rows.map((row) => {
        const strips = melodyStrips(row.notes, time, barCount)
        const mine = picked?.id === row.id ? picked.index : undefined
        const chosen = mine === undefined ? undefined : row.notes[mine]
        return (
          <div key={row.id} class="part-row harmony-row">
            <div class="part-head">
              <strong>♫ {row.label}</strong>
              <span class="muted">follows the melody</span>
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
                              g.tiedIn ? 'tied-in' : '',
                              g.tiedOut ? 'tied-out' : '',
                              on ? 'sounding' : '',
                              mine === g.index ? 'selected' : '',
                            ].join(' ')}
                            style={{
                              left: pct(g.from),
                              width: pct(subDur(g.to, g.from)),
                            }}
                            aria-pressed={mine === g.index}
                            title={`${formatNote(n.note)}: ${n.explanation}`}
                            onClick={() => {
                              if (mine === g.index) {
                                setPicked(undefined)
                                return
                              }
                              setPicked({ id: row.id, index: g.index })
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
                <strong>{formatNote(chosen.note)}</strong>{' '}
                <button
                  type="button"
                  aria-label="Close"
                  class="close-tools"
                  onClick={() => setPicked(undefined)}
                >
                  ×
                </button>
                <p class="line-why">{chosen.explanation}</p>
              </div>
            )}
          </div>
        )
      })}
    </section>
  )
}
