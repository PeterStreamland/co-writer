import { playChord } from '../audio/player'
import { chordTones } from '../instruments/chord-tones'
import {
  chordSymbol,
  formatNote,
  inversionName,
  midiNumber,
  pitchClass,
  type ChordName,
  type Note,
} from '../theory'
import { AddButton, type BoxActions } from './AddButton'
import type { ChordVoicing } from '../sketch/progression'
import { inversionChoices } from './shape-filters'
import { chordWithBass } from './voicing-chord'
import {
  LEFT_HANDS,
  type Voicing,
  type VoicingFilters,
} from './voicing-choices'

// The voicing box beside the keyboard (David's layout, matching the chord
// boxes beside the neck): the current chord's voicing on a small keyboard,
// coloured by chord tone, with ◀ ▶ to step through close, open, drop-2,
// drop-3, spread and the left/right-hand split, and the piano filters below
// (inversion, and the split's left hand). Clicking it plays it.
export function KeyboardVoicings({
  chord,
  voicings,
  at,
  onAt,
  filters,
  onFiltersChange,
  onAdd,
  replace,
}: {
  chord: ChordName
  voicings: Voicing[]
  at: number
  onAt: (at: number) => void
  filters: VoicingFilters
  onFiltersChange: (filters: VoicingFilters) => void
  onAdd?: (chord: ChordName, voicing: ChordVoicing) => void
  replace?: BoxActions['replace']
}) {
  const set = (change: Partial<VoicingFilters>) =>
    onFiltersChange({ ...filters, ...change })
  const voicing = voicings[at]
  const step = (by: number) =>
    onAt((at + by + voicings.length) % voicings.length)
  const names = (notes: Note[]) => notes.map((n) => formatNote(n)).join(' ')
  const right = voicing.left ? voicing.notes.slice(voicing.left.length) : []
  return (
    <section class="chord-boxes keys-box" aria-label="Keyboard voicings">
      <div class="box-head">
        <h3>
          {chordSymbol(chord)} · {voicing.label}
        </h3>
        {(onAdd || replace) && (
          <AddButton
            chord={chordWithBass(chord, voicing.notes)}
            voicing={{ instrument: 'keyboard', notes: voicing.notes }}
            onAdd={onAdd}
            replace={replace}
          />
        )}
      </div>
      <button
        type="button"
        class="box"
        aria-label={`Play ${chordSymbol(chord)}, ${voicing.label}: ${names(voicing.notes)}`}
        onClick={() => void playChord(voicing.notes)}
      >
        <MiniKeyboard chord={chord} notes={voicing.notes} />
      </button>
      <div class="box-nav">
        <button
          type="button"
          aria-label="Previous voicing"
          disabled={voicings.length < 2}
          onClick={() => step(-1)}
        >
          ◀
        </button>
        <span>
          {at + 1} of {voicings.length}
        </span>
        <button
          type="button"
          aria-label="Next voicing"
          disabled={voicings.length < 2}
          onClick={() => step(1)}
        >
          ▶
        </button>
      </div>
      <p class="muted box-info">
        {voicing.left ? (
          <>
            Left hand {names(voicing.left)}
            <br />
            Right hand {names(right)}
          </>
        ) : (
          names(voicing.notes)
        )}
        {voicing.inversion !== undefined && (
          <>
            <br />
            {inversionName(voicing.inversion)}
          </>
        )}
      </p>
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
          Left hand
          <select
            value={filters.left}
            onChange={(e) =>
              set({ left: e.currentTarget.value as VoicingFilters['left'] })
            }
          >
            {LEFT_HANDS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </details>
    </section>
  )
}

const WHITE = 11
const HEIGHT = 46
const BLACK_HEIGHT = 28
const BLACK_PCS = new Set([1, 3, 6, 8, 10])

// Whole octaves from the C at or below the lowest note to the B at or above
// the highest, with a dot on each note of the voicing. The Voice tab draws
// its keyboard voicings with it too, `tight`: just the white keys from the
// lowest note to the highest, so it reads at the size of a lens's chord.
export function MiniKeyboard({
  chord,
  notes,
  tight = false,
}: {
  chord: ChordName
  notes: Note[]
  tight?: boolean
}) {
  const midis = notes.map((n) => midiNumber(n) as number)
  const lowest = Math.min(...midis)
  const highest = Math.max(...midis)
  const low = tight
    ? lowest - (BLACK_PCS.has(lowest % 12) ? 1 : 0)
    : Math.floor(lowest / 12) * 12
  const high = tight
    ? highest + (BLACK_PCS.has(highest % 12) ? 1 : 0)
    : Math.floor(highest / 12) * 12 + 11
  const tones = chordTones(chord)
  const keys: { midi: number; black: boolean; x: number }[] = []
  let whites = 0
  for (let midi = low; midi <= high; midi++) {
    const black = BLACK_PCS.has(midi % 12)
    keys.push({ midi, black, x: black ? whites * WHITE - 3.5 : whites * WHITE })
    if (!black) whites++
  }
  const width = whites * WHITE + 1
  const role = (midi: number) => {
    const note = notes[midis.indexOf(midi)]
    return tones.get(pitchClass(note))
  }
  const dot = (k: (typeof keys)[number]) => {
    if (!midis.includes(k.midi)) return null
    const tone = role(k.midi)
    const cx = k.black ? k.x + 3.5 : k.x + WHITE / 2
    const cy = k.black ? BLACK_HEIGHT - 6 : HEIGHT - 7
    return [
      <circle
        key={`d-${k.midi}`}
        class={`box-dot ${tone ? `tone-${tone.role}` : ''}`}
        cx={cx}
        cy={cy}
        r={4.6}
      />,
      <text key={`t-${k.midi}`} class="dot-label" x={cx} y={cy + 2.2}>
        {tone?.label}
      </text>,
    ]
  }
  return (
    <svg
      class="box-diagram mini-keyboard"
      viewBox={`-0.5 -0.5 ${width} ${HEIGHT + 1}`}
      width={Math.min(width * 1.5, 208)}
      aria-hidden="true"
    >
      {keys
        .filter((k) => !k.black)
        .map((k) => (
          <rect
            key={k.midi}
            class="white-key"
            x={k.x}
            y={0}
            width={WHITE}
            height={HEIGHT}
          />
        ))}
      {keys.filter((k) => !k.black).flatMap(dot)}
      {keys
        .filter((k) => k.black)
        .map((k) => (
          <rect
            key={k.midi}
            class="black-key"
            x={k.x}
            y={0}
            width={7}
            height={BLACK_HEIGHT}
          />
        ))}
      {keys.filter((k) => k.black).flatMap(dot)}
    </svg>
  )
}
