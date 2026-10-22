import { useEffect, useMemo, useState } from 'preact/hooks'
import {
  formatNote,
  chordKey,
  inversions,
  keyName as nameOfKey,
  type ChordName,
  type Key,
  type NextChordSuggestion,
  type StyleBlend,
} from '../theory'
import { playChord, preparePiano } from '../audio/player'
import { useMidi } from '../midi/useMidi'
import { findFingerings } from '../instruments/fingering'
import { ChordRows } from './ChordRows'
import { strum } from './ChordBoxes'
import {
  DEFAULT_GUITAR,
  InstrumentView,
  guitarFrom,
  type GuitarSettings,
  type Instrument,
} from './InstrumentView'
import {
  DEFAULT_VOICING_FILTERS,
  voicingChoices,
  type Voicing,
  type VoicingFilters,
} from './voicing-choices'
import {
  DEFAULT_FILTERS,
  fingeringOptions,
  type ShapeFilters,
} from './shape-filters'
import { MidiPanel } from './MidiPanel'
import { NO_CHORD, nextLastChord, type LastChord } from './last-chord'
import { SidePanel } from './SidePanel'
import { SuggestPanel } from './SuggestPanel'
import { StyleBlendControl } from './StyleBlendControl'
import { loadStyles } from './style-editor'
import { blendedWeights, loadBlend, saveBlend } from './style-blend'
import { ProgressionStrip } from './ProgressionStrip'
import {
  EMPTY_PROGRESSION,
  addAfter,
  chordsUpTo,
  keyAfter,
  pathNodes,
  selectNode,
  switchAt,
  type Progression,
} from '../sketch/progression'
import {
  record,
  redo,
  startHistory,
  undo,
  type History,
} from '../sketch/history'
import { loadProgression, saveProgression } from '../sketch/storage'
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

// How long after the current chord a previewed suggestion plays.
const PREVIEW_GAP_MS = 900

// The single workspace (SPEC 2): the key picker in the header; the stage,
// with the scale above the instrument view and MIDI input below it (David's
// choice); and the side panel's tools (Explore holds the chord rows) under
// it. On a phone the side panel is a sheet along the bottom, holding the
// scale as well.
export function Workspace() {
  const [key, setKey] = useState<Key>(loadKey)
  const [chord, setChord] = useState<ChordName>()
  // A suggestion being previewed shows on the instrument in place of the
  // current chord until it is used or the current chord changes.
  const [preview, setPreview] = useState<NextChordSuggestion>()
  useEffect(() => setPreview(undefined), [chord, key])
  const shown = preview?.candidate ?? chord
  // The style weights as edited on the Style weights page, blended by the
  // header's control.
  const styles = useMemo(() => loadStyles(), [])
  const [blend, setBlend] = useState<StyleBlend>(() => loadBlend(styles))
  useEffect(() => saveBlend(blend), [blend])
  const weights = useMemo(() => blendedWeights(styles, blend), [styles, blend])
  // The progression strip (SPEC 6.5), with undo and redo over every change,
  // and the selected chord, which suggestions follow. The current chord,
  // when it isn't the selected one (picked in Explore or played), counts as
  // the next chord: + on the strip adds it, and suggestions follow it.
  const [history, setHistory] = useState<History<Progression>>(() =>
    startHistory(loadProgression()),
  )
  const progression = history.present
  useEffect(() => saveProgression(progression), [progression])
  const path = pathNodes(progression)
  const [selectedAt, setSelectedAt] = useState(() => path.length - 1)
  const selected = Math.min(selectedAt, path.length - 1)
  const selectedChord = selected >= 0 ? path[selected].chord : undefined
  const freeChord =
    chord && (!selectedChord || chordKey(chord) !== chordKey(selectedChord))
      ? chord
      : undefined
  const previous = [
    ...chordsUpTo(progression, selected),
    ...(freeChord ? [freeChord] : []),
  ]
  const suggestKey = keyAfter(progression, selected, key)
  // A change to the progression, selecting a slot in the new path.
  function change(next: Progression, select: number) {
    setHistory(record(history, next))
    setSelectedAt(select)
    const n = pathNodes(next)[select]
    setChord(n?.chord)
  }
  function step(next: History<Progression>) {
    setHistory(next)
    const nodes = pathNodes(next.present)
    const at = Math.min(selected, nodes.length - 1)
    setSelectedAt(at)
    setChord(nodes[at]?.chord)
  }
  const [instrument, setInstrument] = useState<Instrument>('keyboard')
  const [sheetOpen, setSheetOpen] = useState(true)
  const [settings, setSettings] = useState<GuitarSettings>(DEFAULT_GUITAR)
  const [filters, setFilters] = useState<ShapeFilters>(DEFAULT_FILTERS)
  const [shapeAt, setShapeAt] = useState(0)
  // The keyboard voicing on show stays the same style from chord to chord,
  // or falls back to close position when a chord can't take it.
  const [pianoFilters, setPianoFilters] = useState<VoicingFilters>(
    DEFAULT_VOICING_FILTERS,
  )
  const [voicingPick, setVoicingPick] = useState<
    Pick<Voicing, 'id' | 'inversion'>
  >({ id: 'close' })
  const voicings = useMemo(
    () => (shown ? voicingChoices(shown, pianoFilters) : []),
    [shown, pianoFilters],
  )
  const voicingAt = Math.max(
    0,
    voicings.findIndex(
      (v) => v.id === voicingPick.id && v.inversion === voicingPick.inversion,
    ),
  )
  const guitar = useMemo(() => guitarFrom(settings), [settings])
  // The current chord's guitar shapes, easiest first; the chord boxes start
  // at the top one whenever the chord, guitar or filters change.
  // An inversion the chord doesn't have (a 3rd inversion of a triad) falls
  // back to the chord as chosen.
  const shapesOf = (c: ChordName) => {
    const usable =
      typeof filters.inversion === 'number' &&
      filters.inversion >= inversions(c).length
        ? { ...filters, inversion: 'chord' as const }
        : filters
    return findFingerings(
      guitar,
      c,
      fingeringOptions(usable, guitar.strings.length),
    )
  }
  const shapes = useMemo(
    () => (shown ? shapesOf(shown) : []),
    [shown, guitar, filters],
  )
  useEffect(() => setShapeAt(0), [shapes])
  useEffect(() => {
    if (
      chord &&
      typeof filters.inversion === 'number' &&
      filters.inversion >= inversions(chord).length
    ) {
      setFilters({ ...filters, inversion: 'chord' })
    }
  }, [chord])
  useEffect(() => saveKey(key), [key])
  useEffect(preparePiano, [])
  const midi = useMidi()
  const playing = played(key, midi.held)
  // The chord last played, kept after the keys come up; with Follow my
  // playing on, each one becomes the current chord.
  const [last, setLast] = useState<LastChord>(NO_CHORD)
  const [follow, setFollow] = useState(false)
  useEffect(
    () => setLast((l) => nextLastChord(l, playing)),
    [midi.held.join(), key],
  )
  const lastChord = last.names[0]?.chord
  useEffect(() => {
    if (follow && lastChord) setChord(lastChord)
  }, [follow, last.names])
  // Jump to a played chord's shapes on the other instrument: the guitar's
  // chord boxes from the keyboard (Phase 3 task 7), the keyboard's voicing
  // box from the guitar (David's choice).
  const showShapes = (c: ChordName) => {
    setChord(c)
    setInstrument(instrument === 'guitar' ? 'keyboard' : 'guitar')
  }
  // On a phone the scale joins the chords in the sheet, so the instrument
  // stays in sight; on wider screens it sits above the instrument.
  const narrow = useNarrow()
  const scale = <ScalePanel value={key} />
  // Plays a chord as the instrument view will show it: the top guitar shape
  // strummed (SPEC 5), or the keyboard's voicing. False when the guitar has
  // no shape for it.
  function playNow(c: ChordName): boolean {
    if (instrument === 'guitar') {
      const top = shapesOf(c)[0]
      if (top) strum(top)
      return Boolean(top)
    }
    const choices = voicingChoices(c, pianoFilters)
    const voicing =
      choices.find(
        (v) => v.id === voicingPick.id && v.inversion === voicingPick.inversion,
      ) ?? choices[0]
    void playChord(voicing.notes)
    return true
  }
  // Previewing a suggestion plays the last chord, then the suggestion.
  function previewSuggestion(s: NextChordSuggestion) {
    setPreview(s)
    const last = previous.at(-1)
    if (!last) {
      playNow(s.candidate)
      return
    }
    playNow(last)
    setTimeout(() => playNow(s.candidate), PREVIEW_GAP_MS)
  }
  // Using a suggestion adds it after the selected chord (after the current
  // chord too, when that isn't in the strip yet): at the end it extends the
  // progression, mid-strip it becomes an alternative at the next slot. A
  // pivot asks whether to carry on in its new key (SPEC 6.4).
  function acceptSuggestion(s: NextChordSuggestion) {
    const keyChange =
      s.keyChange && confirm(`Continue in ${nameOfKey(s.keyChange)} from here?`)
        ? s.keyChange
        : undefined
    let next = progression
    let at = selected
    if (freeChord) next = addAfter(next, at++, freeChord)
    next = addAfter(next, at++, s.candidate, keyChange)
    change(next, at)
    setPreview(undefined)
    playNow(s.candidate)
  }
  function selectSlot(index: number) {
    setSelectedAt(index)
    setChord(path[index].chord)
    playNow(path[index].chord)
  }
  const strip = (
    <ProgressionStrip
      progression={progression}
      sectionKey={key}
      selected={selected}
      freeChord={freeChord}
      canUndo={history.past.length > 0}
      canRedo={history.future.length > 0}
      onSelect={selectSlot}
      onSwitch={(index, by) => change(switchAt(progression, index, by), index)}
      onAddFree={() =>
        freeChord &&
        change(addAfter(progression, selected, freeChord), selected + 1)
      }
      onUndo={() => step(undo(history))}
      onRedo={() => step(redo(history))}
      onClear={() => change(EMPTY_PROGRESSION, -1)}
      onPickNode={(id) => {
        const next = selectNode(progression, id)
        change(next, next.activePath.indexOf(id))
      }}
    />
  )
  const suggest = (
    <SuggestPanel
      keyValue={suggestKey}
      previous={previous}
      weights={weights}
      preview={preview}
      onPreview={previewSuggestion}
      onAccept={acceptSuggestion}
    />
  )
  const explore = (
    <>
      {narrow && scale}
      <ChordRows
        value={key}
        current={chord}
        onSelect={setChord}
        onPlay={playNow}
      />
    </>
  )
  return (
    <div class={sheetOpen ? 'workspace sheet-open' : 'workspace'}>
      <header class="top">
        <h1 class="app-name">Co-Writer</h1>
        <KeyPicker value={key} onChange={setKey} />
        <StyleBlendControl styles={styles} value={blend} onChange={setBlend} />
      </header>
      <div class="layout">
        <main class="stage">
          {strip}
          {!narrow && scale}
          <InstrumentView
            value={key}
            chord={shown}
            played={playing.notes}
            instrument={instrument}
            onInstrumentChange={setInstrument}
            settings={settings}
            onSettingsChange={setSettings}
            shapes={{
              list: shapes,
              at: shapeAt < shapes.length ? shapeAt : 0,
              onAt: setShapeAt,
              filters,
              onFiltersChange: setFilters,
            }}
            voicings={{
              list: voicings,
              at: voicingAt,
              onAt: (at) => setVoicingPick(voicings[at]),
              filters: pianoFilters,
              onFiltersChange: setPianoFilters,
            }}
          />
          <MidiPanel
            midi={midi}
            playing={playing}
            last={last}
            follow={follow}
            onFollowChange={setFollow}
            shapesOn={instrument === 'guitar' ? 'keyboard' : 'guitar'}
            onShowShapes={showShapes}
          />
        </main>
        <SidePanel
          tabs={[
            { id: 'explore', label: 'Explore', content: explore },
            { id: 'suggest', label: 'Suggest', content: suggest },
          ]}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
        />
        <footer>
          <a href="#/audit">Phase 1 audit table</a>
          {' · '}
          <a href="#/styles">Style weights</a>
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

// The key's name, signature and step pattern, with its degrees beside them
// (David's layout).
function ScalePanel({ value }: { value: Key }) {
  const view = scaleView(value)
  const signature = signatureText(value)
  return (
    <section class="explore">
      <div class="scale-head">
        <h2>{keyName(value)}</h2>
        <p class="muted">
          Key signature: {signature ?? 'none of its own (not a mode)'}
        </p>
        <p class="pattern">
          <span class="muted">Step pattern:</span> {view.steps.join(' ')}
          <span class="muted"> (T tone, S semitone)</span>
        </p>
      </div>
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
    </section>
  )
}
