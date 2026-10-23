import { useEffect, useMemo, useRef, useState } from 'preact/hooks'
import {
  barLength,
  chordSymbol,
  formatNote,
  lengthLabel,
  meterOfBar,
  chordKey,
  inversions,
  keyName as nameOfKey,
  midiNumber,
  type ChordName,
  type Key,
  type NextChordSuggestion,
  type StyleBlend,
} from '../theory'
import { playChord, preparePiano } from '../audio/player'
import { useMidi } from '../midi/useMidi'
import { IDLE, nextRecorder } from '../midi/record'
import { findFingerings } from '../instruments/fingering'
import { ChordRows } from './ChordRows'
import { strum } from './ChordBoxes'
import {
  ChordBox,
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
import { VoicePanel } from './VoicePanel'
import { ArpeggioBox } from './ArpeggioBox'
import { LinesPanel } from './LinesPanel'
import {
  ArpeggioPanel,
  type ArpeggioOnShow,
  type ArpeggioSource,
} from './ArpeggioPanel'
import { addLensVoicings } from './lens-columns'
import { StyleBlendControl } from './StyleBlendControl'
import { loadStyles } from './style-editor'
import { blendedWeights, loadBlend, saveBlend } from './style-blend'
import { ProgressionStrip, type Pulse } from './ProgressionStrip'
import {
  EMPTY_PROGRESSION,
  addAfter,
  addAllAfter,
  changeAt,
  chordsUpTo,
  insertAllBetween,
  insertBetween,
  setLengthAt,
  timingOf,
  keyAfter,
  keyAt,
  pathNodes,
  selectNode,
  switchAt,
  type ChordNode,
  type ChordVoicing,
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
import {
  flashesOf,
  loadBpm,
  loadTime,
  saveBpm,
  saveTime,
  secondsOf,
} from '../sketch/time'
import { useNarrow } from './useNarrow'
import { played } from './played'
import { recordedChord } from './recorded'
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
  // While the progression plays, the chord sounding shows on the
  // instrument.
  const [playingAt, setPlayingAt] = useState<number>()
  const [playingChord, setPlayingChord] = useState<ChordName>()
  // The beat and bar lights: each flash counts up so the light restarts.
  const [pulse, setPulse] = useState<Pulse>()
  // The tempo for playing the progression, remembered in this browser.
  const [bpm, setBpm] = useState(loadBpm)
  useEffect(() => saveBpm(bpm), [bpm])
  // The time signature and any bars that override it (SPEC 7.1).
  const [time, setTime] = useState(loadTime)
  useEffect(() => saveTime(time), [time])
  const shown = playingChord ?? preview?.candidate ?? chord
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
  // Where each chord falls in the bars, and how long it lasts there.
  const timing = useMemo(() => timingOf(progression, time), [progression, time])
  const path = pathNodes(progression)
  const [selectedAt, setSelectedAt] = useState(() => path.length - 1)
  const selected = Math.min(selectedAt, path.length - 1)
  const selectedChord = selected >= 0 ? path[selected].chord : undefined
  const freeChord =
    chord && (!selectedChord || chordKey(chord) !== chordKey(selectedChord))
      ? chord
      : undefined
  // Passing chords (SPEC 6.7): + between beside the selected chord fills
  // the gap to the next one, until another chord is selected.
  const [betweenAt, setBetweenAt] = useState<number>()
  const between =
    betweenAt === selected && selected + 1 < path.length ? betweenAt : undefined
  const nextChord = between === undefined ? undefined : path[between + 1].chord
  const previous = [
    ...chordsUpTo(progression, selected),
    ...(freeChord && between === undefined ? [freeChord] : []),
  ]
  const [tab, setTab] = useState('explore')
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
  // A chord from the progression shows in the shape it was added in, when
  // the chord box offers that shape; otherwise the boxes start at the top.
  const [wantFrets, setWantFrets] = useState<(number | null)[]>()
  useEffect(() => {
    const at = wantFrets
      ? shapes.findIndex((s) => s.frets.join() === wantFrets.join())
      : -1
    setShapeAt(Math.max(0, at))
  }, [shapes])
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
  // Record chords (SPEC 5): each chord held for 150 ms is added to the
  // progression once every key is up, as + would add it, keeping the notes
  // as played. A chord the app can't name is skipped, with a note saying so.
  const [recording, setRecording] = useState(false)
  const recorder = useRef(IDLE)
  const [unnamed, setUnnamed] = useState(false)
  useEffect(() => {
    recorder.current = IDLE
    setUnnamed(false)
  }, [recording])
  useEffect(() => {
    if (!recording) return
    const step = nextRecorder(recorder.current, midi.held, performance.now())
    recorder.current = step.state
    if (!step.commit) return
    const heard = recordedChord(suggestKey, step.commit)
    setUnnamed(!heard)
    if (heard) addChords([heard.chord], heard.voicing)
  }, [midi.held.join()])
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
  function playNow(c: ChordName, seconds?: number): boolean {
    if (instrument === 'guitar') {
      const top = shapesOf(c)[0]
      if (top) strum(top, seconds)
      return Boolean(top)
    }
    const choices = voicingChoices(c, pianoFilters)
    const voicing =
      choices.find(
        (v) => v.id === voicingPick.id && v.inversion === voicingPick.inversion,
      ) ?? choices[0]
    void playChord(voicing.notes, { seconds })
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
    if (between === undefined && (freeChord || selected < 0)) playNow(last)
    else playNode(path[selected])
    setTimeout(() => playNow(s.candidate), PREVIEW_GAP_MS)
    // A passing chord is heard between the two chords.
    if (between !== undefined) {
      const after = path[between + 1]
      setTimeout(() => playNode(after), 2 * PREVIEW_GAP_MS)
    }
  }
  // Using a suggestion adds it after the selected chord (after the current
  // chord too, when that isn't in the strip yet): at the end it extends the
  // progression, mid-strip it becomes an alternative at the next slot. A
  // pivot asks whether to carry on in its new key (SPEC 6.4).
  function acceptSuggestion(s: NextChordSuggestion) {
    if (between !== undefined) {
      insertPassing(between, s.candidate)
      setPreview(undefined)
      playNow(s.candidate)
      return
    }
    const keyChange =
      s.keyChange && confirm(`Continue in ${nameOfKey(s.keyChange)} from here?`)
        ? s.keyChange
        : undefined
    let next = progression
    let at = selected
    if (freeChord) next = addAfter(next, at++, freeChord)
    next = addAfter(next, at++, s.candidate, { keyChange })
    change(next, at)
    setPreview(undefined)
    playNow(s.candidate)
  }
  // Adds a chord after the selected one: the + on the strip, or a chord
  // box's + with its inversion as a slash chord.
  function addChord(c: ChordName, voicing?: ChordVoicing) {
    if (between !== undefined) {
      insertPassing(between, c, voicing)
      return
    }
    change(addAfter(progression, selected, c, { voicing }), selected + 1)
  }
  // Adds chords typed into the strip or recorded on MIDI, in order, after
  // the selected chord, or between the two while + between is on. The last
  // one added is selected, so the next carries on from it.
  function addChords(chords: ChordName[], voicing?: ChordVoicing) {
    if (chords.length === 1) {
      addChord(chords[0], voicing)
      return
    }
    if (between !== undefined) {
      change(
        insertAllBetween(progression, between, chords),
        between + chords.length,
      )
      setBetweenAt(undefined)
      return
    }
    change(addAllAfter(progression, selected, chords), selected + chords.length)
  }
  // A chord box's Replace: the shape on show takes the selected chord's
  // place, keeping its length and key change (David's request).
  const replace = selectedChord && {
    symbol: chordSymbol(selectedChord),
    onReplace: (c: ChordName, voicing: ChordVoicing) =>
      change(changeAt(progression, selected, c, voicing), selected),
  }
  // While + between is on, every way of adding a chord (a suggestion, a
  // chord box's +, the strip's +) puts it between the two chords, keeping
  // the chord after it and everything that follows.
  function insertPassing(index: number, c: ChordName, voicing?: ChordVoicing) {
    change(insertBetween(progression, index, c, { voicing }), index + 1)
    setBetweenAt(undefined)
  }
  // Shows a progression chord in the chord box as it was added: the same
  // guitar shape or keyboard voicing, where the box offers it.
  function showNode(n: ChordNode) {
    setWantFrets(n.voicing?.frets)
    if (n.voicing?.instrument === 'keyboard') {
      const midis = n.voicing.notes.map(midiNumber).join()
      const match = voicingChoices(n.chord, pianoFilters).find(
        (v) => v.notes.map(midiNumber).join() === midis,
      )
      if (match) setVoicingPick({ id: match.id, inversion: match.inversion })
    }
  }
  // Plays a progression chord in the shape it was added in, or as the
  // instrument view would play it.
  function playNode(n: ChordNode, seconds?: number) {
    if (!n.voicing) {
      playNow(n.chord, seconds)
      return
    }
    void playChord(n.voicing.notes, {
      strum: n.voicing.instrument === 'guitar',
      seconds,
    })
  }
  // Plays the progression from the first chord, one chord at a time.
  useEffect(() => {
    if (playingAt === undefined) {
      setPlayingChord(undefined)
      setPulse(undefined)
      return
    }
    const n = path[playingAt]
    if (!n) {
      setPlayingAt(undefined)
      return
    }
    // Each chord rings for its length at the tempo, then the next comes in.
    const seconds = secondsOf(timing[playingAt].length, bpm, time.meter)
    setPlayingChord(n.chord)
    showNode(n)
    playNode(n, seconds)
    const timer = setTimeout(
      () =>
        setPlayingAt(playingAt + 1 < path.length ? playingAt + 1 : undefined),
      seconds * 1000,
    )
    // The lights flash on each beat the chord covers.
    const flashes = flashesOf(timing[playingAt], bpm, time.meter).map((f) =>
      setTimeout(
        () =>
          setPulse((p) => ({
            beats: (p?.beats ?? 0) + 1,
            bars: (p?.bars ?? 0) + (f.strength === 'downbeat' ? 1 : 0),
            strength: f.strength,
          })),
        f.ms,
      ),
    )
    return () => {
      clearTimeout(timer)
      flashes.forEach(clearTimeout)
    }
  }, [playingAt])
  // Any change to the progression or its time stops playback.
  useEffect(() => setPlayingAt(undefined), [progression, time])
  function selectSlot(index: number) {
    setSelectedAt(index)
    setBetweenAt(undefined)
    setChord(path[index].chord)
    showNode(path[index])
    playNode(path[index])
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
      onAddFree={() => freeChord && addChord(freeChord)}
      onAddTyped={addChords}
      playingAt={playingAt}
      onPlay={() => setPlayingAt(0)}
      onStop={() => setPlayingAt(undefined)}
      onUndo={() => step(undo(history))}
      onRedo={() => step(redo(history))}
      onClear={() => change(EMPTY_PROGRESSION, -1)}
      onPickNode={(id) => {
        const next = selectNode(progression, id)
        change(next, next.activePath.indexOf(id))
      }}
      bpm={bpm}
      onBpmChange={setBpm}
      pulse={pulse}
      time={time}
      timing={timing}
      onTimeChange={setTime}
      onLengthChange={(length) =>
        change(setLengthAt(progression, selected, length), selected)
      }
      between={between}
      onBetween={(index) => {
        setBetweenAt(between === index ? undefined : index)
        setTab('suggest')
        setSheetOpen(true)
      }}
    />
  )
  const suggest = (
    <SuggestPanel
      keyValue={suggestKey}
      previous={previous}
      next={nextChord}
      onLeave={() => setBetweenAt(undefined)}
      weights={weights}
      preview={preview}
      onPreview={previewSuggestion}
      onAccept={acceptSuggestion}
    />
  )
  const voice = (
    <VoicePanel
      progression={progression}
      sectionKey={key}
      guitar={guitar}
      instrument={instrument}
      bpm={bpm}
      time={time}
      narrow={narrow}
      onUse={(voicings, on, where) => {
        const next = addLensVoicings(progression, key, voicings, on, where)
        change(next.progression, next.select)
      }}
    />
  )
  // The Arpeggio tab (Phase 6 task 2): every chord of the progression, in
  // its key and for its length, then the current chord if it isn't one of
  // them, for a bar. What it shows lights the instrument while it is open.
  const arpeggioSources = useMemo<ArpeggioSource[]>(() => {
    const sources = path.map((n, i) => {
      const length = n.length ?? timing[i].length
      const lengthText = lengthLabel(meterOfBar(time, timing[i].bar), length)
      return {
        chord: n.chord,
        key: keyAt(progression, i, key),
        length,
        label: `${i + 1}. ${chordSymbol(n.chord)} · bar ${timing[i].bar}`,
        lengthText,
      }
    })
    if (freeChord) {
      sources.push({
        chord: freeChord,
        key: suggestKey,
        length: barLength(time.meter),
        label: `${chordSymbol(freeChord)} (not in the progression)`,
        lengthText: '1 bar',
      })
    }
    return sources
  }, [progression, timing, key, freeChord && chordKey(freeChord), suggestKey])
  const [arpeggioShow, setArpeggioShow] = useState<ArpeggioOnShow>()
  // The Arpeggio and Lines tabs light their notes on the instrument while
  // open.
  const arpeggioOn =
    tab === 'arpeggio' || tab === 'lines' ? arpeggioShow : undefined
  const lines = (
    <LinesPanel
      progression={progression}
      sectionKey={key}
      timing={timing}
      bpm={bpm}
      meter={time.meter}
      onShow={setArpeggioShow}
    />
  )
  const arpeggio = (
    <ArpeggioPanel
      sources={arpeggioSources}
      start={freeChord ? arpeggioSources.length - 1 : Math.max(0, selected)}
      instrument={instrument}
      guitar={guitar}
      bpm={bpm}
      meter={time.meter}
      onShow={setArpeggioShow}
    />
  )
  // The chord box beside the side panel (David's layout); on a phone it
  // stays beside the instrument, as the side panel is a sheet there.
  const shapeList = {
    list: shapes,
    at: shapeAt < shapes.length ? shapeAt : 0,
    onAt: setShapeAt,
    filters,
    onFiltersChange: setFilters,
    onAdd: addChord,
    replace,
  }
  const voicingList = {
    list: voicings,
    at: voicingAt,
    onAt: (at: number) => setVoicingPick(voicings[at]),
    filters: pianoFilters,
    onFiltersChange: setPianoFilters,
    onAdd: addChord,
    replace,
  }
  const box = (
    <ChordBox
      instrument={instrument}
      guitar={guitar}
      chord={shown}
      shapes={shapeList}
      voicings={voicingList}
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
          {!narrow && scale}
          <InstrumentView
            addable={narrow}
            value={key}
            chord={arpeggioOn?.chord ?? shown}
            played={playing.notes}
            arpeggio={arpeggioOn}
            instrument={instrument}
            onInstrumentChange={setInstrument}
            settings={settings}
            onSettingsChange={setSettings}
            shapes={shapeList}
            voicings={voicingList}
          />
          <MidiPanel
            midi={midi}
            playing={playing}
            last={last}
            follow={follow}
            onFollowChange={setFollow}
            recording={recording}
            onRecordingChange={setRecording}
            unnamed={unnamed}
            shapesOn={instrument === 'guitar' ? 'keyboard' : 'guitar'}
            onShowShapes={showShapes}
          />
          {strip}
        </main>
        <SidePanel
          aside={
            !narrow &&
            tab !== 'voice' &&
            (arpeggioOn?.guitar && instrument === 'guitar' ? (
              <ArpeggioBox guitar={guitar} show={arpeggioOn} />
            ) : (
              box
            ))
          }
          tabs={[
            { id: 'explore', label: 'Explore', content: explore },
            { id: 'suggest', label: 'Suggest', content: suggest },
            { id: 'voice', label: 'Voice', content: voice },
            { id: 'arpeggio', label: 'Arpeggio', content: arpeggio },
            { id: 'lines', label: 'Lines', content: lines },
          ]}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          active={tab}
          onActiveChange={setTab}
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
