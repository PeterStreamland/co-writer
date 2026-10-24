import { useEffect, useMemo, useRef, useState } from 'preact/hooks'
import {
  barLength,
  chordSymbol,
  chordHits,
  stepInversion,
  formatNote,
  lengthLabel,
  meterOfBar,
  chordKey,
  inversions,
  keyName as nameOfKey,
  midiNumber,
  subDur,
  type ChordName,
  type Key,
  type NextChordSuggestion,
  type Note,
  type Dur,
  type MelodyNote,
  type StyleBlend,
  ZERO,
  addDur,
  appendNote,
  NOTE_VALUES,
  degreeLabel,
  barPosition,
  compareDur,
  countUnit,
  holdOver,
  harmonise,
  rankNoteInPlace,
  restBefore,
  setNoteLength,
  silenceNote,
  spellTapped,
  swapMelodyNote,
  shiftMelodyNote,
  clearSpan,
} from '../theory'
import {
  OCTAVE_LIMIT,
  invertShape,
  shiftNotes,
  shiftShape,
} from '../instruments/octave'
import { playChord, playNote, preparePiano } from '../audio/player'
import { SLOW_STRUM_GAP } from '../audio/sounds'
import { useMidi } from '../midi/useMidi'
import { IDLE, nextRecorder } from '../midi/record'
import { findFingerings } from '../instruments/fingering'
import { ChordRows } from './ChordRows'
import { strum } from './ChordBoxes'
import {
  ChordBox,
  DEFAULT_GUITAR,
  type ArpeggioShow,
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
import type { LineBars, LineEdits } from './lines-view'
import type { Along, AlongNote } from './along'
import { PartRows, type PartView } from './PartRows'
import { MelodyLane } from './MelodyLane'
import { MelodyPanel, type MelodyEntry, type MelodyLight } from './MelodyPanel'
import {
  HARMONY_LOOK,
  MELODY_LOOK,
  melodyAlong,
  rangeFromSetting,
} from './melody-view'
import { freezeRow, frozenLine, partLabel, partNotes } from './parts-view'
import { melodyStrips } from './melody-strips'
import { Timeline } from './Timeline'
import {
  addCell,
  addPart,
  clearCell,
  partsShown,
  removePart,
  setFrozenBar,
  silenceAll,
  setPartMuted,
  shiftArpeggioNote,
  shiftPart,
  type PartRecipe,
} from '../sketch/parts'
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
  removeAt,
  setLengthAt,
  timingOf,
  keyAfter,
  keyAt,
  pathNodes,
  invertAt,
  setChordStyle,
  setStyleAt,
  styleAt,
  selectNode,
  shiftAt,
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
  // A chord's place (David's request): tapping a chord in the strip offers
  // chords for its place, until something else is chosen.
  const [placeAt, setPlaceAt] = useState<number>()
  const place =
    placeAt === selected && selected >= 0 && between === undefined && !freeChord
      ? placeAt
      : undefined
  const nextChord =
    between !== undefined
      ? path[between + 1].chord
      : place !== undefined
        ? path[place + 1]?.chord
        : undefined
  const previous =
    place !== undefined
      ? chordsUpTo(progression, place - 1)
      : [
          ...chordsUpTo(progression, selected),
          ...(freeChord && between === undefined ? [freeChord] : []),
        ]
  const [tab, setTab] = useState('explore')
  const suggestKey = keyAfter(
    progression,
    place !== undefined ? place - 1 : selected,
    key,
  )
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
  function playNow(c: ChordName, seconds?: number, keep = false): boolean {
    if (instrument === 'guitar') {
      const top = shapesOf(c)[0]
      if (top) strum(top, seconds, keep)
      return Boolean(top)
    }
    const choices = voicingChoices(c, pianoFilters)
    const voicing =
      choices.find(
        (v) => v.id === voicingPick.id && v.inversion === voicingPick.inversion,
      ) ?? choices[0]
    void playChord(voicing.notes, { seconds, keep })
    return true
  }
  // Previewing a suggestion plays the last chord, then the suggestion.
  function previewSuggestion(s: NextChordSuggestion) {
    setPreview(s)
    // In a chord's place: the chord before, the suggestion, the chord after.
    if (place !== undefined) {
      const before = path[place - 1]
      const after = path[place + 1]
      if (before) playNode(before)
      setTimeout(() => playNow(s.candidate), before ? PREVIEW_GAP_MS : 0)
      if (after) {
        setTimeout(() => playNode(after), (before ? 2 : 1) * PREVIEW_GAP_MS)
      }
      return
    }
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
    // In a chord's place it becomes an alternative there, the old chord one
    // ‹ › away (David's choice), and the place stays open to try more.
    if (place !== undefined) {
      change(addAfter(progression, place - 1, s.candidate), place)
      setPlaceAt(place)
      setPreview(undefined)
      playNow(s.candidate)
      return
    }
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
  function playNode(n: ChordNode, seconds?: number, keep = false) {
    if (!n.voicing) {
      playNow(n.chord, seconds, keep)
      return
    }
    void playChord(n.voicing.notes, {
      strum: n.voicing.instrument === 'guitar',
      seconds,
      keep,
    })
  }
  // Plays the chord at a slot in its style (David's request): block as
  // ever, or each hit of the style in time. From `from` to `to` (from the
  // chord's start) plays just that stretch, for a bar played on its own; a
  // hit already ringing at `from` sounds for the rest of it. Returns the
  // timers, to stop it.
  function playStyled(
    i: number,
    keep: boolean,
    from: Dur = ZERO,
    to?: Dur,
  ): number[] {
    const n = path[i]
    const placed = timing[i]
    const style = styleAt(progression, i)
    const end = to ?? placed.length
    const seconds = (d: Dur) => secondsOf(d, bpm, time.meter)
    if (style === 'block') {
      playNode(n, seconds(subDur(end, from)), keep)
      return []
    }
    const v = voicingOf(n)
    if (!v) return []
    return chordHits(style, v.notes, placed, time).flatMap((h) => {
      const ringsTo = addDur(h.onset, h.sound)
      if (!h.notes.length || compareDur(ringsTo, from) <= 0) return []
      const start = compareDur(h.onset, from) < 0 ? from : h.onset
      if (compareDur(start, end) >= 0) return []
      const stop = compareDur(ringsTo, end) < 0 ? ringsTo : end
      return [
        window.setTimeout(
          () =>
            void playChord(h.notes, {
              strum: h.strum ?? v.instrument === 'guitar',
              gap: style === 'strum' ? SLOW_STRUM_GAP : undefined,
              seconds: seconds(subDur(stop, start)),
              keep: keep || compareDur(start, from) > 0,
            }),
          seconds(subDur(start, from)) * 1000,
        ),
      ]
    })
  }
  // A progression chord's notes as they play now: the voicing it keeps, or
  // the one the instrument view would give it.
  function voicingOf(n: ChordNode): ChordVoicing | undefined {
    if (n.voicing) return n.voicing
    if (instrument === 'guitar') {
      const top = shapesOf(n.chord)[0]
      return (
        top && {
          instrument: 'guitar',
          notes: top.notes.filter((x): x is Note => x !== null),
          frets: top.frets,
        }
      )
    }
    const choices = voicingChoices(n.chord, pianoFilters)
    const v =
      choices.find(
        (c) => c.id === voicingPick.id && c.inversion === voicingPick.inversion,
      ) ?? choices[0]
    return { instrument: 'keyboard', notes: v.notes }
  }
  // The chord's voicing moved by octaves (David's request): on guitar the
  // nearest playable shape; none past the limit or off the instrument.
  function shiftedVoicing(n: ChordNode, by: number): ChordVoicing | undefined {
    if (Math.abs((n.octave ?? 0) + by) > OCTAVE_LIMIT) return undefined
    const v = voicingOf(n)
    if (!v) return undefined
    if (v.instrument === 'guitar' && v.frets) {
      const moved = shiftShape(
        guitar,
        n.chord,
        { frets: v.frets, notes: v.notes },
        by,
      )
      return moved && { instrument: 'guitar', ...moved }
    }
    const notes = shiftNotes(v.notes, by)
    return notes && { instrument: v.instrument, notes }
  }
  // Steps a chord through its inversions (David's request): the next
  // chord tone in the bass, the voicing stacked closely above it on
  // keyboard, or the nearest playable shape with that bass on guitar. A
  // slash chord over a note outside it moves a whole octave instead.
  function stepChord(index: number, by: 1 | -1) {
    const n = path[index]
    const v = voicingOf(n)
    const step = v && stepInversion(n.chord, v.notes, by)
    if (!v || !step) {
      shiftChord(index, by)
      return
    }
    if (Math.abs((n.octave ?? 0) + step.octave) > OCTAVE_LIMIT) return
    let voicing: ChordVoicing | undefined
    if (v.instrument === 'guitar' && v.frets) {
      const shape = invertShape(
        guitar,
        step.chord,
        { frets: v.frets, notes: v.notes },
        midiNumber(step.notes[0]) as number,
        by,
      )
      voicing = shape && { instrument: 'guitar', ...shape }
    } else {
      voicing = shiftNotes(step.notes, 0) && {
        instrument: v.instrument,
        notes: step.notes,
      }
    }
    if (!voicing) return
    const next = invertAt(progression, index, step.chord, voicing, step.octave)
    change(next, index)
    const stepped = pathNodes(next)[index]
    setChord(stepped.chord)
    showNode(stepped)
    playNode(stepped)
  }
  function shiftChord(index: number, by: number) {
    const n = path[index]
    const voicing = shiftedVoicing(n, by)
    if (!voicing) return
    const next = shiftAt(progression, index, voicing, by)
    change(next, index)
    const moved = pathNodes(next)[index]
    showNode(moved)
    playNode(moved)
  }
  // Every chord on the path moved together; a chord that can't move that
  // far stays where it is.
  function shiftAll(by: number) {
    let next = progression
    path.forEach((_, i) => {
      const voicing = shiftedVoicing(pathNodes(next)[i], by)
      if (voicing) next = shiftAt(next, i, voicing, by)
    })
    change(next, Math.max(0, selected))
  }
  // Notes playing along with the progression (a line, or arpeggios), and
  // the one sounding.
  const [along, setAlong] = useState<Along>()
  const [alongAt, setAlongAt] = useState<AlongNote>()
  const playAlong = (notes: Along) => {
    setAlong(notes)
    setPlayingAt(0)
  }
  // Plays the progression from the first chord, one chord at a time.
  useEffect(() => {
    if (playingAt === undefined) {
      setPlayingChord(undefined)
      setPulse(undefined)
      setAlong(undefined)
      setAlongAt(undefined)
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
    const chordTimers = playStyled(playingAt, along !== undefined)
    // Notes playing along sound over this chord.
    const lineTimers = (along?.notes ?? []).flatMap((note) =>
      note.step !== playingAt
        ? []
        : [
            setTimeout(
              () => {
                setAlongAt(note)
                void playNote(
                  note.note,
                  secondsOf(note.length, bpm, time.meter),
                )
              },
              secondsOf(
                subDur(note.onset, timing[playingAt].start),
                bpm,
                time.meter,
              ) * 1000,
            ),
          ],
    )
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
      chordTimers.forEach(clearTimeout)
      flashes.forEach(clearTimeout)
      lineTimers.forEach(clearTimeout)
    }
  }, [playingAt])
  // Any change to the progression or its time stops playback.
  useEffect(() => setPlayingAt(undefined), [progression, time])
  function selectSlot(index: number) {
    setSelectedAt(index)
    setBetweenAt(undefined)
    setPlaceAt(index)
    setChord(path[index].chord)
    showNode(path[index])
    playNode(path[index])
  }
  // The melody (SPEC 7.2), entered on the Melody tab and shown in the lane
  // under the strip. Every change is undoable with the strip's undo.
  const melody = progression.melody ?? []
  function setMelody(next: MelodyNote[]) {
    setHistory((h) => {
      const p: Progression = { ...h.present, melody: next }
      if (!next.length) delete p.melody
      return record(h, p)
    })
  }
  const [melodyLight, setMelodyLight] = useState<MelodyLight>()
  const [melodyEntry, setMelodyEntry] = useState<MelodyEntry>({
    value: 'quarter',
    gap: ZERO,
    tap: true,
    grid: '1/16',
  })
  // Tapping the instrument while the Melody tab is open adds a note of the
  // chosen value after the last (step entry), and plays it.
  const melodyTap =
    tab === 'melody' && melodyEntry.tap
      ? (midi: number, spelled?: Note) => {
          const note = spelled ?? spellTapped(key, midi, melody.at(-1)?.note)
          const value =
            NOTE_VALUES.find((v) => v.id === melodyEntry.value) ??
            NOTE_VALUES[4]
          setHistory((h) =>
            record(h, {
              ...h.present,
              melody: appendNote(
                h.present.melody ?? [],
                note,
                value.length,
                melodyEntry.gap,
              ),
            }),
          )
          setMelodyEntry((e) => ({ ...e, gap: ZERO }))
          void playNote(note, secondsOf(value.length, bpm, time.meter))
        }
      : undefined
  // Play melody plays it alone, every note, lit in the lane.
  const [soloAt, setSoloAt] = useState<number>()
  const soloTimers = useRef<number[]>([])
  function stopSolo() {
    soloTimers.current.forEach(clearTimeout)
    soloTimers.current = []
    setSoloAt(undefined)
  }
  function playMelody() {
    stopSolo()
    setPlayingAt(undefined)
    const ms = (d: { n: number; d: number }) =>
      secondsOf(d, bpm, time.meter) * 1000
    melody.forEach((m, i) => {
      soloTimers.current.push(
        window.setTimeout(() => {
          setSoloAt(i)
          void playNote(m.note, secondsOf(m.length, bpm, time.meter))
        }, ms(m.onset)),
      )
    })
    harmonyNotes.forEach((m) => {
      soloTimers.current.push(
        window.setTimeout(
          () => void playNote(m.note, secondsOf(m.length, bpm, time.meter)),
          ms(m.onset),
        ),
      )
    })
    const last = melody.at(-1)
    if (last) {
      soloTimers.current.push(
        window.setTimeout(stopSolo, ms(addDur(last.onset, last.length))),
      )
    }
  }
  useEffect(() => stopSolo, [])
  const lastPlaced = timing.at(-1)
  const sectionEnd = lastPlaced && addDur(lastPlaced.start, lastPlaced.length)
  const melodySounding = alongAt?.look === MELODY_LOOK ? alongAt.ref : soloAt
  // How many bars the chords cover, so the lane shows each of them.
  const chordsEnd = barPosition(time, sectionEnd ?? ZERO)
  const chordBars = !sectionEnd
    ? 0
    : chordsEnd.offset.n === 0
      ? chordsEnd.bar - 1
      : chordsEnd.bar
  // The bars the lane and the rows show, the same for each so they line up
  // (PLAN Phase 7 task 6): every bar the chords or the melody cover.
  const laneBars = melodyStrips(melody, time, chordBars).length
  const rowChords = path.map((n, i) => ({
    node: n.id,
    symbol: chordSymbol(n.chord),
    start: timing[i].start,
    length: timing[i].length,
    bar: timing[i].bar,
  }))
  // Plays one stretch of the song (a bar of the lane or of a row, David's
  // request): the chords sounding in it, cut to it, and the notes starting
  // in it, at the tempo, the note sounding lit.
  const spanTimers = useRef<number[]>([])
  function playSpan(
    start: Dur,
    length: Dur,
    notes: (MelodyNote & { ref?: number; look?: string })[],
  ) {
    spanTimers.current.forEach(clearTimeout)
    spanTimers.current = []
    stopSolo()
    setPlayingAt(undefined)
    const end = addDur(start, length)
    const ms = (d: Dur) => secondsOf(d, bpm, time.meter) * 1000
    path.forEach((_, i) => {
      const t = timing[i]
      const tEnd = addDur(t.start, t.length)
      if (compareDur(t.start, end) >= 0 || compareDur(tEnd, start) <= 0) return
      const from = compareDur(t.start, start) > 0 ? t.start : start
      const to = compareDur(tEnd, end) < 0 ? tEnd : end
      spanTimers.current.push(
        window.setTimeout(
          () =>
            spanTimers.current.push(
              ...playStyled(
                i,
                true,
                subDur(from, t.start),
                subDur(to, t.start),
              ),
            ),
          ms(subDur(from, start)),
        ),
      )
    })
    for (const m of notes) {
      if (compareDur(m.onset, start) < 0 || compareDur(m.onset, end) >= 0) {
        continue
      }
      spanTimers.current.push(
        window.setTimeout(
          () => {
            if (m.look === MELODY_LOOK && m.ref !== undefined) setSoloAt(m.ref)
            void playNote(m.note, secondsOf(m.length, bpm, time.meter))
          },
          ms(subDur(m.onset, start)),
        ),
      )
    }
    spanTimers.current.push(
      window.setTimeout(() => setSoloAt(undefined), ms(length)),
    )
  }
  // Tapping a note in the lane (David's request) offers notes for its
  // place and ways to leave a gap there.
  const melodyChords = path.map((n, i) => ({
    chord: n.chord,
    key: keyAt(progression, i, key),
    start: timing[i].start,
    length: timing[i].length,
  }))
  // The harmonies playing with the melody (SPEC 7.4), rewritten as it
  // changes.
  const harmonyIds = progression.harmonies ?? []
  const harmonyNotes = harmonyIds.flatMap(
    (id) => harmonise({ melody, key, chords: melodyChords, time }, id).notes,
  )
  function setHarmonies(ids: string[]) {
    setHistory((h) => {
      const p: Progression = { ...h.present, harmonies: ids }
      if (!ids.length) delete p.harmonies
      return record(h, p)
    })
  }
  const [laneAt, setLaneAt] = useState<number>()
  const laneSelected =
    laneAt !== undefined && laneAt < melody.length ? laneAt : undefined
  const laneOptions =
    laneSelected === undefined
      ? []
      : rankNoteInPlace(
          {
            melody,
            key,
            chords: melodyChords,
            time,
            range: rangeFromSetting(progression.melodyRange),
          },
          laneSelected,
        )
  const melodyPanel = (
    <MelodyPanel
      melody={melody}
      onChange={setMelody}
      entry={melodyEntry}
      onEntry={setMelodyEntry}
      barCount={laneBars}
      keyValue={key}
      bpm={bpm}
      time={time}
      end={sectionEnd}
      midi={midi}
      playing={playingAt !== undefined || soloAt !== undefined}
      onPlay={(withChords) => {
        if (!withChords) {
          playMelody()
          return
        }
        stopSolo()
        playAlong({
          source: melody,
          notes: [
            ...melodyAlong(melody, timing),
            ...melodyAlong(harmonyNotes, timing, HARMONY_LOOK),
          ],
        })
      }}
      onPlayChords={() => {
        stopSolo()
        setAlong(undefined)
        setPlayingAt(0)
      }}
      onStop={() => {
        stopSolo()
        setPlayingAt(undefined)
      }}
      onRecordStart={() => setRecording(false)}
      onLight={setMelodyLight}
      chords={melodyChords}
      rangeSetting={progression.melodyRange}
      onRangeSetting={(melodyRange) =>
        setHistory((h) => record(h, { ...h.present, melodyRange }))
      }
      harmonies={harmonyIds}
      onHarmonies={setHarmonies}
    />
  )
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
      onPlay={() => {
        // The rows that aren't muted play along with the chords.
        // So does the melody.
        const playing = rows.filter((r) => !r.part.muted)
        const notes = [
          ...playing.flatMap((r) => r.notes),
          ...melodyAlong(melody, timing),
          ...melodyAlong(harmonyNotes, timing, HARMONY_LOOK),
        ]
        setAlong(notes.length ? { source: rows, notes } : undefined)
        setPlayingAt(0)
      }}
      onStop={() => setPlayingAt(undefined)}
      onUndo={() => step(undo(history))}
      onRedo={() => step(redo(history))}
      onClear={() =>
        // The melody belongs to the section, so it stays.
        change(
          {
            ...EMPTY_PROGRESSION,
            ...(progression.melody && { melody: progression.melody }),
            ...(progression.melodyRange && {
              melodyRange: progression.melodyRange,
            }),
            ...(progression.harmonies && {
              harmonies: progression.harmonies,
            }),
            ...(progression.chordStyle && {
              chordStyle: progression.chordStyle,
            }),
          },
          -1,
        )
      }
      onClearAll={() =>
        // Everything goes: chords, rows, melody and its harmonies. The
        // melody's range and the chord style are settings, so they stay.
        change(
          {
            ...EMPTY_PROGRESSION,
            ...(progression.melodyRange && {
              melodyRange: progression.melodyRange,
            }),
            ...(progression.chordStyle && {
              chordStyle: progression.chordStyle,
            }),
          },
          -1,
        )
      }
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
      onShift={shiftChord}
      onRemove={(index) =>
        change(removeAt(progression, index), Math.max(0, index - 1))
      }
      onShiftAll={shiftAll}
      onChordStyle={(style) =>
        change(setChordStyle(progression, style), selected)
      }
      onStyleAt={(index, style) =>
        change(setStyleAt(progression, index, style), index)
      }
      onStep={stepChord}
      onHear={(index) => {
        spanTimers.current.forEach(clearTimeout)
        stopSolo()
        setPlayingAt(undefined)
        showNode(path[index])
        spanTimers.current = playStyled(index, false)
      }}
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
      current={place !== undefined ? path[place].chord : undefined}
      onLeave={() => {
        setBetweenAt(undefined)
        setPlaceAt(undefined)
      }}
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
    const sources: ArpeggioSource[] = path.map((n, i) => {
      const length = n.length ?? timing[i].length
      const lengthText = lengthLabel(meterOfBar(time, timing[i].bar), length)
      return {
        step: i,
        start: timing[i].start,
        bar: timing[i].bar,
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
  // The rows of lines and arpeggios under the strip (David's request): the
  // branch's rows, each played over the chords as they are now.
  const rows = useMemo<PartView[]>(
    () =>
      partsShown(progression).map((part) => ({
        part,
        label: partLabel(part),
        notes: partNotes(part, progression, key, timing, guitar),
      })),
    [progression, key, timing, guitar],
  )
  const addRow = (recipe: PartRecipe, cells?: Record<number, PartRecipe>) =>
    change(
      addPart(
        progression,
        recipe,
        cells &&
          Object.fromEntries(
            Object.entries(cells).map(([step, r]) => [
              path[Number(step)].id,
              r,
            ]),
          ),
      ),
      selected,
    )
  // The Lines tab's bars of their own, by line (David's request), kept
  // while the tab is closed.
  const [lineEdits, setLineEdits] = useState<Record<string, LineEdits>>({})
  // Each bar's notes and refreshes, whatever the line (David's request).
  const [lineBars, setLineBars] = useState<LineBars>({})
  // + on one bar adds just that bar to a row (David's request).
  const addBar = (step: number, recipe: PartRecipe) =>
    change(addCell(progression, path[step].id, recipe), selected)
  const [arpeggioShow, setArpeggioShow] = useState<ArpeggioOnShow>()
  // The Arpeggio and Lines tabs light their notes on the instrument while
  // open.
  const arpeggioOn =
    tab === 'arpeggio' || tab === 'lines' ? arpeggioShow : undefined
  // A melody suggestion being previewed lights on the instrument, labelled
  // by degree, while the Melody tab is open.
  const melodyShow: ArpeggioShow | undefined =
    tab === 'melody' && melodyLight
      ? {
          name: 'Melody',
          notes: melodyLight.notes.map((note) => ({
            note,
            midi: midiNumber(note) as number,
            label: degreeLabel({ ...key.tonic, octave: undefined }, note),
            number: 1,
          })),
          sounding: melodyLight.at,
        }
      : undefined
  const lit = melodyShow ?? arpeggioOn
  const lines = (
    <LinesPanel
      progression={progression}
      sectionKey={key}
      timing={timing}
      bpm={bpm}
      meter={time.meter}
      onShow={setArpeggioShow}
      along={along}
      alongAt={alongAt}
      onPlayAlong={playAlong}
      onStop={() => setPlayingAt(undefined)}
      onAddRow={addRow}
      onAddBar={addBar}
      edits={lineEdits}
      onEdits={setLineEdits}
      bars={lineBars}
      onBars={setLineBars}
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
      along={along}
      alongAt={alongAt}
      onPlayAlong={playAlong}
      onStop={() => setPlayingAt(undefined)}
      onAddRow={addRow}
      onAddBar={addBar}
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
            chord={
              melodyShow
                ? (melodyLight?.chord ?? shown)
                : (arpeggioOn?.chord ?? shown)
            }
            played={playing.notes}
            arpeggio={lit}
            instrument={instrument}
            onInstrumentChange={setInstrument}
            settings={settings}
            onSettingsChange={setSettings}
            shapes={shapeList}
            voicings={voicingList}
            onTap={melodyTap}
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
          <Timeline>
            <MelodyLane
              melody={melody}
              time={time}
              sounding={melodySounding}
              onOpen={() => {
                setTab('melody')
                setSheetOpen(true)
              }}
              selected={laneSelected}
              onSelect={(i) => {
                setLaneAt(i)
                if (i !== undefined) {
                  const m = melody[i]
                  void playNote(m.note, secondsOf(m.length, bpm, time.meter))
                }
              }}
              options={laneOptions}
              onSwap={(note) => {
                if (laneSelected === undefined) return
                const m = melody[laneSelected]
                setMelody(swapMelodyNote(melody, laneSelected, note))
                void playNote(note, secondsOf(m.length, bpm, time.meter))
              }}
              onSilence={() => {
                if (laneSelected === undefined) return
                setMelody(silenceNote(melody, laneSelected))
                setLaneAt(undefined)
              }}
              onHold={() => {
                if (laneSelected === undefined) return
                setMelody(holdOver(melody, laneSelected))
                setLaneAt(undefined)
              }}
              chords={rowChords}
              barCount={laneBars}
              onClearBar={(start, length, what) => {
                const end = addDur(start, length)
                let next = progression
                if (what !== 'rows') {
                  const cleared = clearSpan(melody, start, end)
                  next = { ...next, melody: cleared }
                  if (!cleared.length) delete next.melody
                }
                if (what !== 'melody') {
                  // The chords sounding in the bar.
                  const nodes = path
                    .filter(
                      (_, i) =>
                        compareDur(timing[i].start, end) < 0 &&
                        compareDur(
                          addDur(timing[i].start, timing[i].length),
                          start,
                        ) > 0,
                    )
                    .map((n) => n.id)
                  next = silenceAll(next, nodes)
                }
                setLaneAt(undefined)
                change(next, selected)
              }}
              activeBar={melodyEntry.phraseBar}
              onPlayBar={(start, length, bar) => {
                setMelodyEntry((e) => ({ ...e, phraseBar: bar }))
                playSpan(start, length, [
                  ...melody.map((m, ref) => ({ ...m, ref, look: MELODY_LOOK })),
                  ...harmonyNotes,
                ])
              }}
              onOctave={(by) => {
                if (laneSelected === undefined) return
                const moved = shiftMelodyNote(melody, laneSelected, by)
                const m = moved[laneSelected]
                setMelody(moved)
                void playNote(m.note, secondsOf(m.length, bpm, time.meter))
              }}
              onRestAfter={() => {
                if (laneSelected === undefined) return
                const beat = countUnit(time.meter).length
                if (laneSelected === melody.length - 1) {
                  // Nothing after it to move: the next note added waits.
                  setMelodyEntry((e) => ({ ...e, gap: addDur(e.gap, beat) }))
                  return
                }
                setMelody(restBefore(melody, laneSelected + 1, beat))
              }}
              onLength={(length) => {
                if (laneSelected === undefined) return
                setMelody(setNoteLength(melody, laneSelected, length))
                void playNote(
                  melody[laneSelected].note,
                  secondsOf(length, bpm, time.meter),
                )
              }}
              onRestBefore={() => {
                if (laneSelected === undefined) return
                setMelody(
                  restBefore(
                    melody,
                    laneSelected,
                    countUnit(time.meter).length,
                  ),
                )
              }}
            />
            <PartRows
              rows={rows}
              chords={rowChords}
              time={time}
              barCount={laneBars}
              sounding={along?.source === rows ? alongAt : undefined}
              onMute={(id, muted) =>
                change(setPartMuted(progression, id, muted), selected)
              }
              onRemove={(id) => change(removePart(progression, id), selected)}
              onClearBar={(id, step) =>
                change(clearCell(progression, id, path[step].id), selected)
              }
              onPlayBar={(id, step) => {
                const row = rows.find((r) => r.part.id === id)
                playSpan(
                  timing[step].start,
                  timing[step].length,
                  (row?.notes ?? []).filter((n) => n.step === step),
                )
              }}
              onShift={(id, by, step) =>
                change(
                  shiftPart(
                    progression,
                    id,
                    by,
                    step === undefined ? undefined : path[step].id,
                  ),
                  selected,
                )
              }
              onFreeze={(id) => {
                const part = partsShown(progression).find((r) => r.id === id)
                if (part) {
                  change(
                    freezeRow(progression, part, key, timing, guitar),
                    selected,
                  )
                }
              }}
              frozenLine={(id) => {
                const part = partsShown(progression).find((r) => r.id === id)
                return part && frozenLine(part, progression, key, timing)
              }}
              onEditBar={(id, step, notes) =>
                change(
                  setFrozenBar(progression, id, path[step].id, notes),
                  selected,
                )
              }
              onShiftNote={(id, step, place, by) =>
                change(
                  shiftArpeggioNote(progression, id, path[step].id, place, by),
                  selected,
                )
              }
              onPlayNote={(note, length) =>
                void playNote(note, secondsOf(length, bpm, time.meter))
              }
            />
          </Timeline>
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
            { id: 'melody', label: 'Melody', content: melodyPanel },
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
