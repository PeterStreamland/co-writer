import { useEffect, useState } from 'preact/hooks'
import { formatNote, type ChordName, type Key } from '../theory'
import { ChordRows } from './ChordRows'
import { InstrumentView } from './InstrumentView'
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

// The single workspace (SPEC 2): the header key picker, the Explore panel's
// scale view, the instrument view and the chord rows; the rest arrives task
// by task.
export function Workspace() {
  const [key, setKey] = useState<Key>(loadKey)
  const [chord, setChord] = useState<ChordName>()
  useEffect(() => saveKey(key), [key])
  return (
    <div class="workspace">
      <header>
        <KeyPicker value={key} onChange={setKey} />
      </header>
      <main>
        <ScalePanel value={key} />
        <InstrumentView value={key} chord={chord} />
        <ChordRows value={key} current={chord} onSelect={setChord} />
      </main>
      <footer>
        <a href="#/audit">Phase 1 audit table</a>
        <a href="#/spike">Library spike</a>
      </footer>
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
      <h1>{keyName(value)}</h1>
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
