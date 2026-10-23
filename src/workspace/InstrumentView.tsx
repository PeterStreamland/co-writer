import { useEffect, useState } from 'preact/hooks'
import { playChord } from '../audio/player'
import type { BoxActions } from './AddButton'
import { ChordBoxes } from './ChordBoxes'
import { KeyboardVoicings } from './KeyboardVoicings'
import type { Voicing, VoicingFilters } from './voicing-choices'
import type { ShapeFilters } from './shape-filters'
import { useNarrow } from './useNarrow'
import type { ChordVoicing } from '../sketch/progression'
import {
  DOT_FRETS,
  DOUBLE_DOT_FRETS,
  fretboardGrid,
} from '../instruments/fretboard'
import type { Fingering } from '../instruments/fingering'
import {
  DEFAULT_FRET_RANGE,
  MAX_CAPO,
  capoNotes,
  makeGuitar,
  type Guitar,
} from '../instruments/guitar'
import {
  KEYBOARD_HIGH,
  KEYBOARD_LOW,
  pianoKeys,
  scrollToHeld,
  type PianoKey,
} from '../instruments/keyboard'
import { noteMarker, type Mark } from '../instruments/marks'
import type { Spot } from '../instruments/arpeggio-guitar'
import { TUNINGS, tuningStrings } from '../instruments/tunings'
import {
  formatNote,
  midiNumber,
  type ChordName,
  type Key,
  type Note,
} from '../theory'

export type Instrument = 'keyboard' | 'guitar'

// An arpeggio on show from the Arpeggio tab: its notes (lowest first), each
// with its interval label, and on guitar the spot each sits on; the note
// sounding, if it is playing.
export type ArpeggioShow = {
  notes: { note: Note; midi: number; label: string }[]
  spots?: Spot[]
  sounding?: number
}
type Labels = 'names' | 'degrees' | 'chord-tones'

export type GuitarSettings = {
  tuning: string
  strings: '6' | '7'
  capo: number
  lastFret: number
}

export const DEFAULT_GUITAR: GuitarSettings = {
  tuning: 'standard',
  strings: '6',
  capo: 0,
  lastFret: DEFAULT_FRET_RANGE.high,
}

export function guitarFrom(settings: GuitarSettings): Guitar {
  return makeGuitar(tuningStrings(settings.tuning, settings.strings === '7'), {
    capo: settings.capo,
    high: settings.lastFret,
  })
}

// The current chord's shapes, for the chord boxes, and which one is showing.
export type Shapes = {
  list: Fingering[]
  at: number
  onAt: (at: number) => void
  filters: ShapeFilters
  onFiltersChange: (filters: ShapeFilters) => void
  // Adds the shape, inversion and all, to the progression.
  onAdd?: (chord: ChordName, voicing: ChordVoicing) => void
  // Puts the shape in place of the selected chord.
  replace?: BoxActions['replace']
}

// The current chord's keyboard voicings, and which one is showing.
export type Voicings = {
  list: Voicing[]
  at: number
  onAt: (at: number) => void
  filters: VoicingFilters
  onFiltersChange: (filters: VoicingFilters) => void
  // Adds the voicing, inversion and all, to the progression.
  onAdd?: (chord: ChordName, voicing: ChordVoicing) => void
  // Puts the voicing in place of the selected chord.
  replace?: BoxActions['replace']
}

// The instrument view (SPEC 2, 5): keyboard or full-neck fretboard, with the
// scale highlighted, the root marked, the current chord filled orange and
// notes played on the MIDI keyboard in green. With Chord tones as the labels,
// the chord's notes are coloured by interval and the rest of the scale fades
// (task 9). The guitar view shows the chord boxes beside the neck, with the
// shape on show marked on it (task 8). Clicking a highlighted note plays it.
export function InstrumentView({
  value,
  chord,
  played,
  instrument,
  onInstrumentChange,
  settings,
  onSettingsChange,
  shapes,
  voicings,
  arpeggio,
  addable = true,
}: {
  value: Key
  chord: ChordName | undefined
  played: Note[]
  instrument: Instrument
  onInstrumentChange: (instrument: Instrument) => void
  settings: GuitarSettings
  onSettingsChange: (settings: GuitarSettings) => void
  shapes: Shapes
  voicings: Voicings
  // An arpeggio to light and label in place of the chord's shape.
  arpeggio?: ArpeggioShow
  // Whether the chord box beside the instrument has + to add the shape (on a
  // phone, where it is the only box). On wider screens the box with + sits
  // beside the side panel, and this one is a viewer, in step with it
  // (David's choice).
  addable?: boolean
}) {
  const [labels, setLabels] = useState<Labels>('names')
  const { tuning, strings, capo, lastFret } = settings
  const change = (part: Partial<GuitarSettings>) =>
    onSettingsChange({ ...settings, ...part })
  const setTuning = (tuning: string) => change({ tuning })
  const setStrings = (strings: '6' | '7') => change({ strings })
  const setCapo = (capo: number) => change({ capo })
  const setLastFret = (lastFret: number) => change({ lastFret })
  const mark = noteMarker(
    value,
    chord,
    played,
    arpeggio?.notes.map((n) => n.note),
  )
  const toneColours = labels === 'chord-tones' && chord !== undefined
  const guitar = guitarFrom(settings)
  const shape = chord && !arpeggio ? shapes.list[shapes.at] : undefined
  const voicing = chord && !arpeggio ? voicings.list[voicings.at] : undefined
  const held = played.map((n) => midiNumber(n) as number)
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
            ['chord-tones', 'Chord tones'],
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
                {[...new Set(TUNINGS.map((t) => t.group))].map((group) => (
                  <optgroup key={group} label={group}>
                    {TUNINGS.filter((t) => t.group === group).map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </optgroup>
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
            <label class="tuning">
              Capo
              <select
                value={capo}
                onChange={(e) => setCapo(Number(e.currentTarget.value))}
              >
                {Array.from({ length: MAX_CAPO + 1 }, (_, fret) => (
                  <option key={fret} value={fret}>
                    {fret === 0 ? 'None' : `Fret ${fret}`}
                  </option>
                ))}
              </select>
            </label>
            <label class="tuning">
              Frets
              <select
                value={lastFret}
                onChange={(e) => setLastFret(Number(e.currentTarget.value))}
              >
                {LAST_FRETS.map((fret) => (
                  <option key={fret} value={fret}>
                    0–{fret}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}
      </div>
      {instrument === 'keyboard' ? (
        <div class="with-box">
          <Keyboard
            mark={mark}
            labels={labels}
            toneColours={toneColours}
            held={held}
            voiced={voicing?.notes.map((n) => midiNumber(n) as number)}
            arpeggio={arpeggio}
          />
          {!arpeggio && (
            <ChordBox
              instrument={instrument}
              guitar={guitar}
              chord={chord}
              shapes={addable ? shapes : viewOnly(shapes)}
              voicings={addable ? voicings : viewOnly(voicings)}
            />
          )}
        </div>
      ) : (
        <div class="with-box">
          <Fretboard
            guitar={guitar}
            keyValue={value}
            mark={mark}
            labels={labels}
            toneColours={toneColours}
            shape={shape?.frets}
            arpeggio={arpeggio}
          />
          {!arpeggio && (
            <ChordBox
              instrument={instrument}
              guitar={guitar}
              chord={chord}
              shapes={addable ? shapes : viewOnly(shapes)}
              voicings={addable ? voicings : viewOnly(voicings)}
            />
          )}
        </div>
      )}
      <p class="legend muted">
        {toneColours ? (
          <>
            <span class="dot tone-root" /> root <span class="dot tone-third" />{' '}
            3rd <span class="dot tone-fifth" /> 5th{' '}
            <span class="dot tone-seventh" /> 7th{' '}
            <span class="dot tone-extension" /> 9th, 11th, 13th and other tones{' '}
            <span class="dot faded" /> rest of the scale
          </>
        ) : (
          <>
            <span class="dot root" /> root <span class="dot scale" /> in the
            scale{' '}
            {chord && (
              <>
                <span class="dot chord-tone" /> in the current chord
              </>
            )}
          </>
        )}
        {played.length > 0 && (
          <>
            {' '}
            <span class="dot held" /> playing
          </>
        )}
      </p>
    </section>
  )
}

// The chord box (David's layout): the current chord's guitar shapes or
// keyboard voicings, whichever instrument is showing, with + to add the
// shape on show to the progression. Beside the side panel on wider screens,
// beside the instrument on a phone.
export function ChordBox({
  instrument,
  guitar,
  chord,
  shapes,
  voicings,
}: {
  instrument: Instrument
  guitar: Guitar
  chord: ChordName | undefined
  shapes: Shapes
  voicings: Voicings
}) {
  if (instrument === 'keyboard') {
    const voicing = chord ? voicings.list[voicings.at] : undefined
    return chord && voicing ? (
      <KeyboardVoicings
        chord={chord}
        voicings={voicings.list}
        at={voicings.at}
        onAt={voicings.onAt}
        filters={voicings.filters}
        onFiltersChange={voicings.onFiltersChange}
        onAdd={voicings.onAdd}
        replace={voicings.replace}
      />
    ) : (
      <EmptyBox label="Keyboard voicings" what="voicings" />
    )
  }
  return chord ? (
    <ChordBoxes
      guitar={guitar}
      chord={chord}
      shapes={shapes.list}
      at={shapes.at}
      onAt={shapes.onAt}
      filters={shapes.filters}
      onFiltersChange={shapes.onFiltersChange}
      onAdd={shapes.onAdd}
      replace={shapes.replace}
    />
  ) : (
    <EmptyBox label="Chord shapes" what="guitar shapes" />
  )
}

// The viewer beside the instrument: the box without its buttons.
function viewOnly<T extends BoxActions>(list: T): T {
  return { ...list, onAdd: undefined, replace: undefined }
}

// The box before a chord is chosen, so its place is always there (David's
// layout).
function EmptyBox({ label, what }: { label: string; what: string }) {
  return (
    <section class="chord-boxes empty" aria-label={label}>
      <h3>{label}</h3>
      <p class="muted">
        Pick a chord, or play one on your MIDI keyboard, to see its {what} here.
      </p>
    </section>
  )
}

// The last fret shown and searched: 15 by default, up to 24 (SPEC 5).
const LAST_FRETS = [15, 17, 19, 21, 22, 24]

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

function markClass(mark: Mark, toneColours: boolean): string {
  if (toneColours && !mark.held) {
    return mark.tone ? `dot tone-${mark.tone.role}` : 'dot faded'
  }
  return [
    'dot',
    mark.held
      ? 'held'
      : mark.root
        ? 'root'
        : mark.inScale
          ? 'scale'
          : 'outside',
    // The root stays plain red, even when it is in the current chord.
    mark.chordTone && !mark.root && !mark.held ? 'chord-tone' : '',
  ].join(' ')
}

// A dot's label: the note name, its degree in the key, or with chord-tone
// colours its interval in the chord (R, ♭3, 5); a scale note outside the
// chord keeps its name, faded.
function markLabel(mark: Mark, labels: Labels, toneColours: boolean): string {
  if (toneColours && mark.tone) return mark.tone.label
  return labels === 'degrees' ? mark.degree : mark.name
}

function play(mark: Mark | undefined) {
  if (mark) void playChord([mark.note], { seconds: 1 })
}

// Four octaves, C2–C6, on a laptop; two on a phone, with octave buttons.
// Either view scrolls to bring notes played on the MIDI keyboard into sight.
function Keyboard({
  mark,
  labels,
  toneColours,
  held,
  voiced = [],
  arpeggio,
}: {
  mark: (midi: number) => Mark | undefined
  labels: Labels
  toneColours: boolean
  held: number[]
  voiced?: number[] // the voicing on show beside the keyboard, ringed
  arpeggio?: ArpeggioShow
}) {
  const narrow = useNarrow()
  const span = narrow ? 24 : KEYBOARD_HIGH - KEYBOARD_LOW
  const [low, setLow] = useState(narrow ? 48 : KEYBOARD_LOW) // C3 or C2
  // The arpeggio's notes, by pitch, with their labels; and the one sounding.
  const arpeggioAt = new Map(arpeggio?.notes.map((n) => [n.midi, n.label]))
  const sounding =
    arpeggio?.sounding === undefined
      ? undefined
      : arpeggio.notes[arpeggio.sounding]?.midi
  const inView = sounding === undefined ? held : [...held, sounding]
  useEffect(
    () => setLow((l) => scrollToHeld(l, span, inView)),
    [inView.join(), span],
  )
  const range = { low, high: low + span }
  const keys = pianoKeys(range.low, range.high, mark)
  const whites = keys.filter((k) => !k.black)
  const width = 100 / whites.length
  let whiteIndex = 0
  const placed = keys.map((k) => {
    // A black key straddles the line between the white keys either side.
    const left = k.black ? (whiteIndex - 0.3) * width : whiteIndex++ * width
    return { key: k, left }
  })
  const label = (m: Mark) => markLabel(m, labels, toneColours)
  const pianoKey = ({ key: k, left }: { key: PianoKey; left: number }) => (
    <button
      key={k.midi}
      type="button"
      class={[
        'key',
        k.black ? 'black' : 'white',
        voiced.includes(k.midi) || arpeggioAt.has(k.midi) ? 'in-shape' : '',
        (voiced.length || arpeggio) &&
        k.mark?.chordTone &&
        !voiced.includes(k.midi) &&
        !arpeggioAt.has(k.midi)
          ? 'off-shape'
          : '',
        k.midi === sounding ? 'sounding' : '',
      ].join(' ')}
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
      {k.mark && (
        <span class={markClass(k.mark, toneColours)}>
          {arpeggioAt.get(k.midi) ?? label(k.mark)}
        </span>
      )}
    </button>
  )
  return (
    <div class="keys">
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
// each string's open note named on the far left. Frets behind a capo are
// greyed out and the capo is drawn as a bar. The capo's fret is the new open
// position: a note there in the scale keeps its colour with a grey ring, and
// one outside the scale is named in grey.
function Fretboard({
  guitar,
  keyValue,
  mark,
  labels,
  toneColours,
  shape,
  arpeggio,
}: {
  guitar: Guitar
  keyValue: Key
  mark: (midi: number) => Mark | undefined
  labels: Labels
  toneColours: boolean
  shape?: (number | null)[]
  arpeggio?: ArpeggioShow
}) {
  const strings = guitar.strings
  const grid = fretboardGrid(guitar, mark)
  const capoNames = capoNotes(guitar, keyValue).map((n) =>
    formatNote({ ...n, octave: undefined }),
  )
  const frets = grid[0].map((f) => f.fret)
  const label = (m: Mark) => markLabel(m, labels, toneColours)
  // The arpeggio's spots, with their labels; and the one sounding.
  const at = (s: number, f: number) => `${s}:${f}`
  const arpeggioAt = new Map(
    arpeggio?.spots?.map((s, i) => [
      at(s.string, s.fret),
      arpeggio.notes[i].label,
    ]),
  )
  const soundingSpot =
    arpeggio?.sounding === undefined
      ? undefined
      : arpeggio.spots?.[arpeggio.sounding]
  const sounding = soundingSpot && at(soundingSpot.string, soundingSpot.fret)
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
              class={[
                'fret',
                spot.fret === 0 ? 'open' : '',
                spot.behindCapo ? 'behind-capo' : '',
                guitar.capo > 0 && spot.fret === guitar.capo ? 'capo' : '',
                shape?.[spot.string] === spot.fret ||
                arpeggioAt.has(at(spot.string, spot.fret))
                  ? 'in-shape'
                  : '',
                shape &&
                spot.mark?.chordTone &&
                shape[spot.string] !== spot.fret
                  ? 'off-shape'
                  : '',
                arpeggio &&
                spot.mark?.chordTone &&
                !arpeggioAt.has(at(spot.string, spot.fret))
                  ? 'off-shape'
                  : '',
                at(spot.string, spot.fret) === sounding ? 'sounding' : '',
              ].join(' ')}
              disabled={!spot.mark}
              aria-label={
                spot.mark
                  ? `${spot.mark.name} on string ${grid.length - spot.string}, fret ${spot.fret}`
                  : undefined
              }
              onClick={() => play(spot.mark)}
            >
              {spot.mark && (
                <span
                  class={
                    markClass(spot.mark, toneColours) +
                    (guitar.capo > 0 && spot.fret === guitar.capo
                      ? ' capo-open'
                      : '')
                  }
                >
                  {arpeggioAt.get(at(spot.string, spot.fret)) ??
                    label(spot.mark)}
                </span>
              )}
              {!spot.mark && guitar.capo > 0 && spot.fret === guitar.capo && (
                <span class="capo-name">{capoNames[spot.string]}</span>
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
