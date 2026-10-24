import { useEffect, useState } from 'preact/hooks'
import {
  CP_RULES,
  CP_TAG_TEXT,
  CP_TEXT,
  SPECIES,
  ZERO,
  counterpointId,
  counterpointLabel,
  counterpointOptions,
  formatNote,
  subDur,
  type CounterpointMode,
  type CounterpointOptions,
  type CounterpointSide,
  type Key,
  type MelodyChord,
  type MelodyNote,
  type MeterMap,
} from '../theory'
import { playNote } from '../audio/player'
import { secondsOf } from '../sketch/time'
import { InfoToggle } from './ChordInfo'
import { counterpointLine, notesByBar } from './melody-view'
import type { MelodyLight } from './MelodyPanel'

const SIDES: { id: CounterpointSide; label: string }[] = [
  { id: 'above', label: 'Above' },
  { id: 'below', label: 'Below' },
]
const MODES: { id: CounterpointMode; label: string; title: string }[] = [
  {
    id: 'strict',
    label: 'Strict',
    title: 'Textbook counterpoint, two voices against each other',
  },
  {
    id: 'freer',
    label: 'Freer',
    title:
      'Allows more, and leans on the chords: chord tones on the beat are preferred',
  },
]

// The Counterpoint tab (PLAN Phase 7 task 18, David's request): a line
// against the melody in one of the five species, above or below it, in
// strict or freer rules (David's choice: three pickers and one card). The
// card shows the line bar by bar, the rules it keeps or breaks in plain
// words and, behind ⓘ, why each note is there. ▶ hears it with the melody;
// + keeps it on a row of its own under the melody lane, where its notes
// can be changed as a harmony's can.
export function CounterpointPanel({
  melody,
  keyValue,
  chords,
  time,
  bpm,
  lines,
  onLines,
  onLight,
  playing,
  canPlayChords,
  onPlay,
  onStop,
  onOpenMelody,
}: {
  melody: MelodyNote[]
  keyValue: Key
  chords: MelodyChord[]
  time: MeterMap
  bpm: number
  // The lines kept, by id; changes are undoable.
  lines: string[]
  onLines: (ids: string[]) => void
  onLight: (light: MelodyLight | undefined) => void
  playing: boolean
  canPlayChords: boolean
  // Plays the melody with its harmonies and lines, with the chords or
  // without.
  onPlay: (withChords: boolean) => void
  onStop: () => void
  onOpenMelody: () => void
}) {
  const [choice, setChoice] = useState<CounterpointOptions>({
    species: 1,
    side: 'below',
    mode: 'strict',
  })
  const [previewing, setPreviewing] = useState(false)
  const [open, setOpen] = useState(false)
  useEffect(() => {
    setPreviewing(false)
    onLight(undefined)
  }, [melody])
  useEffect(() => () => onLight(undefined), [])
  const set = (patch: Partial<CounterpointOptions>) => {
    setChoice({ ...choice, ...patch })
    setPreviewing(false)
    onLight(undefined)
  }
  const hear = (notes: MelodyNote[]) => {
    const first = notes.reduce(
      (at, n) => (n.onset.n / n.onset.d < at.n / at.d ? n.onset : at),
      notes[0]?.onset ?? ZERO,
    )
    notes.forEach((n) =>
      window.setTimeout(
        () => void playNote(n.note, secondsOf(n.length, bpm, time.meter)),
        secondsOf(subDur(n.onset, first), bpm, time.meter) * 1000,
      ),
    )
  }
  if (melody.length === 0) {
    return (
      <section class="melody" aria-label="Counterpoint">
        <p class="muted">
          Add a melody first: a counterpoint line moves against it.
        </p>
        <button type="button" onClick={onOpenMelody}>
          Add a melody
        </button>
      </section>
    )
  }
  const id = counterpointId(choice)
  const line = counterpointLine({ melody, key: keyValue, chords, time }, choice)
  const kept = lines.includes(id)
  const label = counterpointLabel(choice)
  const broken = line.breaks.length
  const ruleLabel = (ruleId: string) =>
    CP_RULES.find((r) => r.id === ruleId)?.label ?? ruleId
  return (
    <section class="melody" aria-label="Counterpoint">
      <div class="melody-bar">
        {playing ? (
          <button type="button" class="play" onClick={onStop}>
            ■ Stop
          </button>
        ) : (
          <>
            <button type="button" class="play" onClick={() => onPlay(false)}>
              ▶ Play melody
            </button>
            <button
              type="button"
              class="play"
              disabled={!canPlayChords}
              title={
                canPlayChords
                  ? undefined
                  : 'Add chords to play the melody with them'
              }
              onClick={() => onPlay(true)}
            >
              ▶ Play with chords
            </button>
          </>
        )}
      </div>
      <div class="melody-bar phrase-bar counterpoint-pick">
        <label>
          Species
          <select
            value={choice.species}
            onChange={(e) =>
              set({
                species: Number(
                  e.currentTarget.value,
                ) as CounterpointOptions['species'],
              })
            }
          >
            {SPECIES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.id} · {s.label}
              </option>
            ))}
          </select>
        </label>
        <div class="note-values" role="group" aria-label="Side">
          {SIDES.map((s) => (
            <button
              key={s.id}
              type="button"
              aria-pressed={choice.side === s.id}
              title={`The line ${s.id} the melody`}
              onClick={() => set({ side: s.id })}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div class="note-values" role="group" aria-label="Rules">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              aria-pressed={choice.mode === m.id}
              title={m.title}
              onClick={() => set({ mode: m.id })}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
      <div class="suggest melody-suggest">
        <ul>
          <li class={previewing ? 'suggestion previewing' : 'suggestion'}>
            <button
              type="button"
              class="preview"
              aria-pressed={previewing}
              title="Hear it with the melody"
              onClick={() => {
                setPreviewing(true)
                onLight({ notes: line.notes.map((n) => n.note) })
                hear([...melody, ...line.notes])
              }}
            >
              <span class="symbol">▶ {label}</span>
              {kept && <span class="badge">Playing</span>}
            </button>
            <button
              type="button"
              class="accept"
              aria-pressed={kept}
              aria-label={
                kept ? `Stop playing ${label}` : `Keep ${label} as a row`
              }
              title={
                kept
                  ? `Stop playing ${label}`
                  : 'Keep it on a row of its own, playing with the melody'
              }
              onClick={() =>
                onLines(kept ? lines.filter((l) => l !== id) : [...lines, id])
              }
            >
              {kept ? '✓' : '+'}
            </button>
            <ol class="harmony-bars" aria-label={`${label}, bar by bar`}>
              {notesByBar(line.notes, time).map((b) => (
                <li key={b.bar}>
                  <span class="harmony-bar-name">Bar {b.bar}</span>
                  {b.notes.map((n) => (
                    <span
                      key={n.place}
                      class={[
                        'harmony-chip',
                        n.tags.includes('chromatic') ? 'chromatic' : '',
                        n.tags.includes('break') ? 'break' : '',
                      ].join(' ')}
                      title={`${formatNote(n.note)}: ${n.tags
                        .map((t) => CP_TAG_TEXT[t] ?? t)
                        .join(', ')}`}
                    >
                      {formatNote(n.note)}
                    </span>
                  ))}
                </li>
              ))}
            </ol>
            <p class="why">
              {broken === 0
                ? `Keeps every rule of ${choice.mode} counterpoint.`
                : `Breaks ${broken} rule${broken === 1 ? '' : 's'} of ${choice.mode} counterpoint: the notes outlined in red.`}{' '}
              <InfoToggle
                open={open}
                label={label}
                onToggle={() => setOpen(!open)}
              />
            </p>
            {broken > 0 && (
              <ul class="counterpoint-breaks">
                {line.breaks.map((b, i) => (
                  <li key={i}>
                    <strong>{ruleLabel(b.ruleId)}:</strong> {b.text}
                  </li>
                ))}
              </ul>
            )}
            {open && (
              <div class="info-panel">
                <h4>Note by note</h4>
                {line.notes.map((n, i) => (
                  <p key={i} class="context">
                    <strong>{formatNote(n.note)}</strong>{' '}
                    {n.tags
                      .filter((t) => CP_TAG_TEXT[t])
                      .map((t) => (
                        <span key={t} class={`melody-tag tag-${t}`}>
                          {CP_TAG_TEXT[t]}
                        </span>
                      ))}{' '}
                    {n.explanation}
                  </p>
                ))}
                {choice.mode === 'freer' && (
                  <p class="muted">
                    {CP_TEXT.freerNote} Chord tones on the beat are preferred.
                  </p>
                )}
              </div>
            )}
          </li>
        </ul>
        <p class="muted">
          {lines.length
            ? `Playing with the melody: ${lines
                .map((l) => {
                  const o = counterpointOptions(l)
                  return o ? counterpointLabel(o) : l
                })
                .join(
                  '; ',
                )}. Each has a row under the melody, where you can change its notes; ✓ stops one.`
            : 'Tap the line to hear it with the melody; + keeps it on a row of its own.'}
        </p>
      </div>
    </section>
  )
}
