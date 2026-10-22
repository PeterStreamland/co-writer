import { useEffect, useState } from 'preact/hooks'
import { formatNote, type ChordName, type Key } from '../theory'
import { preparePiano } from '../audio/player'
import { useMidi } from '../midi/useMidi'
import { ChordRows } from './ChordRows'
import { InstrumentView, type Instrument } from './InstrumentView'
import { MidiPanel } from './MidiPanel'
import { SidePanel } from './SidePanel'
import { useNarrow } from './useNarrow'
import { played } from './played'
import {
  keyName,
  loadKey,
  saveKey,
  scaleGroups,
  scaleView,
  signatureText,
  swapTarget,
  tonicOptions,
  tonicValue,
  withScale,
  withTonic,
} from './key-picker'

// The single workspace (SPEC 2): the key picker in the header; the stage,
// with the scale above the instrument view and MIDI input below it (David's
// choice); and the side panel's tools (Explore holds the chord rows) under
// it. On a phone the side panel is a sheet along the bottom, holding the
// scale as well.
export function Workspace() {
  const [key, setKey] = useState<Key>(loadKey)
  const [chord, setChord] = useState<ChordName>()
  const [instrument, setInstrument] = useState<Instrument>('keyboard')
  const [sheetOpen, setSheetOpen] = useState(true)
  useEffect(() => saveKey(key), [key])
  useEffect(preparePiano, [])
  const midi = useMidi()
  const playing = played(key, midi.held)
  // On a phone the scale joins the chords in the sheet, so the instrument
  // stays in sight; on wider screens it sits above the instrument.
  const narrow = useNarrow()
  const scale = <ScalePanel value={key} />
  const explore = (
    <>
      {narrow && scale}
      <ChordRows
        value={key}
        current={chord}
        onSelect={setChord}
        strum={instrument === 'guitar'}
      />
    </>
  )
  return (
    <div class={sheetOpen ? 'workspace sheet-open' : 'workspace'}>
      <header class="top">
        <h1 class="app-name">Co-Writer</h1>
        <KeyPicker value={key} onChange={setKey} />
      </header>
      <div class="layout">
        <main class="stage">
          {!narrow && scale}
          <InstrumentView
            value={key}
            chord={chord}
            played={playing.notes}
            instrument={instrument}
            onInstrumentChange={setInstrument}
          />
          <MidiPanel midi={midi} playing={playing} />
        </main>
        <SidePanel
          tabs={[{ id: 'explore', label: 'Explore', content: explore }]}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
        />
        <footer>
          <a href="#/audit">Phase 1 audit table</a>
        </footer>
      </div>
    </div>
  )
}

function KeyPicker({
  value,
  onChange,
}: {
  value: Key
  onChange: (key: Key) => void
}) {
  const [showAll, setShowAll] = useState(false)
  const swapped = swapTarget(value)
  return (
    <div class="key-picker">
      <label>
        Key
        <select
          value={tonicValue(value)}
          onChange={(e) => onChange(withTonic(value, e.currentTarget.value))}
        >
          {tonicOptions(value).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Scale
        <select
          value={value.mode}
          onChange={(e) => onChange(withScale(value, e.currentTarget.value))}
        >
          {scaleGroups(showAll, value.mode).map((group) => (
            <optgroup key={group.label} label={group.label}>
              {group.scales.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>
      <button type="button" onClick={() => setShowAll(!showAll)}>
        {showAll ? 'Fewer scales' : 'More…'}
      </button>
      <button
        type="button"
        disabled={!swapped}
        title={
          swapped
            ? `Switch to ${keyName(swapped)}`
            : 'The other spelling would need more than seven sharps or flats'
        }
        onClick={() => swapped && onChange(swapped)}
      >
        ⇄ {swapped ? formatNote(swapped.tonic) : 'No other spelling'}
      </button>
    </div>
  )
}

function ScalePanel({ value }: { value: Key }) {
  const view = scaleView(value)
  const signature = signatureText(value)
  return (
    <section class="explore">
      <h2>{keyName(value)}</h2>
      <p class="muted">
        Key signature: {signature ?? 'none of its own (not a mode)'}
      </p>
      <ol class="degrees">
        {view.degrees.map((degree, i) => (
          <li key={degree.label + degree.note}>
            <div class="degree">
              <span class="label">{degree.label}</span>
              <span class="note">{degree.note}</span>
              <span class="interval">{degree.interval}</span>
              <span class="name">{degree.name}</span>
            </div>
            <span
              class="step"
              title={`${view.semitones[i]} semitone${view.semitones[i] > 1 ? 's' : ''}`}
            >
              {view.steps[i]}
            </span>
          </li>
        ))}
      </ol>
      <p class="pattern">
        <span class="muted">Step pattern:</span> {view.steps.join(' ')}
        <span class="muted"> (T tone, S semitone)</span>
      </p>
    </section>
  )
}
