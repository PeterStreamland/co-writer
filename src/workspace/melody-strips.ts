// The melody lane as time strips (PLAN Phase 7 task 6, David's choice):
// each bar laid out from its start as notes, rests between them and empty
// time after the melody ends, every segment as long as it lasts, so a bar
// shows how full it is. Notes that cross a barline are split and tied; a
// held note keeps where its holds began. The count is in the meter's beats.
import {
  ZERO,
  addDur,
  barLength,
  compareDur,
  countUnit,
  durEquals,
  meterOfBar,
  melodyEnd,
  ratioOf,
  subDur,
  type Dur,
  type MelodyNote,
  type Meter,
  type MeterMap,
} from '../theory'

export type StripSegment =
  | {
      kind: 'note'
      index: number // the note in the melody
      from: Dur // from the bar's start
      to: Dur
      tiedIn?: true
      tiedOut?: true
      held?: Dur[] // where holds begin, from the bar's start
    }
  | { kind: 'rest'; from: Dur; to: Dur }
  | { kind: 'empty'; from: Dur; to: Dur }

export type Strip = {
  bar: number
  start: Dur
  length: Dur
  meter: Meter
  segments: StripSegment[]
  filled: Dur // notes and rests
  count: string // "full", "2½ of 4 beats"
}

const min = (a: Dur, b: Dur) => (compareDur(a, b) <= 0 ? a : b)
const max = (a: Dur, b: Dur) => (compareDur(a, b) >= 0 ? a : b)
const after = (a: Dur, b: Dur) => compareDur(a, b) > 0

// A count of beats as a musician says it: 2½, 1¼, ⅓, 3.
export function beatsWords(beats: number): string {
  const whole = Math.floor(beats + 1e-9)
  const part = beats - whole
  const fractions: [number, string][] = [
    [1 / 4, '¼'],
    [1 / 3, '⅓'],
    [1 / 2, '½'],
    [2 / 3, '⅔'],
    [3 / 4, '¾'],
  ]
  if (part < 1e-9) return String(whole)
  const f = fractions.find(([v]) => Math.abs(v - part) < 1e-9)
  if (f) return `${whole || ''}${f[1]}`
  return String(Math.round(beats * 100) / 100)
}

// The strips for every bar the melody touches, and at least `bars` of
// them (the bars the chords cover).
export function melodyStrips(
  melody: MelodyNote[],
  time: MeterMap,
  bars = 0,
): Strip[] {
  const end = melodyEnd(melody)
  const strips: Strip[] = []
  let start = ZERO
  for (let bar = 1; bar <= bars || compareDur(start, end) < 0; bar++) {
    const meter = meterOfBar(time, bar)
    const length = barLength(meter)
    const barEnd = addDur(start, length)
    const segments: StripSegment[] = []
    let at = start
    const gap = (to: Dur) => {
      if (!after(to, at)) return
      const kind = compareDur(at, end) >= 0 ? 'empty' : 'rest'
      // A gap running past the melody's end is a rest, then empty.
      if (kind === 'rest' && after(to, end)) {
        segments.push({ kind, from: subDur(at, start), to: subDur(end, start) })
        segments.push({
          kind: 'empty',
          from: subDur(end, start),
          to: subDur(to, start),
        })
      } else {
        segments.push({ kind, from: subDur(at, start), to: subDur(to, start) })
      }
      at = to
    }
    melody.forEach((m, index) => {
      const noteEnd = addDur(m.onset, m.length)
      if (!after(noteEnd, start) || !after(barEnd, m.onset)) return
      const from = max(m.onset, start)
      const to = min(noteEnd, barEnd)
      gap(from)
      const segment: StripSegment = {
        kind: 'note',
        index,
        from: subDur(from, start),
        to: subDur(to, start),
      }
      if (after(start, m.onset)) segment.tiedIn = true
      if (after(noteEnd, barEnd)) segment.tiedOut = true
      const held = (m.holds ?? [])
        .map((h) => addDur(m.onset, h))
        .filter((h) => !after(start, h) && after(barEnd, h))
        .map((h) => subDur(h, start))
      if (held.length) segment.held = held
      segments.push(segment)
      at = max(at, to)
    })
    gap(barEnd)
    const filled = segments
      .filter((s) => s.kind !== 'empty')
      .reduce((sum, s) => addDur(sum, subDur(s.to, s.from)), ZERO)
    const unit = countUnit(meter)
    const total = ratioOf(length, unit.length)
    const count = durEquals(filled, length)
      ? 'full'
      : `${beatsWords(ratioOf(filled, unit.length))} of ${beatsWords(total)} ${unit.name}s`
    strips.push({ bar, start, length, meter, segments, filled, count })
    start = barEnd
  }
  return strips
}
