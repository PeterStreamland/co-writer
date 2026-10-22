import { playChord } from '../audio/player'
import { shapeName } from '../instruments/caged'
import { chordBox, type ChordBox } from '../instruments/chord-box'
import { formatFrets, type Fingering } from '../instruments/fingering'
import type { Guitar } from '../instruments/guitar'
import {
  chordSymbol,
  inversionName,
  type ChordName,
  type Note,
} from '../theory'
import { AddButton } from './AddButton'
import type { ChordVoicing } from '../sketch/progression'
import { chordWithBass } from './voicing-chord'
import {
  SPANS,
  STRING_SETS,
  inversionChoices,
  type ShapeFilters,
} from './shape-filters'

// The chord boxes beside the neck (Phase 3 task 8, David's choice): the
// current chord's shape as a small vertical box, nut at the top and the
// frets written underneath, with ◀ ▶ to step through its shapes, easiest
// first, and the filters below. Clicking the box strums it.
export function ChordBoxes({
  guitar,
  chord,
  shapes,
  at,
  onAt,
  filters,
  onFiltersChange,
  onAdd,
}: {
  guitar: Guitar
  chord: ChordName
  shapes: Fingering[]
  at: number
  onAt: (at: number) => void
  filters: ShapeFilters
  onFiltersChange: (filters: ShapeFilters) => void
  onAdd?: (chord: ChordName, voicing: ChordVoicing) => void
}) {
  const shape = shapes[at]
  const step = (by: number) => onAt((at + by + shapes.length) % shapes.length)
  const set = (change: Partial<ShapeFilters>) =>
    onFiltersChange({ ...filters, ...change })
  return (
    <section class="chord-boxes" aria-label="Chord shapes">
      <div class="box-head">
        <h3>{shape ? shapeName(guitar, chord, shape) : chordSymbol(chord)}</h3>
        {shape && onAdd && (
          <AddButton
            chord={chordWithBass(chord, shape.notes)}
            voicing={{
              instrument: 'guitar',
              notes: shape.notes.filter((n): n is Note => n !== null),
              frets: shape.frets,
            }}
            onAdd={onAdd}
          />
        )}
      </div>
      {shape ? (
        <>
          <button
            type="button"
            class="box"
            aria-label={`Play ${chordSymbol(chord)} as ${formatFrets(shape.frets)}`}
            onClick={() => strum(shape)}
          >
            <BoxDiagram box={chordBox(guitar, chord, shape)} />
          </button>
          <div class="box-nav">
            <button
              type="button"
              aria-label="Previous shape"
              disabled={shapes.length < 2}
              onClick={() => step(-1)}
            >
              ◀
            </button>
            <span>
              {at + 1} of {shapes.length}
            </span>
            <button
              type="button"
              aria-label="Next shape"
              disabled={shapes.length < 2}
              onClick={() => step(1)}
            >
              ▶
            </button>
          </div>
          <p class="muted box-info">
            {formatFrets(shape.frets)}
            {shape.inversion !== undefined &&
              ` · ${inversionName(shape.inversion)}`}
          </p>
        </>
      ) : (
        <p class="muted">No shapes with these filters.</p>
      )}
      <details class="filters">
        <summary>Filters</summary>
        <label>
          Inversion
          <select
            value={String(filters.inversion)}
            onChange={(e) => {
              const v = e.currentTarget.value
              set({ inversion: v === 'chord' || v === 'any' ? v : Number(v) })
            }}
          >
            {inversionChoices(chord).map(([value, label]) => (
              <option key={value} value={String(value)}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Strings
          <select
            value={filters.strings}
            onChange={(e) =>
              set({
                strings: e.currentTarget.value as ShapeFilters['strings'],
              })
            }
          >
            {STRING_SETS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Stretch
          <select
            value={filters.maxSpan}
            onChange={(e) => set({ maxSpan: Number(e.currentTarget.value) })}
          >
            {SPANS.map((span) => (
              <option key={span} value={span}>
                {span} frets
              </option>
            ))}
          </select>
        </label>
        <label class="check">
          <input
            type="checkbox"
            checked={filters.openStrings}
            onChange={(e) => set({ openStrings: e.currentTarget.checked })}
          />
          Open strings
        </label>
        <label class="check">
          <input
            type="checkbox"
            checked={filters.omitFifth}
            onChange={(e) => set({ omitFifth: e.currentTarget.checked })}
          />
          Leave out the 5th
        </label>
      </details>
    </section>
  )
}

// SPEC 5 (playback): guitar chords strum low to high, using the shape on
// screen.
export function strum(shape: Fingering) {
  const notes = shape.notes.filter((n): n is Note => n !== null)
  void playChord(notes, { strum: true })
}

const GAP = 16 // between strings
const ROW = 20 // per fret
const LEFT = 26 // room for the first fret's number
const TOP = 18 // room for open and muted marks
const RADIUS = 7

// The box as SVG: strings upright, low string on the left; frets across,
// with the nut or capo drawn thick at the top; dots coloured and labelled by
// chord tone; ○ over open strings and × over muted ones; and each string's
// fret written underneath.
function BoxDiagram({ box }: { box: ChordBox }) {
  const count = box.strings.length
  const width = LEFT + (count - 1) * GAP + RADIUS + 4
  const bottom = TOP + box.rows * ROW
  const height = bottom + 18
  const x = (s: number) => LEFT + s * GAP
  return (
    <svg
      class="box-diagram"
      viewBox={`0 0 ${width} ${height}`}
      width={width * 1.25}
      height={height * 1.25}
      aria-hidden="true"
    >
      {Array.from({ length: box.rows + 1 }, (_, r) => (
        <line
          key={`fret-${r}`}
          class={r === 0 && box.top !== 'none' ? `top ${box.top}` : 'fret'}
          x1={x(0)}
          x2={x(count - 1)}
          y1={TOP + r * ROW}
          y2={TOP + r * ROW}
        />
      ))}
      {box.strings.map((_, s) => (
        <line
          key={`string-${s}`}
          class="string"
          x1={x(s)}
          x2={x(s)}
          y1={TOP}
          y2={bottom}
        />
      ))}
      {box.top === 'none' && (
        <text class="first-fret" x={LEFT - 10} y={TOP + ROW / 2 + 4}>
          {box.first}
        </text>
      )}
      {box.strings.map((string, s) => {
        const below = (
          <text key={`n-${s}`} class="fret-text" x={x(s)} y={bottom + 14}>
            {string.fret === null ? 'x' : string.fret}
          </text>
        )
        if (string.fret === null) {
          return [
            <text key={`m-${s}`} class="mark" x={x(s)} y={TOP - 5}>
              ×
            </text>,
            below,
          ]
        }
        const role = string.tone ? `tone-${string.tone.role}` : ''
        if (string.open) {
          return [
            <circle
              key={`o-${s}`}
              class={`open-ring ${role}`}
              cx={x(s)}
              cy={TOP - 8}
              r={5}
            />,
            below,
          ]
        }
        const cy = TOP + ((string.row as number) - 0.5) * ROW
        return [
          <circle
            key={`d-${s}`}
            class={`box-dot ${role}`}
            cx={x(s)}
            cy={cy}
            r={RADIUS}
          />,
          <text key={`l-${s}`} class="dot-label" x={x(s)} y={cy + 3}>
            {string.tone?.label}
          </text>,
          below,
        ]
      })}
    </svg>
  )
}
