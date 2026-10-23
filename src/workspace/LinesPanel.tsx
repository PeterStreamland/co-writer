import { useEffect, useMemo, useState } from 'preact/hooks'
import {
  LINE_GROUPS,
  LINE_MODES,
  chordSymbol,
  formatNote,
  lineFor,
  subDur,
  type Key,
  type Meter,
  type Placement,
} from '../theory'
import { playNote } from '../audio/player'
import type { Progression } from '../sketch/progression'
import { secondsOf } from '../sketch/time'
import type { ArpeggioOnShow } from './ArpeggioPanel'
import {
  TAG_LABELS,
  labelNumber,
  lineSteps,
  loadLineMode,
  saveLineMode,
} from './lines-view'

// The Lines tab (PLAN Phase 6 task 3, SPEC 7.4): a line over the
// progression in one of the modes (bass lines, inner voices, lines between
// chords), every note tagged and explained, laid on the beats. Tap a chord
// to light its notes on the instrument; tap a note to see why it's there.
// Play plays the line alone at the tempo; playing it with the chords comes
// next (task 5).
export function LinesPanel({
  progression,
  sectionKey,
  timing,
  bpm,
  meter,
  onShow,
}: {
  progression: Progression
  sectionKey: Key
  timing: Placement[]
  bpm: number
  meter: Meter
  onShow: (show: ArpeggioOnShow | undefined) => void
}) {
  const [modeId, setModeId] = useState(loadLineMode)
  useEffect(() => saveLineMode(modeId), [modeId])
  const steps = useMemo(
    () => lineSteps(progression, sectionKey, timing),
    [progression, sectionKey, timing],
  )
  const line = useMemo(
    () => (steps.length ? lineFor(modeId, steps) : undefined),
    [modeId, steps],
  )
  const [focus, setFocus] = useState(0)
  const [picked, setPicked] = useState<number>()
  // The note sounding while the line plays, by its index in the line.
  const [playing, setPlaying] = useState<number>()
  const [on, setOn] = useState(false)
  useEffect(() => {
    setOn(false)
    setPicked(undefined)
  }, [line])
  const at = Math.min(focus, Math.max(0, steps.length - 1))
  const shownStep =
    playing !== undefined && line ? line.notes[playing].step : at

  // Lights the chord's notes on the instrument, labelled; the one sounding
  // glows.
  useEffect(() => {
    if (!line) {
      onShow(undefined)
      return
    }
    const notes = line.notes
      .map((n, i) => ({ n, i }))
      .filter(({ n }) => n.step === shownStep)
    onShow({
      chord: steps[shownStep].chord,
      name: line.mode.label,
      notes: notes.map(({ n }) => ({
        note: n.note,
        midi: n.midi,
        label: n.label,
        number: labelNumber(n.label, n.tags.includes('chord-tone')),
      })),
      sounding:
        playing === undefined
          ? undefined
          : notes.findIndex(({ i }) => i === playing),
    })
  }, [line, shownStep, playing])
  useEffect(() => () => onShow(undefined), [])

  // Plays every note of the line in time.
  useEffect(() => {
    if (!on || !line) {
      setPlaying(undefined)
      return
    }
    const start = steps[0].placed.start
    const timers = line.notes.map((n, i) =>
      setTimeout(
        () => {
          setPlaying(i)
          void playNote(n.note, secondsOf(n.length, bpm, meter))
        },
        secondsOf(subDur(n.onset, start), bpm, meter) * 1000,
      ),
    )
    const last = line.notes[line.notes.length - 1]
    const end =
      secondsOf(subDur(last.onset, start), bpm, meter) +
      secondsOf(last.length, bpm, meter)
    timers.push(setTimeout(() => setOn(false), end * 1000))
    return () => timers.forEach(clearTimeout)
  }, [on])

  if (!line) {
    return (
      <section class="lines">
        <p class="muted">
          Add chords to the progression to hear lines over them.
        </p>
      </section>
    )
  }
  const pickedNote = picked === undefined ? undefined : line.notes[picked]
  return (
    <section class="lines" aria-label="Lines">
      <div class="lines-bar">
        <label>
          Line
          <select
            value={modeId}
            onChange={(e) => setModeId(e.currentTarget.value as typeof modeId)}
          >
            {LINE_GROUPS.map((g) => (
              <optgroup key={g.id} label={g.label}>
                {LINE_MODES.filter((m) => m.group === g.id).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        {on ? (
          <button type="button" class="play" onClick={() => setOn(false)}>
            ■ Stop
          </button>
        ) : (
          <button type="button" class="play" onClick={() => setOn(true)}>
            ▶ Play line
          </button>
        )}
        <span class="muted">{line.mode.blurb}</span>
      </div>
      <ol class="line-chords">
        {steps.map((step, s) => (
          <li
            key={s}
            class={s === shownStep ? 'line-chord focus' : 'line-chord'}
          >
            <button
              type="button"
              class="line-chord-name"
              aria-pressed={s === at}
              onClick={() => setFocus(s)}
            >
              {chordSymbol(step.chord)}
              <span class="muted"> · bar {step.placed.bar}</span>
            </button>
            <span class="line-notes">
              {line.notes.map((n, i) =>
                n.step !== s ? null : (
                  <button
                    key={i}
                    type="button"
                    class={[
                      'line-note',
                      `tag-${n.tags[0]}`,
                      n.tags.includes('chromatic') ? 'chromatic' : '',
                      i === playing ? 'sounding' : '',
                      i === picked ? 'picked' : '',
                    ].join(' ')}
                    title={n.explanation}
                    aria-pressed={i === picked}
                    onClick={() => {
                      setPicked(i)
                      setFocus(s)
                    }}
                  >
                    <span class="label">{n.label}</span>
                    <span class="name">{formatNote(n.note)}</span>
                  </button>
                ),
              )}
            </span>
          </li>
        ))}
      </ol>
      <p class="line-why">
        {pickedNote ? (
          <>
            <strong>
              {formatNote(pickedNote.note)} ·{' '}
              {pickedNote.tags.map((t) => TAG_LABELS[t]).join(', ')}
            </strong>{' '}
            {pickedNote.explanation}
          </>
        ) : (
          <span class="muted">Tap a note to see why it’s there.</span>
        )}
      </p>
      <p class="legend muted">
        <span class="line-key tag-chord-tone">chord tone</span>
        <span class="line-key tag-passing">passing</span>
        <span class="line-key tag-neighbour">neighbour</span>
        <span class="line-key tag-approach">approach</span>
        <span class="line-key tag-pedal">pedal</span>
        <span class="line-key chromatic">outside the key</span>
      </p>
    </section>
  )
}
