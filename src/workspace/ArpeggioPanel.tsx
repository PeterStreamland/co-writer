import { useEffect, useMemo, useState } from 'preact/hooks'
import {
  ARPEGGIO_PATTERNS,
  ARPEGGIO_RATES,
  addDur,
  durEquals,
  withGaps,
  type ArpeggioGap,
  chordSymbol,
  formatNote,
  type ChordName,
  type Dur,
  type Key,
  type Meter,
} from '../theory'
import { playNote } from '../audio/player'
import type { Guitar } from '../instruments/guitar'
import { secondsOf } from '../sketch/time'
import type { ArpeggioShow, Instrument } from './InstrumentView'
import type { Along, AlongNote } from './along'
import type { PartRecipe } from '../sketch/parts'
import { roleOf } from '../instruments/chord-tones'
import {
  ARPEGGIO_CHOICES,
  OCTAVE_CHOICES,
  START_OCTAVES,
  loadArpeggio,
  planArpeggio,
  saveArpeggio,
  startOctave,
  voiceOf,
  type ArpeggioPlan,
  type ArpeggioSettings,
} from './arpeggio-view'
import { AddBarButton, type RowChoice } from './AddBarButton'

// A chord the tab can arpeggiate: from the progression, in its key and for
// its length there, or the current chord for a bar.
export type ArpeggioSource = {
  chord: ChordName
  key: Key
  length: Dur
  label: string
  lengthText: string // "1 bar", "2 beats"
  // For a chord of the progression: which one, and where it starts, so its
  // arpeggio can play along with the chords.
  step?: number
  start?: Dur
  bar?: number
}

// What the instrument view shows: the arpeggio and the chord it's of.
export type ArpeggioOnShow = ArpeggioShow & { chord: ChordName }

// The Arpeggio tab (PLAN Phase 6 task 2, David's idea): try arpeggios and
// extensions on a chord without adding anything to the progression. Pick a
// chord or step through the progression, choose the arpeggio (triad to
// 13th, or a lens's colours), a pattern, a rate and a range, and hear it at
// the tempo, each note lit and labelled on the instrument, alone or played
// with the progression's chords (David's request). On guitar it sits in one
// position (step through them) or runs across the neck.
export function ArpeggioPanel({
  sources,
  start,
  instrument,
  guitar,
  bpm,
  meter,
  onShow,
  along,
  alongAt,
  onPlayAlong,
  onStop,
  onAddRow,
  onAddBar,
  rowsOf,
}: {
  sources: ArpeggioSource[]
  // The source to begin on (the selected or current chord).
  start: number
  instrument: Instrument
  guitar: Guitar
  bpm: number
  meter: Meter
  onShow: (show: ArpeggioOnShow | undefined) => void
  // Notes playing along with the progression's chords, if any, and the one
  // sounding; starting and stopping that playback (David's request).
  along?: Along
  alongAt?: AlongNote
  onPlayAlong: (notes: Along) => void
  onStop: () => void
  // Adds these arpeggios as a row under the progression.
  onAddRow: (recipe: PartRecipe, cells?: Record<number, PartRecipe>) => void
  // Adds one chord's arpeggio to a row.
  // Adds one bar to a row: the row's id, or 'new'.
  onAddBar: (step: number, recipe: PartRecipe, into: string) => void
  // The rows of this tab's kind a bar can go into.
  rowsOf: RowChoice[]
}) {
  const [settings, setSettings] = useState(loadArpeggio)
  useEffect(() => saveArpeggio(settings), [settings])
  const change = (part: Partial<ArpeggioSettings>) =>
    setSettings({ ...settings, ...part })
  const [at, setAt] = useState(start)
  useEffect(() => setAt(start), [start])
  const index = Math.min(Math.max(0, at), sources.length - 1)
  const source = sources[index]
  const onGuitar = instrument === 'guitar'
  // Each bar can have its own pattern (David's request), by its place in
  // the list; the rest follow the tab's.
  const [barPatterns, setBarPatterns] = useState<Record<number, string>>({})
  // Each bar's rests and holds (David's request): a note of the pattern
  // tapped once is held (no new note; the one before rings on), twice is a
  // rest, three times plays again.
  const [barGaps, setBarGaps] = useState<
    Record<number, Record<number, ArpeggioGap>>
  >({})
  // A chord added or taken out moves the bars along, so they start over.
  useEffect(() => {
    setBarPatterns({})
    setBarGaps({})
  }, [sources.length])
  const cycleGap = (i: number, k: number) => {
    const own = { ...barGaps[i] }
    const now = own[k]
    if (!now) own[k] = 'hold'
    else if (now === 'hold') own[k] = 'rest'
    else delete own[k]
    setBarGaps({ ...barGaps, [i]: own })
  }
  // The recipe a bar's + and a row keep: its pattern, rests and holds.
  const recipeAt = (i: number, from: number | undefined): PartRecipe => {
    const gaps = barGaps[i]
    return {
      kind: 'arpeggio',
      settings: settingsAt(i),
      from,
      ...(gaps && Object.keys(gaps).length ? { gaps } : {}),
    }
  }
  const settingsAt = (i: number): ArpeggioSettings =>
    barPatterns[i] ? { ...settings, pattern: barPatterns[i] } : settings
  const plans = useMemo(
    () =>
      sources.map((s, i) =>
        planArpeggio(
          s.chord,
          s.key,
          settingsAt(i),
          s.length,
          onGuitar ? guitar : undefined,
        ),
      ),
    [sources, settings, barPatterns, onGuitar, guitar],
  )
  const plan = plans[index] as ArpeggioPlan | undefined
  const [positionAt, setPositionAt] = useState(0)
  useEffect(() => setPositionAt(0), [plan])
  const mode = onGuitar ? settings.guitar : undefined
  // In one position, the other chords play in the position nearest the
  // selected chord's, so playing through stays in one area of the neck.
  const here = plan?.positions[positionAt]?.from ?? 0
  const voiceAt = (i: number) => {
    const p = plans[i]
    if (i === index || mode !== 'position') return voiceOf(p, mode, positionAt)
    const nearest = p.positions.reduce(
      (best, q, j) =>
        Math.abs(q.from - here) < Math.abs(p.positions[best].from - here)
          ? j
          : best,
      0,
    )
    return voiceOf(p, mode, nearest)
  }
  // A bar's notes as they play, with its rests and holds.
  const eventsAt = (i: number) => withGaps(voiceAt(i).events, barGaps[i])
  // Which note of a bar's pattern starts at a moment of the progression.
  const eventAt = (i: number, onset: Dur) => {
    const start = sources[i].start
    if (!start) return undefined
    return eventsAt(i).find((e) => durEquals(addDur(start, e.onset), onset))
      ?.event
  }
  // The note sounding while the arpeggio plays: which chord, which note.
  // `event` is the note's place in the bar's pattern, so only the note on
  // the beat lights, not every one of the same pitch (David's report).
  const [ownPlaying, setPlaying] = useState<{
    at: number
    note: number
    event?: number
  }>()
  // Playing with the chords, the workspace says which note sounds.
  const together = along?.source === plans
  const alongSource =
    together && alongAt ? sources.findIndex((s) => s.step === alongAt.step) : -1
  const playing = together
    ? alongSource >= 0
      ? {
          at: alongSource,
          note: alongAt!.ref,
          event: eventAt(alongSource, alongAt!.onset),
        }
      : undefined
    : ownPlaying
  useEffect(() => {
    if (alongSource >= 0) setAt(alongSource)
  }, [alongSource])
  const [through, setThrough] = useState<number[]>()
  useEffect(() => setPlaying(undefined), [plans])
  useEffect(() => {
    if (!plan) {
      onShow(undefined)
      return
    }
    const showAt = playing && plans[playing.at] ? playing.at : index
    const showing = plans[showAt]
    const voice = voiceAt(showAt)
    onShow({
      chord: sources[showAt].chord,
      name: showing.name,
      notes: voice.notes.map((n) => ({
        note: n.note,
        midi: n.midi,
        label: n.label,
        number: n.number,
      })),
      spots: voice.spots,
      sounding: playing?.note,
      guitar: mode
        ? {
            mode,
            positions: showing.positions.map((q) => q.spots),
            at: showing.positions.findIndex((q) => q.spots === voice.spots),
            onAt: setPositionAt,
            onOnePosition: () => change({ guitar: 'position' }),
          }
        : undefined,
    })
  }, [plan, playing?.at, playing?.note, positionAt, mode])
  useEffect(() => () => onShow(undefined), [])

  // Plays the chords at `order` one after another, each arpeggio filling
  // its chord's length at the tempo.
  useEffect(() => {
    if (!through) {
      setPlaying(undefined)
      return
    }
    const timers: ReturnType<typeof setTimeout>[] = []
    let offset = 0
    for (const i of through) {
      const voice = voiceAt(i)
      eventsAt(i).forEach((e) => {
        const ms = (offset + secondsOf(e.onset, bpm, meter)) * 1000
        const seconds = secondsOf(e.length, bpm, meter)
        timers.push(
          setTimeout(() => {
            setAt(i)
            setPlaying({ at: i, note: e.index, event: e.event })
            void playNote(voice.notes[e.index].note, seconds * 1.5)
          }, ms),
        )
      })
      offset += secondsOf(sources[i].length, bpm, meter)
    }
    timers.push(
      setTimeout(() => {
        setPlaying(undefined)
        setThrough(undefined)
      }, offset * 1000),
    )
    return () => timers.forEach(clearTimeout)
  }, [through])
  useEffect(() => setThrough(undefined), [plans])
  // Plays the progression with each chord's arpeggio over it.
  const playWithChords = () =>
    onPlayAlong({
      source: plans,
      notes: sources.flatMap((s, i) => {
        if (s.step === undefined || !s.start) return []
        const step = s.step
        const start = s.start
        const voice = voiceAt(i)
        return eventsAt(i).map((e) => ({
          step,
          onset: addDur(start, e.onset),
          length: e.length,
          note: voice.notes[e.index].note,
          ref: e.index,
        }))
      }),
    })

  if (!source || !plan) {
    return (
      <section class="arpeggio">
        <p class="muted">
          Pick a chord in Explore, or add chords to the progression, to try its
          arpeggios here.
        </p>
      </section>
    )
  }
  const voice = voiceAt(index)
  const unplayable = mode !== undefined && !voice.spots
  return (
    <section class="arpeggio" aria-label="Arpeggios">
      <div class="arpeggio-settings">
        <label>
          Arpeggio
          <select
            value={settings.choice}
            onChange={(e) => change({ choice: e.currentTarget.value })}
          >
            {ARPEGGIO_CHOICES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Pattern
          <select
            value={settings.pattern}
            onChange={(e) => change({ pattern: e.currentTarget.value })}
          >
            {ARPEGGIO_PATTERNS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Rate
          <select
            value={settings.rate}
            onChange={(e) => change({ rate: e.currentTarget.value })}
          >
            {ARPEGGIO_RATES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
        {mode !== 'position' && (
          <>
            <label>
              From
              <select
                value={settings.octave ?? ''}
                onChange={(e) => {
                  const v = e.currentTarget.value
                  change({ octave: v ? Number(v) : undefined })
                }}
              >
                <option value="">
                  {formatNote({
                    ...source.chord.root,
                    octave: startOctave(
                      source.chord.root,
                      { ...settings, octave: undefined },
                      onGuitar ? guitar : undefined,
                    ),
                  })}{' '}
                  (default)
                </option>
                {START_OCTAVES.map((o) => (
                  <option key={o} value={o}>
                    {formatNote({ ...source.chord.root, octave: o })}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Range
              <select
                value={settings.octaves}
                onChange={(e) =>
                  change({ octaves: Number(e.currentTarget.value) })
                }
              >
                {OCTAVE_CHOICES.map((o) => (
                  <option key={o} value={o}>
                    {o} {o === 1 ? 'octave' : 'octaves'}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}
        {onGuitar && (
          <div class="toggle" role="group" aria-label="On the neck">
            <button
              type="button"
              aria-pressed={settings.guitar === 'position'}
              onClick={() => change({ guitar: 'position' })}
            >
              One position
            </button>
            <button
              type="button"
              aria-pressed={settings.guitar === 'run'}
              onClick={() => change({ guitar: 'run' })}
            >
              Across the neck
            </button>
          </div>
        )}
        {mode === 'position' && (
          <span class="muted">
            Every tone in four frets, low string to high.
          </span>
        )}
        {onGuitar &&
          settings.guitar === 'position' &&
          plan.positions.length > 1 && (
            <span class="positions">
              <button
                type="button"
                aria-label="Lower position"
                disabled={positionAt === 0}
                onClick={() => setPositionAt(positionAt - 1)}
              >
                ‹
              </button>
              Position {positionAt + 1} of {plan.positions.length}
              <button
                type="button"
                aria-label="Higher position"
                disabled={positionAt + 1 >= plan.positions.length}
                onClick={() => setPositionAt(positionAt + 1)}
              >
                ›
              </button>
            </span>
          )}
      </div>
      <div class="arpeggio-play">
        {through || together ? (
          <button
            type="button"
            class="play"
            onClick={() => (together ? onStop() : setThrough(undefined))}
          >
            ■ Stop
          </button>
        ) : (
          <>
            <button
              type="button"
              class="play"
              onClick={() => setThrough([index])}
            >
              ▶ Play
            </button>
            {sources.length > 1 && (
              <button
                type="button"
                onClick={() => setThrough(sources.map((_, i) => i))}
              >
                ▶ Play through every chord
              </button>
            )}
            {sources.some((s) => s.step !== undefined) && (
              <button type="button" onClick={playWithChords}>
                ▶ Play with chords
              </button>
            )}
            {sources.some((s) => s.step !== undefined) && (
              <button
                type="button"
                class="add-row"
                title="Add these arpeggios as a row under the progression"
                onClick={() =>
                  onAddRow(
                    {
                      kind: 'arpeggio',
                      settings,
                      from:
                        mode === 'position'
                          ? plan.positions[positionAt]?.from
                          : undefined,
                    },
                    // Bars with their own pattern, rests or holds go in as
                    // their own.
                    Object.fromEntries(
                      sources.flatMap((s, i) =>
                        (barPatterns[i] || barGaps[i]) && s.step !== undefined
                          ? [
                              [
                                s.step,
                                recipeAt(
                                  i,
                                  mode === 'position' ? here : undefined,
                                ),
                              ],
                            ]
                          : [],
                      ),
                    ),
                  )
                }
              >
                + Add as a row
              </button>
            )}
          </>
        )}
        <span class="muted">
          {eventsAt(index).length} notes over {source.lengthText}. Tap a note to
          hold the one before over it, again for a rest.
        </span>
      </div>
      <p class="arpeggio-heading">
        <strong class="arpeggio-name">{plan.name}</strong>{' '}
        <span class="muted">
          over {chordSymbol(source.chord)}, {voice.notes.length} notes from{' '}
          {voice.notes[0] ? formatNote(voice.notes[0].note) : '–'} to{' '}
          {voice.notes.at(-1) ? formatNote(voice.notes.at(-1)!.note) : '–'}
        </span>
      </p>
      <ol class="line-chords arpeggio-chords" aria-label="Chords">
        {sources.map((s, i) => {
          const v = voiceAt(i)
          const shown = playing ? playing.at === i : i === index
          return (
            <li
              key={i}
              class={i === index || shown ? 'line-chord focus' : 'line-chord'}
            >
              <div class="bar-head">
                <button
                  type="button"
                  class="line-chord-name"
                  aria-pressed={i === index}
                  title="Play this bar's arpeggio"
                  onClick={() => {
                    // Tapping a bar plays it, as other boxes do (David's
                    // request); while playing with the chords it just
                    // shows it.
                    setAt(i)
                    if (!together) setThrough([i])
                  }}
                >
                  {chordSymbol(s.chord)}
                  <span class="muted">
                    {s.bar !== undefined
                      ? ` · bar ${s.bar}`
                      : ' · not in the progression'}
                  </span>
                </button>
                {s.step !== undefined && (
                  <AddBarButton
                    rows={rowsOf}
                    text="+"
                    label={`the arpeggio over ${chordSymbol(s.chord)} in bar ${s.bar}`}
                    onAdd={(into) =>
                      onAddBar(
                        s.step as number,
                        recipeAt(i, mode === 'position' ? here : undefined),
                        into,
                      )
                    }
                  />
                )}
              </div>
              <span class="arpeggio-of muted">{plans[i].name}</span>
              <select
                class="bar-pattern"
                aria-label={`Pattern for ${chordSymbol(s.chord)}${s.bar !== undefined ? ` in bar ${s.bar}` : ''}`}
                value={barPatterns[i] ?? ''}
                onChange={(e) => {
                  const id = e.currentTarget.value
                  const next = { ...barPatterns }
                  if (id) next[i] = id
                  else delete next[i]
                  setBarPatterns(next)
                }}
              >
                <option value="">Pattern as above</option>
                {ARPEGGIO_PATTERNS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
              <span class="line-notes">
                {v.events.map((e, k) => {
                  const n = v.notes[e.index]
                  const gap = barGaps[i]?.[k]
                  return (
                    <button
                      type="button"
                      key={k}
                      class={[
                        'line-note',
                        `role-${roleOf(n.number)}`,
                        gap ? `gap-${gap}` : '',
                        playing?.at === i && playing.event === k
                          ? 'sounding'
                          : '',
                      ].join(' ')}
                      title={
                        gap === 'hold'
                          ? 'Held: the note before rings on. Tap for a rest.'
                          : gap === 'rest'
                            ? 'A rest. Tap to play the note again.'
                            : 'Tap to hold the note before over this one (no new note), again for a rest.'
                      }
                      aria-label={`${formatNote(n.note)}${gap === 'hold' ? ', held over' : gap === 'rest' ? ', a rest' : ''}`}
                      onClick={() => cycleGap(i, k)}
                    >
                      <span class="label">
                        {gap === 'hold' ? '–' : gap === 'rest' ? '𝄽' : n.label}
                      </span>
                      <span class="name">
                        {gap === 'hold'
                          ? 'held'
                          : gap === 'rest'
                            ? 'rest'
                            : formatNote(n.note)}
                      </span>
                    </button>
                  )
                })}
              </span>
            </li>
          )
        })}
      </ol>
      {plan.left.length > 0 && (
        <p class="muted">
          Left out:{' '}
          {plan.left
            .map((t) => `${formatNote(t.note)} (${t.label}), ${t.reason}`)
            .join('; ')}
          .
        </p>
      )}
      {unplayable && (
        <p class="muted">
          {settings.guitar === 'position'
            ? "This range doesn't fit in one position: try fewer octaves, another starting note, or Across the neck."
            : 'This range runs off the neck: try fewer octaves or another starting note.'}
        </p>
      )}
    </section>
  )
}
