import { playChord } from '../audio/player'
import { chordTones } from '../instruments/chord-tones'
import {
  chordSymbol,
  formatNote,
  midiNumber,
  pitchClass,
  type ChordName,
  type Note,
} from '../theory'
import type { Voicing } from './voicing-choices'

// The voicing box beside the keyboard (David's layout, matching the chord
// boxes beside the neck): the current chord's voicing on a small keyboard,
// coloured by chord tone, with ◀ ▶ to step through close, open, drop-2,
// drop-3, spread and the left/right-hand split. Clicking it plays it.
export function KeyboardVoicings({
  chord,
  voicings,
  at,
  onAt,
}: {
  chord: ChordName
  voicings: Voicing[]
  at: number
  onAt: (at: number) => void
}) {
  const voicing = voicings[at]
  const step = (by: number) =>
    onAt((at + by + voicings.length) % voicings.length)
  const names = (notes: Note[]) => notes.map((n) => formatNote(n)).join(' ')
  const right = voicing.left ? voicing.notes.slice(voicing.left.length) : []
  return (
    <section class="chord-boxes keys-box" aria-label="Keyboard voicings">
      <h3>
        {chordSymbol(chord)} · {voicing.label}
      </h3>
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
      </p>
    </section>
  )
}

const WHITE = 11
const HEIGHT = 46
const BLACK_HEIGHT = 28
const BLACK_PCS = new Set([1, 3, 6, 8, 10])

// Whole octaves from the C at or below the lowest note to the B at or above
// the highest, with a dot on each note of the voicing.
function MiniKeyboard({ chord, notes }: { chord: ChordName; notes: Note[] }) {
  const midis = notes.map((n) => midiNumber(n) as number)
  const low = Math.floor(Math.min(...midis) / 12) * 12
  const high = Math.floor(Math.max(...midis) / 12) * 12 + 11
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
