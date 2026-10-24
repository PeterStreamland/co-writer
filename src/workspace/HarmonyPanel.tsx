import { useEffect, useState } from 'preact/hooks'
import {
  HARMONY_TAG_TEXT,
  ZERO,
  formatNote,
  harmonyKind,
  harmonyOptions,
  subDur,
  type HarmonySuggestion,
  type Key,
  type MelodyChord,
  type MelodyNote,
  type MeterMap,
} from '../theory'
import { playNote } from '../audio/player'
import { secondsOf } from '../sketch/time'
import { InfoToggle } from './ChordInfo'
import { notesByBar } from './melody-view'
import type { MelodyLight } from './MelodyPanel'

// The Harmony tab (Phase 7 task 14, David's note): harmonies and the
// countermelody for the melody (task 5, SPEC 7.4), moved out of the Melody
// tab into a tab of their own beside it. Each plays on its own row under
// the melody lane, where its notes can be changed (task 17).
export function HarmonyPanel({
  melody,
  keyValue,
  chords,
  time,
  bpm,
  harmonies,
  onHarmonies,
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
  // The harmonies playing with the melody, by id; changes are undoable.
  harmonies: string[]
  onHarmonies: (ids: string[]) => void
  // Lights notes on the instrument while previewing; undefined clears.
  onLight: (light: MelodyLight | undefined) => void
  playing: boolean
  canPlayChords: boolean
  // Plays the melody with its harmonies, with the chords or without.
  onPlay: (withChords: boolean) => void
  onStop: () => void
  // Opens the Melody tab, to write a melody first.
  onOpenMelody: () => void
}) {
  const [previewId, setPreviewId] = useState<string>()
  const [openId, setOpenId] = useState<string>()
  useEffect(() => {
    setPreviewId(undefined)
    onLight(undefined)
  }, [melody])
  useEffect(() => () => onLight(undefined), [])
  const hear = (notes: MelodyNote[]) => {
    const first = notes[0]?.onset ?? ZERO
    notes.forEach((n) =>
      window.setTimeout(
        () => void playNote(n.note, secondsOf(n.length, bpm, time.meter)),
        secondsOf(subDur(n.onset, first), bpm, time.meter) * 1000,
      ),
    )
  }
  // Harmonies (Phase 7 task 5): 3rds above first, 6ths below next, a
  // countermelody, the rest behind More. Tap one to hear it with the
  // melody; + to play it with the melody from then on.
  const harmonyChoices = harmonyOptions({
    melody,
    key: keyValue,
    chords,
    time,
  })
  const [moreHarmonies, setMoreHarmonies] = useState(false)
  const shownHarmonies = harmonyChoices.filter(
    (s) => moreHarmonies || harmonyKind(s.candidate.kind)?.common,
  )
  const harmonyCard = (s: HarmonySuggestion) => {
    const kind = harmonyKind(s.candidate.kind)!
    const id = `harmony-${kind.id}`
    const on = harmonies.includes(kind.id)
    const notes = s.candidate.notes
    return (
      <li
        key={id}
        class={previewId === id ? 'suggestion previewing' : 'suggestion'}
      >
        <button
          type="button"
          class="preview"
          aria-pressed={previewId === id}
          onClick={() => {
            setPreviewId(id)
            onLight({ notes: notes.map((n) => n.note) })
            hear([...melody, ...notes])
          }}
        >
          <span class="symbol">{kind.label}</span>
          {on && <span class="badge">Playing</span>}
        </button>
        <button
          type="button"
          class="accept"
          aria-pressed={on}
          aria-label={
            on
              ? `Stop playing ${kind.label}`
              : `Play ${kind.label} with the melody`
          }
          title={
            on
              ? `Stop playing ${kind.label}`
              : `Play ${kind.label} with the melody`
          }
          onClick={() =>
            onHarmonies(
              on
                ? harmonies.filter((h) => h !== kind.id)
                : [...harmonies, kind.id],
            )
          }
        >
          {on ? '✓' : '+'}
        </button>
        <ol class="harmony-bars" aria-label={`${kind.label}, bar by bar`}>
          {notesByBar(notes, time).map((b) => (
            <li key={b.bar}>
              <span class="harmony-bar-name">Bar {b.bar}</span>
              {b.notes.map((n) => (
                <span
                  key={n.place}
                  class={
                    n.tags.includes('chromatic')
                      ? 'harmony-chip chromatic'
                      : 'harmony-chip'
                  }
                  title={`${formatNote(n.note)}: ${n.tags
                    .map((t) => HARMONY_TAG_TEXT[t] ?? t)
                    .join(', ')}`}
                >
                  {formatNote(n.note)}
                </span>
              ))}
            </li>
          ))}
        </ol>
        <p class="why">
          {s.explanation}{' '}
          <InfoToggle
            open={openId === id}
            label={kind.label}
            onToggle={() => setOpenId(openId === id ? undefined : id)}
          />
        </p>
        {openId === id && (
          <div class="info-panel">
            <h4>Note by note</h4>
            {notes.map((n, i) => (
              <p key={i} class="context">
                <strong>{formatNote(n.note)}</strong>{' '}
                {n.tags.map((t) => (
                  <span key={t} class={`melody-tag tag-${t}`}>
                    {HARMONY_TAG_TEXT[t] ?? t}
                  </span>
                ))}{' '}
                {n.explanation}
              </p>
            ))}
          </div>
        )}
      </li>
    )
  }
  if (melody.length === 0) {
    return (
      <section class="melody" aria-label="Harmony">
        <p class="muted">
          Add a melody first: harmonies move with it, note for note.
        </p>
        <button type="button" onClick={onOpenMelody}>
          Add a melody
        </button>
      </section>
    )
  }
  return (
    <section class="melody" aria-label="Harmony">
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
      <div class="suggest melody-suggest">
        <p class="muted">
          {harmonies.length
            ? `Playing with the melody: ${harmonies
                .map((h) => harmonyKind(h)?.label ?? h)
                .join(
                  ', ',
                )}. They follow the melody as it changes; ✓ stops one.`
            : 'Tap one to hear it with the melody; + plays it with the melody from then on.'}
        </p>
        <ul>{shownHarmonies.map(harmonyCard)}</ul>
        <button
          type="button"
          class="another"
          onClick={() => setMoreHarmonies(!moreHarmonies)}
        >
          {moreHarmonies ? 'Fewer harmonies' : 'More harmonies…'}
        </button>
      </div>
    </section>
  )
}
