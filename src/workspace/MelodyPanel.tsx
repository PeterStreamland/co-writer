import { useEffect, useRef, useState } from 'preact/hooks'
import {
  GRIDS,
  NOTE_VALUES,
  ZERO,
  addDur,
  barLength,
  beatsOf,
  formatNote,
  melodyEnd,
  meterOfBar,
  quantise,
  removeLast,
  typeMelody,
  valueFraction,
  valueName,
  type Dur,
  type GridId,
  type Key,
  type MelodyNote,
  type MeterMap,
} from '../theory'
import { playClick } from '../audio/player'
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

// The Melody tab (PLAN Phase 7 task 1, SPEC 7.2): enter a melody by tapping
// the fretboard or keyboard (step entry, with the note value chosen here),
// by typing note names, or by recording on MIDI after a one-bar count-in,
// snapped to the grid. The melody shows in the lane under the strip.
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
}) {
  const set = (part: Partial<MelodyEntry>) => onEntry({ ...entry, ...part })
  const value =
    NOTE_VALUES.find((v) => v.id === entry.value) ??
    NOTE_VALUES.find((v) => v.id === 'quarter')!
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
  const last = melody.at(-1)
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
