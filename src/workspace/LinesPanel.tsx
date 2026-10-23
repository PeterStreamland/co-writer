import { useEffect, useMemo, useState } from 'preact/hooks'
import {
  LINE_GROUPS,
  chordSymbol,
  formatNote,
  lineSuggestions,
  subDur,
  type Key,
  type Meter,
  type Placement,
} from '../theory'
import { playNote } from '../audio/player'
import type { Progression } from '../sketch/progression'
import { secondsOf } from '../sketch/time'
import type { ArpeggioOnShow } from './ArpeggioPanel'
import { InfoToggle, useToggle } from './ChordInfo'
import type { Along, AlongNote } from './along'
import type { PartRecipe } from '../sketch/parts'
import {
  TAG_LABELS,
  labelNumber,
  lineSteps,
  loadLineMode,
  saveLineMode,
} from './lines-view'

// The Lines tab (PLAN Phase 6 tasks 3–4, SPEC 6.2, 7.4): every line mode
// over the progression as a suggestion, grouped as bass lines, inner voices
// and lines between chords, best first in each group. The chosen line
// shows its first line of explanation, with ⓘ for the theory and what moved
// its ranking, and its notes chord by chord, every note tagged and
// explained, laid on the beats. Tap a chord to light its notes on the
// instrument; tap a note to see why it's there. Play with chords plays the
// progression with the line over it (task 5), lights and all; the line can
// also play alone. The Wildcard (David's request) comes last: a line chance
// builds afresh on every roll of Another.
export function LinesPanel({
  progression,
  sectionKey,
  timing,
  bpm,
  meter,
  onShow,
  along,
  alongAt,
  onPlayAlong,
  onStop,
  onAddRow,
}: {
  progression: Progression
  sectionKey: Key
  timing: Placement[]
  bpm: number
  meter: Meter
  onShow: (show: ArpeggioOnShow | undefined) => void
  // Notes playing with the progression's chords (task 5), if any, and the
  // one sounding; starting and stopping that playback.
  along?: Along
  alongAt?: AlongNote
  onPlayAlong: (notes: Along) => void
  onStop: () => void
  // Adds the line as a row under the progression.
  onAddRow: (recipe: PartRecipe) => void
}) {
  const [modeId, setModeId] = useState(loadLineMode)
  useEffect(() => saveLineMode(modeId), [modeId])
  const steps = useMemo(
    () => lineSteps(progression, sectionKey, timing),
    [progression, sectionKey, timing],
  )
  // The Wildcard's roll: 0 repeats for the same chords; Another adds one.
  const [roll, setRoll] = useState(0)
  useEffect(() => setRoll(0), [steps])
  const suggestions = useMemo(() => lineSuggestions(steps, roll), [steps, roll])
  const chosen = suggestions.find((s) => s.candidate.mode.id === modeId)
  const line = chosen?.candidate
  const [infoOpen, toggleInfo] = useToggle()
  const [focus, setFocus] = useState(0)
  const [picked, setPicked] = useState<number>()
  // The note sounding while the line plays, alone or with the chords, by
  // its index in the line.
  const [alone, setAlone] = useState<number>()
  const [on, setOn] = useState(false)
  const together = line !== undefined && along?.source === line
  const playing = together ? alongAt?.ref : alone
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
    if (!line || !chosen) {
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
      setAlone(undefined)
      return
    }
    const start = steps[0].placed.start
    const timers = line.notes.map((n, i) =>
      setTimeout(
        () => {
          setAlone(i)
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
      <div class="line-suggestions">
        {LINE_GROUPS.map((g) => (
          <div key={g.id} class={`line-group ${g.id}`}>
            <span class="muted">{g.label}:</span>
            {suggestions
              .filter((s) => s.tags[0] === g.id)
              .map((s) => (
                <button
                  key={s.candidate.mode.id}
                  type="button"
                  aria-pressed={s.candidate.mode.id === modeId}
                  title={s.explanation}
                  onClick={() => setModeId(s.candidate.mode.id)}
                >
                  {s.candidate.mode.label}
                </button>
              ))}
            {g.id === 'wildcard' && (
              <button
                type="button"
                class="another"
                title="Roll a new Wildcard line"
                onClick={() => {
                  setRoll(roll + 1)
                  setModeId('wildcard')
                }}
              >
                🎲 Another
              </button>
            )}
          </div>
        ))}
      </div>
      <p class="line-explanation">
        <strong>{line.mode.label}</strong> · {chosen.explanation}{' '}
        <InfoToggle
          open={infoOpen}
          label={line.mode.label}
          onToggle={toggleInfo}
        />
      </p>
      {infoOpen && (
        <div class="info-panel">
          <h4>More</h4>
          <p>{chosen.more}</p>
          {chosen.contextNotes.map((note) => (
            <p key={note} class="context">
              {note}
            </p>
          ))}
        </div>
      )}
      <div class="lines-bar">
        {on || together ? (
          <button
            type="button"
            class="play"
            onClick={() => (together ? onStop() : setOn(false))}
          >
            ■ Stop
          </button>
        ) : (
          <>
            <button
              type="button"
              class="play"
              onClick={() =>
                onPlayAlong({
                  source: line,
                  notes: line.notes.map((n, ref) => ({ ...n, ref })),
                })
              }
            >
              ▶ Play with chords
            </button>
            <button type="button" onClick={() => setOn(true)}>
              ▶ Line alone
            </button>
          </>
        )}
        <button
          type="button"
          class="add-row"
          title="Add this line as a row under the progression"
          onClick={() =>
            onAddRow({
              kind: 'line',
              mode: line.mode.id,
              roll: line.mode.id === 'wildcard' ? roll : 0,
            })
          }
        >
          + Add as a row
        </button>
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
