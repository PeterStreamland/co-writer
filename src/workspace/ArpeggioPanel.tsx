import { useEffect, useMemo, useState } from 'preact/hooks'
import {
  ARPEGGIO_PATTERNS,
  ARPEGGIO_RATES,
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
import {
  ARPEGGIO_CHOICES,
  OCTAVE_CHOICES,
  START_OCTAVES,
  loadArpeggio,
  planArpeggio,
  saveArpeggio,
  startOctave,
  type ArpeggioPlan,
  type ArpeggioSettings,
} from './arpeggio-view'

// A chord the tab can arpeggiate: from the progression, in its key and for
// its length there, or the current chord for a bar.
export type ArpeggioSource = {
  chord: ChordName
  key: Key
  length: Dur
  label: string
  lengthText: string // "1 bar", "2 beats"
}

// What the instrument view shows: the arpeggio and the chord it's of.
export type ArpeggioOnShow = ArpeggioShow & { chord: ChordName }

// The Arpeggio tab (PLAN Phase 6 task 2, David's idea): try arpeggios and
// extensions on a chord without adding anything to the progression. Pick a
// chord or step through the progression, choose the arpeggio (triad to
// 13th, or a lens's colours), a pattern, a rate and a range, and hear it at
// the tempo, each note lit and labelled on the instrument. On guitar it
// sits in one position (step through them) or runs across the neck.
export function ArpeggioPanel({
  sources,
  start,
  instrument,
  guitar,
  bpm,
  meter,
  onShow,
}: {
  sources: ArpeggioSource[]
  // The source to begin on (the selected or current chord).
  start: number
  instrument: Instrument
  guitar: Guitar
  bpm: number
  meter: Meter
  onShow: (show: ArpeggioOnShow | undefined) => void
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
  const plans = useMemo(
    () =>
      sources.map((s) =>
        planArpeggio(
          s.chord,
          s.key,
          settings,
          s.length,
          onGuitar ? guitar : undefined,
        ),
      ),
    [sources, settings, onGuitar, guitar],
  )
  const plan = plans[index] as ArpeggioPlan | undefined
  const [positionAt, setPositionAt] = useState(0)
  useEffect(() => setPositionAt(0), [plan])
  const spotsOf = (p: ArpeggioPlan, position = 0) =>
    settings.guitar === 'run'
      ? p.run
      : p.positions[Math.min(position, p.positions.length - 1)]
  // The note sounding while the arpeggio plays: which chord, which note.
  const [playing, setPlaying] = useState<{ at: number; note: number }>()
  const [through, setThrough] = useState<number[]>()
  useEffect(() => setPlaying(undefined), [plans])
  useEffect(() => {
    if (!plan) {
      onShow(undefined)
      return
    }
    const showing = playing && plans[playing.at] ? plans[playing.at] : plan
    const showAt = playing ? playing.at : index
    onShow({
      chord: sources[showAt].chord,
      notes: showing.notes.map((n) => ({
        note: n.note,
        midi: n.midi,
        label: n.label,
      })),
      spots: onGuitar
        ? spotsOf(showing, showAt === index ? positionAt : 0)
        : undefined,
      sounding: playing?.note,
    })
  }, [plan, playing, positionAt, settings.guitar, onGuitar])
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
      const p = plans[i]
      for (const e of p.events) {
        const ms = (offset + secondsOf(e.onset, bpm, meter)) * 1000
        const seconds = secondsOf(e.length, bpm, meter)
        timers.push(
          setTimeout(() => {
            setAt(i)
            setPlaying({ at: i, note: e.index })
            void playNote(p.notes[e.index].note, seconds * 1.5)
          }, ms),
        )
      }
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
  const spots = onGuitar ? spotsOf(plan, positionAt) : undefined
  const unplayable = onGuitar && !spots
  const sounding = playing?.at === index ? playing.note : undefined
  return (
    <section class="arpeggio" aria-label="Arpeggios">
      <div class="arpeggio-chord">
        <button
          type="button"
          aria-label="Previous chord"
          disabled={index === 0}
          onClick={() => setAt(index - 1)}
        >
          ‹
        </button>
        <select
          aria-label="Chord"
          value={index}
          onChange={(e) => setAt(Number(e.currentTarget.value))}
        >
          {sources.map((s, i) => (
            <option key={i} value={i}>
              {s.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          aria-label="Next chord"
          disabled={index + 1 >= sources.length}
          onClick={() => setAt(index + 1)}
        >
          ›
        </button>
        <strong class="arpeggio-name">{plan.name}</strong>
      </div>
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
            onChange={(e) => change({ octaves: Number(e.currentTarget.value) })}
          >
            {OCTAVE_CHOICES.map((o) => (
              <option key={o} value={o}>
                {o} {o === 1 ? 'octave' : 'octaves'}
              </option>
            ))}
          </select>
        </label>
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
        {through ? (
          <button
            type="button"
            class="play"
            onClick={() => setThrough(undefined)}
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
          </>
        )}
        <span class="muted">
          {plan.events.length} notes over {source.lengthText}
        </span>
      </div>
      <ol class="arpeggio-notes" aria-label="Notes, lowest first">
        {plan.notes.map((n, i) => (
          <li key={i} class={i === sounding ? 'sounding' : ''}>
            <span class="label">{n.label}</span>
            <span class="muted">{formatNote(n.note)}</span>
          </li>
        ))}
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
