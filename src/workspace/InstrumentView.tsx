import { useEffect, useState } from 'preact/hooks'
import { playChord } from '../audio/player'
import {
  DEFAULT_FRETS,
  DOT_FRETS,
  DOUBLE_DOT_FRETS,
  fretboardGrid,
} from '../instruments/fretboard'
import {
  KEYBOARD_HIGH,
  KEYBOARD_LOW,
  pianoKeys,
  type PianoKey,
} from '../instruments/keyboard'
import { noteMarker, type Mark } from '../instruments/marks'
import { TUNINGS, tuningStrings } from '../instruments/tunings'
import { formatNote, type ChordName, type Key, type Note } from '../theory'

export type Instrument = 'keyboard' | 'guitar'
type Labels = 'names' | 'degrees'

// The instrument view (SPEC 2, 5): keyboard or full-neck fretboard, with the
// scale highlighted, the root marked and the current chord filled orange.
// Clicking a highlighted note plays it.
export function InstrumentView({
  value,
  chord,
  instrument,
  onInstrumentChange,
}: {
  value: Key
  chord: ChordName | undefined
  instrument: Instrument
  onInstrumentChange: (instrument: Instrument) => void
}) {
  const [labels, setLabels] = useState<Labels>('names')
  const [tuning, setTuning] = useState('standard')
  const [strings, setStrings] = useState<'6' | '7'>('6')
  const mark = noteMarker(value, chord)
  return (
    <section class="instrument">
      <div class="toolbar">
        <Toggle
          label="Instrument"
          value={instrument}
          options={[
            ['keyboard', 'Keyboard'],
            ['guitar', 'Guitar'],
          ]}
          onChange={onInstrumentChange}
        />
        <Toggle
          label="Labels"
          value={labels}
          options={[
            ['names', 'Note names'],
            ['degrees', 'Degrees'],
          ]}
          onChange={setLabels}
        />
        {instrument === 'guitar' && (
          <>
            <label class="tuning">
              Tuning
              <select
                value={tuning}
                onChange={(e) => setTuning(e.currentTarget.value)}
              >
                {TUNINGS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
            <Toggle
              label="Strings"
              value={strings}
              options={[
                ['6', '6-string'],
                ['7', '7-string'],
              ]}
              onChange={setStrings}
            />
          </>
        )}
      </div>
      {instrument === 'keyboard' ? (
        <Keyboard mark={mark} labels={labels} />
      ) : (
        <Fretboard
          strings={tuningStrings(tuning, strings === '7')}
          mark={mark}
          labels={labels}
        />
      )}
      <p class="legend muted">
        <span class="dot root" /> root <span class="dot scale" /> in the scale{' '}
        {chord && (
          <>
            <span class="dot chord-tone" /> in the current chord
          </>
        )}
      </p>
    </section>
  )
}

function Toggle<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: [T, string][]
  onChange: (value: T) => void
}) {
  return (
    <div class="toggle" role="group" aria-label={label}>
      {options.map(([option, text]) => (
        <button
          key={option}
          type="button"
          aria-pressed={value === option}
          onClick={() => onChange(option)}
        >
          {text}
        </button>
      ))}
    </div>
  )
}

function markClass(mark: Mark): string {
  return [
    'dot',
    mark.root ? 'root' : mark.inScale ? 'scale' : 'outside',
    // The root stays plain red, even when it is in the current chord.
    mark.chordTone && !mark.root ? 'chord-tone' : '',
  ].join(' ')
}

function play(mark: Mark | undefined) {
  if (mark) void playChord([mark.note], { seconds: 1 })
}

function useNarrow(): boolean {
  const query = '(max-width: 40rem)'
  const [narrow, setNarrow] = useState(() => matchMedia(query).matches)
  useEffect(() => {
    const list = matchMedia(query)
    const onChange = () => setNarrow(list.matches)
    list.addEventListener('change', onChange)
    return () => list.removeEventListener('change', onChange)
  }, [])
  return narrow
}

// Four octaves, C2–C6, on a laptop; two on a phone, with octave buttons.
function Keyboard({
  mark,
  labels,
}: {
  mark: (midi: number) => Mark | undefined
  labels: Labels
}) {
  const narrow = useNarrow()
  const [low, setLow] = useState(48) // C3
  const range = narrow
    ? { low, high: low + 24 }
    : { low: KEYBOARD_LOW, high: KEYBOARD_HIGH }
  const keys = pianoKeys(range.low, range.high, mark)
  const whites = keys.filter((k) => !k.black)
  const width = 100 / whites.length
  let whiteIndex = 0
  const placed = keys.map((k) => {
    // A black key straddles the line between the white keys either side.
    const left = k.black ? (whiteIndex - 0.3) * width : whiteIndex++ * width
    return { key: k, left }
  })
  const label = (m: Mark) => (labels === 'names' ? m.name : m.degree)
  const pianoKey = ({ key: k, left }: { key: PianoKey; left: number }) => (
    <button
      key={k.midi}
      type="button"
      class={k.black ? 'key black' : 'key white'}
      style={{
        left: `${left}%`,
        width: `${k.black ? width * 0.6 : width}%`,
      }}
      disabled={!k.mark}
      aria-label={
        k.mark ? `${k.mark.name}, degree ${k.mark.degree}` : undefined
      }
      onClick={() => play(k.mark)}
    >
      {k.mark && <span class={markClass(k.mark)}>{label(k.mark)}</span>}
    </button>
  )
  return (
    <div>
      {narrow && (
        <div class="octaves">
          <button
            type="button"
            disabled={low <= KEYBOARD_LOW}
            onClick={() => setLow(low - 12)}
          >
            ◀ Lower
          </button>
          <span class="muted">
            C{low / 12 - 1}–C{low / 12 + 1}
          </span>
          <button
            type="button"
            disabled={low + 24 >= KEYBOARD_HIGH}
            onClick={() => setLow(low + 12)}
          >
            Higher ▶
          </button>
        </div>
      )}
      <div class="keyboard">
        {placed.filter((p) => !p.key.black).map(pianoKey)}
        {placed.filter((p) => p.key.black).map(pianoKey)}
      </div>
    </div>
  )
}

// Horizontal tab view: nut on the left, low string at the bottom (SPEC 5),
// each string's open note named on the far left.
function Fretboard({
  strings,
  mark,
  labels,
}: {
  strings: Note[]
  mark: (midi: number) => Mark | undefined
  labels: Labels
}) {
  const grid = fretboardGrid(strings, DEFAULT_FRETS, mark)
  const frets = grid[0].map((f) => f.fret)
  const label = (m: Mark) => (labels === 'names' ? m.name : m.degree)
  return (
    <div class="scroll">
      <div
        class="fretboard"
        style={{
          gridTemplateColumns: `1.75rem 2.5rem repeat(${frets.length - 1}, 3rem)`,
        }}
      >
        {[...grid].reverse().flatMap((row) => [
          <span key={`name-${row[0].string}`} class="string-name">
            {formatNote(strings[row[0].string]).replace(/\d+$/, '')}
          </span>,
          ...row.map((spot) => (
            <button
              key={`${spot.string}-${spot.fret}`}
              type="button"
              class={spot.fret === 0 ? 'fret open' : 'fret'}
              disabled={!spot.mark}
              aria-label={
                spot.mark
                  ? `${spot.mark.name} on string ${grid.length - spot.string}, fret ${spot.fret}`
                  : undefined
              }
              onClick={() => play(spot.mark)}
            >
              {spot.mark && (
                <span class={markClass(spot.mark)}>{label(spot.mark)}</span>
              )}
            </button>
          )),
        ])}
        <span />
        {frets.map((fret) => (
          <span key={fret} class="fret-number">
            {fret}
            {DOT_FRETS.has(fret) && (
              <span class="inlay">
                {DOUBLE_DOT_FRETS.has(fret) ? '••' : '•'}
              </span>
            )}
          </span>
        ))}
      </div>
    </div>
  )
}
