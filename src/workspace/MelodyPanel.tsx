import { useEffect, useRef, useState } from 'preact/hooks'
import {
  GRIDS,
  NOTE_VALUES,
  ZERO,
  addDur,
  barLength,
  beatsOf,
  RANGE_PRESETS,
  formatNote,
  mainMotif,
  melodyEnd,
  motifLabel,
  motifOptions,
  motifText,
  motifsIn,
  subDur,
  MELODY_CATEGORY_LABELS,
  compareDur,
  noteInsight,
  rankMelody,
  parseNote,
  meterOfBar,
  quantise,
  removeLast,
  typeMelody,
  valueFraction,
  valueName,
  type Dur,
  type GridId,
  type Key,
  type ChordName,
  type MelodyChord,
  type MotifSuggestion,
  type NextNoteSuggestion,
  type Note,
  type MelodyNote,
  type MeterMap,
} from '../theory'
import { playClick, playNote } from '../audio/player'
import type { MelodyRangeSetting } from '../sketch/progression'
import { rangeFromSetting } from './melody-view'
import { InfoToggle } from './ChordInfo'
import type { Midi } from '../midi/useMidi'
import { finishTake, startTake, takeEvent, type Take } from '../midi/take'
import { secondsOf, tempoNote } from '../sketch/time'

// What the Melody tab's entry settings are, kept by the workspace so tapping
// the instrument can use them.
export type MelodyEntry = {
  value: string // a NOTE_VALUES id
  gap: Dur // a rest waiting before the next note
  tap: boolean // whether tapping the instrument adds notes
  grid: GridId
}

type Phase = 'idle' | 'count-in' | 'recording'

// Notes a preview lights on the instrument, the one sounding last, and the
// chord they sit over.
export type MelodyLight = { notes: Note[]; at?: number; chord?: ChordName }

// A preview plays the last note, then the candidate.
const PREVIEW_SECONDS = 0.8
const PREVIEW_GAP_MS = 600

// The Melody tab (PLAN Phase 7 task 1, SPEC 7.2): enter a melody by tapping
// the fretboard or keyboard (step entry, with the note value chosen here),
// by typing note names, or by recording on MIDI after a one-bar count-in,
// snapped to the grid. The melody shows in the lane under the strip. Next
// note (task 2, SPEC 7.3) lists what could come next within the melody's
// range, best first, each tagged and explained; Motif (task 3) offers a
// motif of the melody again in the next free bar.
export function MelodyPanel({
  melody,
  onChange,
  entry,
  onEntry,
  keyValue,
  bpm,
  time,
  end,
  midi,
  playing,
  onPlay,
  onPlayChords,
  onStop,
  onRecordStart,
  chords,
  rangeSetting,
  onRangeSetting,
  onLight,
}: {
  melody: MelodyNote[]
  // Every change is undoable, with the strip's undo.
  onChange: (melody: MelodyNote[]) => void
  entry: MelodyEntry
  onEntry: (entry: MelodyEntry) => void
  keyValue: Key
  bpm: number
  time: MeterMap
  // The end of the last chord: recording stops there. None without chords.
  end?: Dur
  midi: Midi
  playing: boolean
  // Plays the melody, alone or with the chords.
  onPlay: (withChords: boolean) => void
  // Plays the chords from the start while recording.
  onPlayChords: () => void
  onStop: () => void
  // Recording a melody turns off Record chords, so held notes aren't added
  // to the progression as chords.
  onRecordStart: () => void
  // The chords under the melody, for next-note suggestions.
  chords: MelodyChord[]
  rangeSetting?: MelodyRangeSetting
  onRangeSetting: (setting: MelodyRangeSetting) => void
  // Lights notes on the instrument while previewing; undefined clears.
  onLight: (light: MelodyLight | undefined) => void
}) {
  const set = (part: Partial<MelodyEntry>) => onEntry({ ...entry, ...part })
  const value =
    NOTE_VALUES.find((v) => v.id === entry.value) ??
    NOTE_VALUES.find((v) => v.id === 'quarter')!
  // Next notes (Phase 7 tasks 2 and 4): what could come after the last
  // note, for the note value chosen, shown as chord suggestions are (SPEC
  // 6.2, 7.3): six to eight grouped, a wildcard with Another, a tap to
  // preview (the last note, then the candidate, lit on the instrument), +
  // to add, and ⓘ for the reading and why it ranks there.
  const range = rangeFromSetting(rangeSetting)
  const noteContext = {
    melody,
    key: keyValue,
    chords,
    time,
    range,
    length: value.length,
    gap: entry.gap,
  }
  const [another, setAnother] = useState(0)
  const [previewId, setPreviewId] = useState<string>()
  const [openId, setOpenId] = useState<string>()
  const inputKey = `${melody.length}|${value.id}|${entry.gap.n}/${entry.gap.d}|${chords.length}|${formatNote(range.low)}-${formatNote(range.high)}`
  useEffect(() => {
    setAnother(0)
    setPreviewId(undefined)
    onLight(undefined)
  }, [inputKey])
  const ranked = rankMelody(noteContext, { another })
  const last = melody.at(-1)
  const chordAt = (n: MelodyNote) =>
    chords.find(
      (c) =>
        compareDur(c.start, n.onset) <= 0 &&
        compareDur(n.onset, addDur(c.start, c.length)) < 0,
    )?.chord
  const addSuggested = (note: MelodyNote) => {
    onChange([...melody, note])
    set({ gap: ZERO })
    void playNote(note.note, secondsOf(note.length, bpm, time.meter))
  }
  const previewNote = (id: string, note: MelodyNote) => {
    setPreviewId(id)
    const notes = last ? [last.note, note.note] : [note.note]
    onLight({ notes: notes, at: notes.length - 1, chord: chordAt(note) })
    if (last) {
      void playNote(last.note, PREVIEW_SECONDS)
      window.setTimeout(
        () => void playNote(note.note, PREVIEW_SECONDS),
        PREVIEW_GAP_MS,
      )
    } else void playNote(note.note, PREVIEW_SECONDS)
  }
  // Motif options (Phase 7 task 3): the motif that comes back most, or a
  // bar you pick, again in the next free bar as a repeat, a sequence, with
  // a changed ending or upside down. Tap one to add it; ▶ to hear it.
  const motifs = motifsIn(melody, time)
  const [motifBar, setMotifBar] = useState<number>()
  const motif =
    motifs.find((m) => m.bar === motifBar) ?? mainMotif(melody, time)
  const motifChoices = motifOptions(
    { melody, key: keyValue, chords, time, range, gap: entry.gap },
    motif,
  )
  const hear = (notes: MelodyNote[]) => {
    const first = notes[0]?.onset ?? ZERO
    notes.forEach((n) =>
      window.setTimeout(
        () => void playNote(n.note, secondsOf(n.length, bpm, time.meter)),
        secondsOf(subDur(n.onset, first), bpm, time.meter) * 1000,
      ),
    )
  }
  const addMotif = (notes: MelodyNote[]) => {
    onChange([...melody, ...notes])
    set({ gap: ZERO })
    hear(notes)
  }
  const previewMotif = (id: string, notes: MelodyNote[]) => {
    setPreviewId(id)
    onLight({ notes: notes.map((n) => n.note), chord: chordAt(notes[0]) })
    hear(notes)
  }
  // A next note's card: tap to preview, + to add, ⓘ for more.
  const noteCard = (s: NextNoteSuggestion, wildcard = false) => {
    const id = `note-${formatNote(s.candidate.note)}`
    const name = formatNote(s.candidate.note)
    const insight = noteInsight(
      keyValue,
      s.candidate.note,
      chordAt(s.candidate),
      last?.note,
    )
    return (
      <li
        key={id}
        class={previewId === id ? 'suggestion previewing' : 'suggestion'}
      >
        <button
          type="button"
          class="preview"
          aria-pressed={previewId === id}
          onClick={() => previewNote(id, s.candidate)}
        >
          <span class="symbol">{name}</span>
          <span class="melody-tags">
            {s.tags.map((t) => (
              <span key={t} class={`melody-tag tag-${t}`}>
                {TAG_TEXT[t] ?? t}
              </span>
            ))}
          </span>
          {wildcard && <span class="badge">Wildcard</span>}
        </button>
        <button
          type="button"
          class="accept"
          aria-label={`Add ${name}`}
          title={`Add ${name}`}
          onClick={() => addSuggested(s.candidate)}
        >
          +
        </button>
        <p class="why">
          {s.explanation}{' '}
          <InfoToggle
            open={openId === id}
            label={name}
            onToggle={() => setOpenId(openId === id ? undefined : id)}
          />
        </p>
        {s.contextNotes.length > 0 && openId !== id && (
          <p class="context">
            {s.contextNotes.length === 1
              ? s.contextNotes[0]
              : `${s.contextNotes[0]} (and more under ⓘ)`}
          </p>
        )}
        {openId === id && (
          <div class="info-panel">
            <p>
              <strong>{insight.reading}</strong>
            </p>
            {insight.move && (
              <>
                <h4>More</h4>
                <p>{insight.move}</p>
              </>
            )}
            {s.contextNotes.length > 0 && (
              <>
                <h4>Why it ranks here</h4>
                {s.contextNotes.map((note) => (
                  <p key={note} class="context">
                    {note}
                  </p>
                ))}
              </>
            )}
          </div>
        )}
      </li>
    )
  }
  // A motif option's card: tap to hear it, lit; + to add it.
  const motifCard = (s: MotifSuggestion) => {
    const label = motifLabel(s.candidate)
    const id = `motif-${label}`
    return (
      <li
        key={id}
        class={previewId === id ? 'suggestion previewing' : 'suggestion'}
      >
        <button
          type="button"
          class="preview"
          aria-pressed={previewId === id}
          onClick={() => previewMotif(id, s.candidate.notes)}
        >
          <span class="symbol">{label}</span>
          <span class="numeral">{motifText(s.candidate.notes)}</span>
        </button>
        <button
          type="button"
          class="accept"
          aria-label={`Add ${label}`}
          title={`Add ${label}`}
          onClick={() => addMotif(s.candidate.notes)}
        >
          +
        </button>
        <p class="why">{s.explanation}</p>
      </li>
    )
  }
  const [text, setText] = useState('')
  const [unknown, setUnknown] = useState<string[]>([])
  const addTyped = () => {
    const typed = typeMelody(text, value.length, {
      start: addDur(melodyEnd(melody), entry.gap),
      from: melody.at(-1)?.note,
    })
    setUnknown(typed.unknown)
    if (typed.notes.length) {
      onChange([...melody, ...typed.notes])
      set({ gap: ZERO })
      setText('')
    }
  }
  // Recording on MIDI (SPEC 7.2): a bar's count-in, then clicks on every
  // beat while the take runs, with the chords if wanted. It stops with
  // Stop or at the end of the last chord, and replaces the melody (Undo
  // brings the old one back).
  const [phase, setPhase] = useState<Phase>('idle')
  const [count, setCount] = useState(0)
  const [withChords, setWithChords] = useState(true)
  const [heard, setHeard] = useState<string>()
  const take = useRef<Take>()
  const timers = useRef<number[]>([])
  const later = (fn: () => void, ms: number) =>
    timers.current.push(window.setTimeout(fn, Math.max(0, ms)))
  const clearTimers = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }
  useEffect(() => clearTimers, [])
  useEffect(() => {
    if (phase === 'idle') return
    return midi.onEvent((event, at) => {
      if (take.current) take.current = takeEvent(take.current, event, at)
    })
  }, [phase])
  // Each bar's clicks, one bar at a time so the take can run on.
  function clickBar(bar: number, at: number) {
    const meter = bar === 0 ? time.meter : meterOfBar(time, bar)
    beatsOf(meter).forEach((beat, i) => {
      const ms =
        at + secondsOf(beat.onset, bpm, time.meter) * 1000 - performance.now()
      later(() => {
        void playClick(i === 0)
        if (bar === 0) setCount(i + 1)
      }, ms)
    })
    const next = at + secondsOf(barLength(meter), bpm, time.meter) * 1000
    later(() => clickBar(bar + 1, next), next - performance.now() - 50)
  }
  function record() {
    onRecordStart()
    clearTimers()
    setHeard(undefined)
    const now = performance.now() + 100
    const countIn = secondsOf(barLength(time.meter), bpm, time.meter) * 1000
    const start = now + countIn
    take.current = startTake(start)
    setCount(0)
    setPhase('count-in')
    clickBar(0, now)
    later(() => {
      setPhase('recording')
      if (withChords && end) onPlayChords()
    }, start - performance.now())
    if (end) {
      const ms = secondsOf(end, bpm, time.meter) * 1000
      later(stopRecording, start + ms - performance.now())
    }
  }
  function stopRecording() {
    clearTimers()
    const done = take.current
    take.current = undefined
    setPhase('idle')
    onStop()
    if (!done) return
    const notes = quantise(finishTake(done, performance.now()), {
      bpm,
      meter: time.meter,
      grid: entry.grid,
      key: keyValue,
      end,
    })
    if (!notes.length) {
      setHeard('Nothing was played, so the melody stays as it was.')
      return
    }
    onChange(notes)
    setHeard(
      `Recorded ${notes.length} note${notes.length === 1 ? '' : 's'}. Undo brings back the melody before.`,
    )
  }
  return (
    <section class="melody" aria-label="Melody">
      <p class="muted">
        {melody.length
          ? `${melody.length} note${melody.length === 1 ? '' : 's'}, ending ${formatNote(last!.note)}. It shows under the chords and plays with ▶ Play.`
          : 'No melody yet. Tap it on the instrument, type it, or record it on your MIDI keyboard.'}
      </p>
      <div class="melody-bar">
        {playing ? (
          <button type="button" class="play" onClick={onStop}>
            ■ Stop
          </button>
        ) : (
          <>
            <button
              type="button"
              class="play"
              disabled={!melody.length}
              onClick={() => onPlay(false)}
            >
              ▶ Play melody
            </button>
            <button
              type="button"
              class="play"
              disabled={!melody.length || !end}
              title={
                end ? undefined : 'Add chords to play the melody with them'
              }
              onClick={() => onPlay(true)}
            >
              ▶ Play with chords
            </button>
          </>
        )}
        <button
          type="button"
          disabled={!melody.length}
          title="Take out the last note (Undo brings it back)"
          onClick={() => onChange(removeLast(melody))}
        >
          ⌫ Last note
        </button>
        <button
          type="button"
          disabled={!melody.length}
          title="Clear the melody (Undo brings it back)"
          onClick={() => {
            onChange([])
            set({ gap: ZERO })
          }}
        >
          Clear
        </button>
      </div>

      <h3>Tap or type</h3>
      <div class="note-values" role="group" aria-label="Note value">
        <span class="muted">Each note lasts:</span>
        {NOTE_VALUES.map((v) => (
          <button
            key={v.id}
            type="button"
            aria-pressed={v.id === value.id}
            title={v.name}
            onClick={() => set({ value: v.id })}
          >
            {v.symbol}
            <small>{valueFraction(v.length)}</small>
          </button>
        ))}
        <span class="muted">{value.name}</span>
      </div>
      <div class="melody-bar">
        <label>
          <input
            type="checkbox"
            checked={entry.tap}
            onChange={(e) => set({ tap: e.currentTarget.checked })}
          />{' '}
          Tapping the instrument adds notes
        </label>
        <button
          type="button"
          title={`A ${value.name} rest before the next note`}
          onClick={() => set({ gap: addDur(entry.gap, value.length) })}
        >
          𝄽 Rest
        </button>
        {entry.gap.n > 0 && (
          <span class="muted">
            A {valueName(entry.gap)} rest before the next note{' '}
            <button type="button" onClick={() => set({ gap: ZERO })}>
              ×
            </button>
          </span>
        )}
      </div>
      <h3>Next note</h3>
      <div class="melody-bar">
        <label>
          Range
          <select
            value={rangeSetting?.preset ?? 'tenor'}
            onChange={(e) => {
              const preset = e.currentTarget.value
              onRangeSetting(
                preset === 'custom'
                  ? { preset, low: range.low, high: range.high }
                  : { preset },
              )
            }}
          >
            {RANGE_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label} ({p.low}–{p.high})
              </option>
            ))}
            <option value="custom">Your own</option>
          </select>
        </label>
        {rangeSetting?.preset === 'custom' && (
          <>
            <RangeNote
              key={`low-${formatNote(range.low)}`}
              label="From"
              value={range.low}
              onChange={(low) => onRangeSetting({ ...rangeSetting, low })}
            />
            <RangeNote
              key={`high-${formatNote(range.high)}`}
              label="to"
              value={range.high}
              onChange={(high) => onRangeSetting({ ...rangeSetting, high })}
            />
          </>
        )}
      </div>
      <div class="suggest melody-suggest">
        <p class="muted">
          {last
            ? `What could follow ${formatNote(last.note)}, as a ${value.name}: tap one to hear it after ${formatNote(last.note)}; + to add it.`
            : `Notes to start on, as a ${value.name}: tap one to hear it; + to add it.`}
        </p>
        {ranked.groups.map((group) => (
          <div key={group.category} class="group">
            <h3>{MELODY_CATEGORY_LABELS[group.category]}</h3>
            <ul>{group.suggestions.map((s) => noteCard(s))}</ul>
          </div>
        ))}
        {ranked.wildcard && (
          <div class="group wildcard">
            <h3>
              Wildcard{' '}
              <button
                type="button"
                class="another"
                disabled={ranked.wildcards < 2}
                onClick={() => setAnother(another + 1)}
              >
                Another
              </button>
            </h3>
            <ul>{noteCard(ranked.wildcard, true)}</ul>
          </div>
        )}
        {motif && (
          <div class="group motif">
            <h3>Motif</h3>
            <label class="motif-from">
              Motif from{' '}
              <select
                value={motif.bar}
                onChange={(e) => setMotifBar(Number(e.currentTarget.value))}
              >
                {motifs.map((m) => (
                  <option key={m.bar} value={m.bar}>
                    Bar {m.bar}: {motifText(m.notes)}
                  </option>
                ))}
              </select>
            </label>
            <ul>{motifChoices.map(motifCard)}</ul>
          </div>
        )}
      </div>

      <form
        class="melody-type"
        onSubmit={(e) => {
          e.preventDefault()
          addTyped()
        }}
      >
        <input
          type="text"
          value={text}
          placeholder="E4 F♯ G A B - r D"
          aria-label="Type note names"
          onInput={(e) => setText(e.currentTarget.value)}
        />
        <button type="submit" disabled={!text.trim()}>
          + Add
        </button>
      </form>
      <p class="muted">
        Note names with or without an octave (E4, F#, Bb); without one, a note
        goes to whichever octave is nearer the note before. r is a rest and -
        holds the note before, each for the note value chosen.
      </p>
      {unknown.length > 0 && (
        <p class="off-chord">Couldn’t read: {unknown.join(' ')}</p>
      )}

      <h3>Record on MIDI</h3>
      {midi.status !== 'connected' ? (
        <p class="muted">
          {midi.status === 'unsupported'
            ? 'This browser has no MIDI: use Chrome or Edge.'
            : 'Connect your MIDI keyboard first.'}{' '}
          {midi.status === 'idle' && (
            <button type="button" onClick={midi.connect}>
              Connect
            </button>
          )}
        </p>
      ) : (
        <>
          <div class="melody-bar">
            <label>
              Snap to
              <select
                value={entry.grid}
                disabled={phase !== 'idle'}
                onChange={(e) => set({ grid: e.currentTarget.value as GridId })}
              >
                {GRIDS.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <input
                type="checkbox"
                checked={withChords}
                disabled={phase !== 'idle' || !end}
                onChange={(e) => setWithChords(e.currentTarget.checked)}
              />{' '}
              Play the chords while recording
            </label>
          </div>
          <div class="melody-bar">
            {phase === 'idle' ? (
              <button
                type="button"
                class="record"
                disabled={playing}
                onClick={record}
              >
                ● Record
              </button>
            ) : (
              <button type="button" class="record on" onClick={stopRecording}>
                ■ Stop recording
              </button>
            )}
            <span class="muted" aria-live="polite">
              {phase === 'count-in'
                ? `Count-in: ${count || ''}`
                : phase === 'recording'
                  ? 'Recording…'
                  : `At ${tempoNote(time.meter)} = ${bpm}, from bar 1. A bar of clicks counts you in.`}
            </span>
          </div>
          <p class="muted">
            {end
              ? 'Recording stops at the end of the last chord, or with Stop.'
              : 'With no chords, recording runs until you press Stop.'}{' '}
            It replaces the melody; Undo brings the old one back.
          </p>
          {heard && <p class="muted">{heard}</p>}
        </>
      )}
    </section>
  )
}

// How each next-note tag reads.
const TAG_TEXT: Record<string, string> = {
  'chord-tone': 'chord tone',
  step: 'step',
  passing: 'passing',
  neighbour: 'neighbour',
  leap: 'leap',
  repeat: 'repeat',
  chromatic: 'chromatic',
  tendency: 'resolves',
}

// One end of a range of your own: a note name with its octave, kept when
// it reads (E2, F#5), otherwise left as it was.
function RangeNote({
  label,
  value,
  onChange,
}: {
  label: string
  value: MelodyNote['note']
  onChange: (note: MelodyNote['note']) => void
}) {
  const [text, setText] = useState(formatNote(value))
  return (
    <label>
      {label}
      <input
        type="text"
        size={4}
        value={text}
        onInput={(e) => setText(e.currentTarget.value)}
        onBlur={() => {
          const note = parseNote(text)
          if (note && note.octave !== undefined) onChange(note)
          else setText(formatNote(value))
        }}
      />
    </label>
  )
}
