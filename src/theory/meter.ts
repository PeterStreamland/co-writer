// Meters, beats and bars (SPEC 7.1). A meter's grouping bunches its pulses
// (the lower number's note) into groups that each start on a strong beat.
// In crotchet and minim meters every pulse is a beat (4/4 counts four, the
// third strong); in quaver meters each group is one beat, so 6/8 counts two
// dotted crotchets and 7/8 (2+2+3) counts three uneven beats, all strong.
// The downbeat of each bar is strongest of all.
import {
  ZERO,
  addDur,
  compareDur,
  dur,
  durEquals,
  ratioOf,
  subDur,
  timesDur,
  type Dur,
} from './duration'
import { METERS } from './meter-data'

export { METERS } from './meter-data'

export type Meter = { num: number; den: number; grouping?: number[] }

// A section's meter, and the bars that override it, by bar number from 1
// (SPEC 12's Section.meter and barMeters).
export type MeterMap = { meter: Meter; barMeters?: Record<number, Meter> }

export type BeatStrength = 'downbeat' | 'strong' | 'weak'
export type Accent = BeatStrength | 'off'

// One counted beat of a bar: where it starts, how long it lasts.
export type Beat = { onset: Dur; length: Dur; strength: BeatStrength }

export const COMMON_TIME: Meter = { num: 4, den: 4 }

const PULSE_NAMES: Record<number, string> = {
  2: 'half',
  4: 'quarter',
  8: 'eighth',
  16: 'sixteenth',
}

// "6/8" or "7/8" as a meter; the lower number must be a note value.
export function parseMeter(text: string): Meter | undefined {
  const match = /^\s*(\d+)\s*\/\s*(\d+)\s*$/.exec(text)
  if (!match) return undefined
  const num = Number(match[1])
  const den = Number(match[2])
  if (num < 1 || num > 32 || ![1, 2, 4, 8, 16, 32].includes(den)) {
    return undefined
  }
  return { num, den }
}

export function sameMeter(a: Meter, b: Meter): boolean {
  return (
    a.num === b.num &&
    a.den === b.den &&
    groupingOf(a).join() === groupingOf(b).join()
  )
}

// The groupings the picker offers for a meter, the default first.
export function groupingChoices(m: Meter): number[][] {
  return (
    METERS.find((d) => d.num === m.num && d.den === m.den)?.groupings ?? [
      fallbackGrouping(m),
    ]
  )
}

function fallbackGrouping({ num, den }: Meter): number[] {
  if (den >= 8 && num % 3 === 0) return Array(num / 3).fill(3)
  return [num]
}

// The meter's grouping: its own when it fills the bar, else the default.
export function groupingOf(m: Meter): number[] {
  const g = m.grouping
  const fits =
    g &&
    g.length > 0 &&
    g.every((p) => Number.isInteger(p) && p > 0) &&
    g.reduce((a, b) => a + b, 0) === m.num
  return fits ? g : groupingChoices(m)[0]
}

function pulse(m: Meter): Dur {
  return dur(1, m.den)
}

function evenGroups(m: Meter): boolean {
  return new Set(groupingOf(m)).size === 1
}

export function barLength(m: Meter): Dur {
  return dur(m.num, m.den)
}

// The bar's counted beats, in order.
export function beatsOf(m: Meter): Beat[] {
  const p = pulse(m)
  const beats: Beat[] = []
  let at = 0
  for (const size of groupingOf(m)) {
    if (m.den >= 8) {
      beats.push({
        onset: timesDur(p, at),
        length: timesDur(p, size),
        strength: at === 0 ? 'downbeat' : 'strong',
      })
    } else {
      for (let i = 0; i < size; i++) {
        beats.push({
          onset: timesDur(p, at + i),
          length: p,
          strength: at + i === 0 ? 'downbeat' : i === 0 ? 'strong' : 'weak',
        })
      }
    }
    at += size
  }
  return beats
}

// What chord lengths are counted in: the beat, or the quaver in a meter of
// uneven quaver beats (7/8).
export function countUnit(m: Meter): { length: Dur; name: string } {
  if (m.den >= 8 && !evenGroups(m)) {
    return { length: pulse(m), name: PULSE_NAMES[m.den] ?? 'pulse' }
  }
  return { length: beatsOf(m)[0].length, name: 'beat' }
}

// The note the tempo counts: the beat, or the crotchet where the beats are
// uneven (7/8 at ♩ = 120).
export function tempoUnit(m: Meter): Dur {
  if (m.den >= 8 && !evenGroups(m)) return dur(1, 4)
  return beatsOf(m)[0].length
}

// "4/4", or "7/8 (2+2+3)" where the grouping is uneven.
export function meterLabel(m: Meter): string {
  const name = `${m.num}/${m.den}`
  return evenGroups(m) ? name : `${name} (${groupingOf(m).join('+')})`
}

// The accent at a position within a bar (later bars wrap round).
export function accentAt(m: Meter, at: Dur): Accent {
  const bar = barLength(m)
  const whole = Math.floor(ratioOf(at, bar))
  const within = subDur(at, timesDur(bar, whole))
  return beatsOf(m).find((b) => durEquals(b.onset, within))?.strength ?? 'off'
}

// The lengths a chord can be given: each count up to a bar, then bars.
export function lengthChoices(m: Meter): Dur[] {
  const unit = countUnit(m).length
  const bar = barLength(m)
  const perBar = ratioOf(bar, unit)
  const choices: Dur[] = []
  for (let k = 1; k < perBar; k++) choices.push(timesDur(unit, k))
  choices.push(bar)
  if (Number.isInteger(perBar * 1.5)) choices.push(dur(bar.n * 3, bar.d * 2))
  for (const bars of [2, 3, 4]) choices.push(timesDur(bar, bars))
  return choices
}

const plural = (count: number, name: string) =>
  `${count} ${name}${count === 1 ? '' : 's'}`

// How a length reads in a meter: "3 beats", "1½ bars", "5 eighths".
export function lengthLabel(m: Meter, length: Dur): string {
  const bars = ratioOf(length, barLength(m))
  if (Number.isInteger(bars) && bars >= 1) return plural(bars, 'bar')
  if (bars > 1 && Number.isInteger(bars * 2)) {
    return `${Math.floor(bars)}½ bars`
  }
  const unit = countUnit(m)
  const counts = ratioOf(length, unit.length)
  if (Number.isInteger(counts)) return plural(counts, unit.name)
  for (const den of [8, 16]) {
    const pulses = ratioOf(length, dur(1, den))
    if (Number.isInteger(pulses)) return plural(pulses, PULSE_NAMES[den])
  }
  return `${length.n}/${length.d}`
}

export function meterOfBar(map: MeterMap, bar: number): Meter {
  return map.barMeters?.[bar] ?? map.meter
}

// A beat a chord covers: its bar, its number in the bar from 1, and where
// it falls from the start.
export type PlacedBeat = {
  bar: number
  beat: number
  strength: BeatStrength
  at: Dur
}

// Where a chord falls: its start from the top and within its bar, the bar
// (from 1), its beat there (undefined off the beat), and the beats it
// covers.
export type Placement = {
  start: Dur
  length: Dur
  bar: number
  offset: Dur
  beat?: number
  accent: Accent
  beats: PlacedBeat[]
}

// Lays chords end to end through the bars. A chord with no length lasts
// one bar of the bar it starts in (SPEC 7.1).
export function layOut(
  lengths: (Dur | undefined)[],
  map: MeterMap,
): Placement[] {
  // Bar starts, found as they are needed.
  const starts: Dur[] = [ZERO]
  const barStart = (bar: number): Dur => {
    while (starts.length < bar) {
      const last = starts.length
      starts.push(addDur(starts[last - 1], barLength(meterOfBar(map, last))))
    }
    return starts[bar - 1]
  }
  const barOf = (at: Dur, from: number): number => {
    let bar = from
    while (compareDur(barStart(bar + 1), at) <= 0) bar++
    return bar
  }
  const placed: Placement[] = []
  let start = ZERO
  let bar = 1
  for (const given of lengths) {
    bar = barOf(start, bar)
    const meter = meterOfBar(map, bar)
    const offset = subDur(start, barStart(bar))
    const length = given ?? barLength(meter)
    const end = addDur(start, length)
    const index = beatsOf(meter).findIndex((b) => durEquals(b.onset, offset))
    const beats: PlacedBeat[] = []
    for (let b = bar; compareDur(barStart(b), end) < 0; b++) {
      beatsOf(meterOfBar(map, b)).forEach((beat, i) => {
        const at = addDur(barStart(b), beat.onset)
        if (compareDur(at, start) >= 0 && compareDur(at, end) < 0) {
          beats.push({ bar: b, beat: i + 1, strength: beat.strength, at })
        }
      })
    }
    placed.push({
      start,
      length,
      bar,
      offset,
      beat: index >= 0 ? index + 1 : undefined,
      accent: index >= 0 ? beatsOf(meter)[index].strength : 'off',
      beats,
    })
    start = end
  }
  return placed
}
