// How often a line moves against the melody (David's request,
// 2026-10-24): with each melody note, or on a steady grid of bars and parts
// of a bar, whatever the melody's rhythm. A span is one step of that grid
// while the melody sounds; a rest in the melody is a rest for the line too,
// and the melody's last note always starts a span of its own, so a line
// can end with it.
import { ZERO, addDur, compareDur, dur, subDur, type Dur } from './duration'
import { barPosition, barStart, type MelodyNote } from './melody'
import {
  accentAt,
  barLength,
  beatsOf,
  meterOfBar,
  type MeterMap,
} from './meter'

export type SpanUnit =
  'note' | 'chord' | 'bar2' | 'bar' | 'half' | 'beat' | 'quarter' | 'eighth'

// Where the chords change, for a step to each chord.
export type ChordTime = { start: Dur; length: Dur }

export const SPAN_UNITS: {
  id: SpanUnit
  label: string // in a menu
  short: string // in a line's name: "every ½ bar"
  share?: [number, number] // of a bar
}[] = [
  { id: 'note', label: 'Each melody note', short: 'with each note' },
  {
    id: 'chord',
    label: 'Every chord (held until it changes)',
    short: 'held through each chord',
  },
  { id: 'bar2', label: 'Every 2 bars', short: 'every 2 bars' },
  { id: 'bar', label: 'Every bar', short: 'every bar', share: [1, 1] },
  { id: 'half', label: 'Every ½ bar', short: 'every ½ bar', share: [1, 2] },
  { id: 'beat', label: 'Every beat', short: 'every beat' },
  { id: 'quarter', label: 'Every ¼ bar', short: 'every ¼ bar', share: [1, 4] },
  { id: 'eighth', label: 'Every ⅛ bar', short: 'every ⅛ bar', share: [1, 8] },
]

export function isSpanUnit(id: string): id is SpanUnit {
  return SPAN_UNITS.some((u) => u.id === id)
}

export function spanUnit(id: SpanUnit) {
  return SPAN_UNITS.find((u) => u.id === id)!
}

// One step: where it starts, how long it lasts, and the melody note
// sounding as it starts, by its place.
export type Span = { onset: Dur; length: Dur; m: number }

const end = (n: { onset: Dur; length: Dur }) => addDur(n.onset, n.length)
const earlier = (a: Dur, b: Dur) => (compareDur(a, b) <= 0 ? a : b)

// The next line of the grid after a time; undefined is none.
function gridAfter(
  time: MeterMap,
  unit: SpanUnit,
  t: Dur,
  chords: ChordTime[],
): Dur | undefined {
  if (unit === 'chord') {
    return chords
      .map((c) => c.start)
      .filter((at) => compareDur(at, t) > 0)
      .sort(compareDur)[0]
  }
  const { bar, offset } = barPosition(time, t)
  const start = subDur(t, offset)
  const meter = meterOfBar(time, bar)
  const length = barLength(meter)
  const barEnd = addDur(start, length)
  if (unit === 'bar2') return barStart(time, bar % 2 === 1 ? bar + 2 : bar + 1)
  if (unit === 'beat') {
    const next = beatsOf(meter).find((b) => compareDur(b.onset, offset) > 0)
    return next ? addDur(start, next.onset) : barEnd
  }
  const [n, d] = spanUnit(unit).share!
  const step = dur(length.n * n, length.d * d)
  // Steps into the bar so far, then one more.
  const k = Math.floor((offset.n * step.d) / (offset.d * step.n)) + 1
  const next = addDur(start, dur(step.n * k, step.d))
  return earlier(next, barEnd)
}

export function melodySpans(
  melody: MelodyNote[],
  time: MeterMap,
  unit: SpanUnit,
  chords: ChordTime[] = [],
): Span[] {
  // With no chords, a step to each chord is a step to each bar.
  if (unit === 'chord' && !chords.length) unit = 'bar'
  if (unit === 'note') {
    return melody.map((m, i) => ({ onset: m.onset, length: m.length, m: i }))
  }
  if (!melody.length) return []
  // Where the melody sounds without a break.
  const runs: { from: Dur; to: Dur }[] = []
  melody.forEach((m) => {
    const last = runs.at(-1)
    if (last && compareDur(last.to, m.onset) === 0) last.to = end(m)
    else runs.push({ from: m.onset, to: end(m) })
  })
  const final = melody.at(-1)!.onset
  const at = (t: Dur) =>
    melody.findIndex(
      (m) => compareDur(m.onset, t) <= 0 && compareDur(t, end(m)) < 0,
    )
  const spans: Span[] = []
  for (const run of runs) {
    let t = run.from
    while (compareDur(t, run.to) < 0) {
      // From the last note on, one step to the end.
      let next =
        compareDur(t, final) >= 0
          ? run.to
          : earlier(gridAfter(time, unit, t, chords) ?? run.to, run.to)
      if (compareDur(t, final) < 0 && compareDur(final, next) < 0) next = final
      spans.push({ onset: t, length: subDur(next, t), m: at(t) })
      t = next
    }
  }
  return spans.filter((s) => compareDur(s.length, ZERO) > 0)
}

// Harmonies can also pick which melody notes to harmonise, each for its
// own length (David's request: not every note needs a harmony).
export type HarmonyFilter = 'strong' | 'onbeat' | 'barfirst' | 'long'

export const HARMONY_FILTERS: {
  id: HarmonyFilter
  label: string
  short: string
}[] = [
  { id: 'strong', label: 'Notes on strong beats', short: 'on strong beats' },
  { id: 'onbeat', label: 'Notes on a beat', short: 'on the beats' },
  {
    id: 'barfirst',
    label: 'The first note of each bar',
    short: 'on each bar’s first note',
  },
  { id: 'long', label: 'Long notes (a beat or more)', short: 'on long notes' },
]

// How a harmony picks its notes: a step (SPAN_UNITS) or a filter.
export type HarmonyStep = SpanUnit | HarmonyFilter

export function isHarmonyStep(id: string): id is HarmonyStep {
  return isSpanUnit(id) || HARMONY_FILTERS.some((f) => f.id === id)
}

export function harmonyStepShort(id: HarmonyStep): string {
  return (
    HARMONY_FILTERS.find((f) => f.id === id)?.short ??
    spanUnit(id as SpanUnit).short
  )
}

// The melody notes a harmony harmonises: on a step, the note sounding as
// each step starts, held for the step; with a filter, the notes it keeps.
export function harmonyHeard(
  melody: MelodyNote[],
  time: MeterMap,
  step: HarmonyStep,
  chords: ChordTime[] = [],
): MelodyNote[] {
  if (isSpanUnit(step)) return spanMelody(melody, time, step, chords)
  let lastBar = 0
  return melody.filter((m) => {
    const { bar, offset } = barPosition(time, m.onset)
    const meter = meterOfBar(time, bar)
    const accent = accentAt(meter, offset)
    if (step === 'strong') return accent === 'downbeat' || accent === 'strong'
    if (step === 'onbeat') return accent !== 'off'
    if (step === 'long') {
      return compareDur(m.length, beatsOf(meter)[0].length) >= 0
    }
    // The first note starting in each bar.
    if (bar === lastBar) return false
    lastBar = bar
    return true
  })
}

// The melody as the grid hears it: on each step, the note sounding as it
// starts, lasting the step. Harmonies on a grid harmonise these.
export function spanMelody(
  melody: MelodyNote[],
  time: MeterMap,
  unit: SpanUnit,
  chords: ChordTime[] = [],
): MelodyNote[] {
  if (unit === 'note') return melody
  return melodySpans(melody, time, unit, chords).map((s) => ({
    note: melody[s.m].note,
    onset: s.onset,
    length: s.length,
  }))
}
