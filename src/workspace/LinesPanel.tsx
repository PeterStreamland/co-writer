import { useEffect, useMemo, useState } from 'preact/hooks'
import {
  ADD_MOVES,
  LINE_DENSITIES,
  LINE_GROUPS,
  addOptions,
  chordSymbol,
  formatNote,
  lineSuggestions,
  noteOptions,
  rangeOf,
  removeNote,
  subDur,
  swapNote,
  type BarNote,
  type Key,
  type LineDensity,
  type Meter,
  type Placement,
} from '../theory'
import { playNote } from '../audio/player'
import { pathNodes, type Progression } from '../sketch/progression'
import { secondsOf } from '../sketch/time'
import type { ArpeggioOnShow } from './ArpeggioPanel'
import { InfoToggle, useToggle } from './ChordInfo'
import type { Along, AlongNote } from './along'
import type { PartRecipe } from '../sketch/parts'
import {
  TAG_LABELS,
  densityStep,
  densitySteps,
  editKey,
  editedLine,
  labelNumber,
  lineRecipe,
  lineSteps,
  loadLineDensity,
  loadLineMode,
  saveLineDensity,
  saveLineMode,
  type BarEdit,
  type LineEdits,
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
// Editing (David's request): the line can play one note a chord up to two
// a beat, and each bar can have fewer or more with − and +. Tap a note for
// notes to play in its place, best first, and ways to add notes after it
// (a passing or approach note, another chord tone, a run, or the note
// again), or to take it out. An edited bar keeps its notes, marked, until
// ↺ gives it back to the line.
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
  onAddBar,
  edits,
  onEdits,
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
  // Adds the line as a row under the progression, with its bars of their
  // own by chord.
  onAddRow: (recipe: PartRecipe, cells?: Record<number, PartRecipe>) => void
  // Adds one chord's bar of the line to a row.
  onAddBar: (step: number, recipe: PartRecipe) => void
  // Every line's bars of their own, by editKey, and changing them.
  edits: Record<string, LineEdits>
  onEdits: (edits: Record<string, LineEdits>) => void
}) {
  const [modeId, setModeId] = useState(loadLineMode)
  useEffect(() => saveLineMode(modeId), [modeId])
  const [density, setDensity] = useState<LineDensity | undefined>(
    loadLineDensity,
  )
  useEffect(() => saveLineDensity(density), [density])
  const steps = useMemo(
    () => lineSteps(progression, sectionKey, timing),
    [progression, sectionKey, timing],
  )
  const nodes = useMemo(
    () => pathNodes(progression).map((n) => n.id),
    [progression],
  )
  // The Wildcard's roll: 0 repeats for the same chords; Another adds one.
  const [roll, setRoll] = useState(0)
  useEffect(() => setRoll(0), [steps])
  const suggestions = useMemo(
    () =>
      lineSuggestions(
        steps.map((s) => ({ ...s, density })),
        roll,
      ),
    [steps, roll, density],
  )
  const chosen = suggestions.find((s) => s.candidate.mode.id === modeId)
  const line = chosen?.candidate
  // This line's bars of their own, and the notes it plays with them.
  const key = editKey(modeId, roll)
  const barEdits = useMemo(() => edits[key] ?? {}, [edits, key])
  const dense = useMemo(
    () => densitySteps(steps, nodes, density, barEdits),
    [steps, nodes, density, barEdits],
  )
  const notes = useMemo(
    () =>
      line
        ? editedLine(steps, nodes, line.mode.id, roll, density, barEdits)
        : [],
    [line, steps, nodes, roll, density, barEdits],
  )
  const setBar = (step: number, edit: BarEdit | undefined) => {
    if (!edit?.notes) setPicked(undefined)
    const next = { ...barEdits }
    if (edit && (edit.density || edit.notes)) next[nodes[step]] = edit
    else delete next[nodes[step]]
    onEdits({ ...edits, [key]: next })
  }
  const editBar = (step: number, bar: BarNote[]) =>
    setBar(step, { ...barEdits[nodes[step]], notes: bar })
  const [infoOpen, toggleInfo] = useToggle()
  const [focus, setFocus] = useState(0)
  const [picked, setPicked] = useState<number>()
  // The note sounding while the line plays, alone or with the chords, by
  // its index in the line.
  const [alone, setAlone] = useState<number>()
  const [on, setOn] = useState(false)
  const together = line !== undefined && along?.source === notes
  const playing = together ? alongAt?.ref : alone
  useEffect(() => {
    setOn(false)
    setPicked(undefined)
  }, [line, density])
  const at = Math.min(focus, Math.max(0, steps.length - 1))
  const shownStep =
    playing !== undefined && notes[playing] ? notes[playing].step : at

  // Lights the chord's notes on the instrument, labelled; the one sounding
  // glows.
  useEffect(() => {
    if (!line || !chosen) {
      onShow(undefined)
      return
    }
    const shown = notes
      .map((n, i) => ({ n, i }))
      .filter(({ n }) => n.step === shownStep)
    onShow({
      chord: steps[shownStep].chord,
      name: line.mode.label,
      notes: shown.map(({ n }) => ({
        note: n.note,
        midi: n.midi,
        label: n.label,
        number: labelNumber(n.label, n.tags.includes('chord-tone')),
      })),
      sounding:
        playing === undefined
          ? undefined
          : shown.findIndex(({ i }) => i === playing),
    })
  }, [notes, shownStep, playing])
  useEffect(() => () => onShow(undefined), [])

  // Plays every note of the line in time.
  useEffect(() => {
    if (!on || !line) {
      setAlone(undefined)
      return
    }
    const start = steps[0].placed.start
    const timers = notes.map((n, i) =>
      setTimeout(
        () => {
          setAlone(i)
          void playNote(n.note, secondsOf(n.length, bpm, meter))
        },
        secondsOf(subDur(n.onset, start), bpm, meter) * 1000,
      ),
    )
    const last = notes[notes.length - 1]
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
  const pickedNote = picked === undefined ? undefined : notes[picked]
  const swaps =
    picked === undefined || !pickedNote
      ? []
      : noteOptions(notes, picked, dense, rangeOf(line.mode))
  const adds =
    picked === undefined || !pickedNote ? [] : addOptions(notes, picked, dense)
  const removed =
    picked === undefined || !pickedNote
      ? undefined
      : removeNote(notes, picked, dense)
  const edited = Object.keys(barEdits).length > 0
  // A bar's own settings as a recipe, for a row.
  const barRecipe = (s: number) =>
    lineRecipe(
      line.mode.id,
      roll,
      barEdits[nodes[s]]?.density ?? density,
      barEdits[nodes[s]]?.notes,
    )
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
                  source: notes,
                  notes: notes.map((n, ref) => ({ ...n, ref })),
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
            onAddRow(
              lineRecipe(line.mode.id, roll, density),
              Object.fromEntries(
                nodes.flatMap((n, s) =>
                  barEdits[n] ? [[s, barRecipe(s)]] : [],
                ),
              ),
            )
          }
        >
          + Add as a row
        </button>
        {edited && (
          <button
            type="button"
            title="Give every bar back to the line"
            onClick={() => {
              setPicked(undefined)
              onEdits({ ...edits, [key]: {} })
            }}
          >
            ↺ Undo all edits
          </button>
        )}
      </div>
      <div class="line-density" role="group" aria-label="Notes a bar">
        <span class="muted">Notes a bar:</span>
        <button
          type="button"
          aria-pressed={density === undefined}
          title="Each line plays as it was made to"
          onClick={() => setDensity(undefined)}
        >
          As the line plays
        </button>
        {LINE_DENSITIES.map((d) => (
          <button
            key={d.id}
            type="button"
            aria-pressed={density === d.id}
            onClick={() => setDensity(d.id)}
          >
            {d.label}
          </button>
        ))}
      </div>
      <ol class="line-chords">
        {steps.map((step, s) => {
          const own = barEdits[nodes[s]]
          const count = notes.filter((n) => n.step === s).length
          const fewer = densityStep(step, count, -1)
          const more = densityStep(step, count, 1)
          const label = `${chordSymbol(step.chord)} in bar ${step.placed.bar}`
          const first = notes.find((n) => n.step === s)
          const offChord =
            own?.notes !== undefined &&
            first !== undefined &&
            !first.tags.includes('chord-tone')
          return (
            <li
              key={s}
              class={s === shownStep ? 'line-chord focus' : 'line-chord'}
            >
              <div class="bar-head">
                <button
                  type="button"
                  class="line-chord-name"
                  aria-pressed={s === at}
                  onClick={() => setFocus(s)}
                >
                  {chordSymbol(step.chord)}
                  <span class="muted"> · bar {step.placed.bar}</span>
                  {own?.notes && <span class="edited"> · edited</span>}
                </button>
                <span class="bar-density">
                  <button
                    type="button"
                    aria-label={`Fewer notes over ${label}`}
                    title={
                      own?.notes
                        ? 'Take notes out by tapping one, or ↺ to give the bar back to the line'
                        : 'Fewer notes in this bar'
                    }
                    disabled={!fewer || own?.notes !== undefined}
                    onClick={() =>
                      fewer && setBar(s, { ...own, density: fewer })
                    }
                  >
                    −
                  </button>
                  <span class="muted">{count}</span>
                  <button
                    type="button"
                    aria-label={`More notes over ${label}`}
                    title={
                      own?.notes
                        ? 'Add notes by tapping one, or ↺ to give the bar back to the line'
                        : 'More notes in this bar'
                    }
                    disabled={!more || own?.notes !== undefined}
                    onClick={() => more && setBar(s, { ...own, density: more })}
                  >
                    +
                  </button>
                </span>
                {own && (
                  <button
                    type="button"
                    class="bar-reset"
                    aria-label={`Give ${label} back to the line`}
                    title="Give this bar back to the line"
                    onClick={() => {
                      setPicked(undefined)
                      setBar(s, undefined)
                    }}
                  >
                    ↺
                  </button>
                )}
                <button
                  type="button"
                  class="add-bar"
                  aria-label={`Add the line over ${label} to a row`}
                  title="Add this bar of the line to a row"
                  onClick={() => onAddBar(s, barRecipe(s))}
                >
                  + Row
                </button>
              </div>
              {offChord && (
                <p class="off-chord">
                  Starts off {chordSymbol(step.chord)}: its first note isn’t one
                  of the chord’s.
                </p>
              )}
              <span class="line-notes">
                {notes.map((n, i) =>
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
          )
        })}
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
          <span class="muted">
            Tap a note to see why it’s there, and to change it.
          </span>
        )}
      </p>
      {pickedNote && picked !== undefined && (
        <div class="note-edit">
          <div class="note-options" role="group" aria-label="Play instead">
            <span class="muted">Play instead:</span>
            {swaps.map((o) => (
              <button
                key={o.candidate.midi}
                type="button"
                class={[
                  'line-note',
                  `tag-${o.tags[0]}`,
                  o.tags.includes('chromatic') ? 'chromatic' : '',
                ].join(' ')}
                title={[o.explanation, ...o.contextNotes].join(' ')}
                onClick={() => {
                  editBar(
                    pickedNote.step,
                    swapNote(notes, picked, dense, o.candidate.note),
                  )
                  void playNote(o.candidate.note, 0.5)
                }}
              >
                <span class="label">{o.candidate.label}</span>
                <span class="name">{formatNote(o.candidate.note)}</span>
              </button>
            ))}
          </div>
          <div class="note-options" role="group" aria-label="Add after it">
            <span class="muted">Add after it:</span>
            {adds.map((o) => (
              <button
                key={o.tags[1]}
                type="button"
                title={o.explanation}
                onClick={() => editBar(pickedNote.step, o.candidate)}
              >
                + {ADD_LABELS[o.tags[1]] ?? o.tags[1]}
              </button>
            ))}
            {adds.length === 0 && (
              <span class="muted">no room: it’s a semiquaver already</span>
            )}
            {removed && (
              <button
                type="button"
                class="remove-note"
                title="Take this note out: the note before holds on"
                onClick={() => {
                  editBar(pickedNote.step, removed)
                  setPicked(undefined)
                }}
              >
                × Take it out
              </button>
            )}
          </div>
        </div>
      )}
      <p class="legend muted">
        <span class="line-key tag-chord-tone">chord tone</span>
        <span class="line-key tag-passing">passing</span>
        <span class="line-key tag-neighbour">neighbour</span>
        <span class="line-key tag-approach">approach</span>
        <span class="line-key tag-pedal">pedal</span>
        <span class="line-key tag-free">your own</span>
        <span class="line-key chromatic">outside the key</span>
      </p>
    </section>
  )
}

const ADD_LABELS: Record<string, string> = Object.fromEntries(
  ADD_MOVES.map((m) => [m.id, m.label.toLowerCase()]),
)
