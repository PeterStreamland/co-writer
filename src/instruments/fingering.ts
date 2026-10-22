// Fingering search (Phase 3 task 2): every way to play a chord on a guitar.
// Each string plays one fret that sounds a chord tone, or is muted. A shape
// keeps every required tone (the 5th is optional), has the chord's bass on
// its lowest sounding string, and fits under the hand: its fretted notes span
// no more than the maximum, and it needs no more than four fingers, a barre
// at its lowest fret counting as one. Ranking by playability is task 3.
import {
  chordIntervals,
  chordNotes,
  mod,
  noteAtMidi,
  pitchClass,
  transpose,
  type ChordName,
  type Interval,
  type Note,
} from '../theory'
import { fretMidi, playableFrets, type Guitar } from './guitar'

// One shape, lowest string first: the fret each string plays (null when
// muted) and the note it sounds, spelled as the chord spells it. An open
// string, or the capo's fret with a capo on, needs no finger.
export type Fingering = {
  frets: (number | null)[]
  notes: (Note | null)[]
}

export type FingeringOptions = { maxSpan?: number }

// SPEC 5 and 11: a span of 4 frets by default, adjustable from 3 to 6. A span
// counts the frets the fretted notes cover: frets 1–4 span 4.
export const DEFAULT_SPAN = 4
export const MIN_SPAN = 3
export const MAX_SPAN = 6
const FINGERS = 4

// Tones a shape may leave out, by interval: the perfect 5th of any chord with
// a 3rd or 4th to carry it (not a power chord's, which is all it has, and
// not when a ♯11 or ♭13 would then read as a ♭5 or ♯5), and, as the namer
// allows, an 11th or 13th chord's natural 9th and a 13th chord's 11th.
function optional(intervals: Interval[]): (i: Interval) => boolean {
  const has = (text: string) =>
    intervals.some((i) => `${i.quality}${i.number}` === text)
  return (i) => {
    const text = `${i.quality}${i.number}`
    if (text === 'P5') {
      return intervals.length >= 3 && !has('A11') && !has('m13')
    }
    if (text === 'M9') return has('P11') || has('M13')
    if (text === 'P11') return has('M13')
    return false
  }
}

function tonesOf(chord: ChordName) {
  const intervals = chordIntervals(chord.quality)
  if (!intervals) throw new Error(`unknown chord quality ${chord.quality}`)
  const isOptional = optional(intervals)
  const bass = pitchClass(chord.bass ?? chord.root)
  let required = 1 << bass
  for (const interval of intervals) {
    if (!isOptional(interval)) {
      required |= 1 << pitchClass(transpose(chord.root, interval))
    }
  }
  // Each pitch class the chord sounds, with the chord's own spelling.
  const spelling = new Map<number, Note>()
  for (const note of chordNotes(chord)) spelling.set(pitchClass(note), note)
  return { bass, required, spelling }
}

// Whether a shape can be held: four fingers, or a barre across the lowest
// fret plus up to three more. A barre frets every string it crosses, so no
// open string can sit between its ends.
function holdable(frets: (number | null)[], open: number): boolean {
  const fretted = frets.flatMap((f, s) =>
    f !== null && f > open ? [{ s, f }] : [],
  )
  if (fretted.length <= FINGERS) return true
  const lowest = Math.min(...fretted.map((n) => n.f))
  const barred = fretted.filter((n) => n.f === lowest).map((n) => n.s)
  const above = fretted.length - barred.length
  if (above + 1 > FINGERS) return false
  const from = barred[0]
  const to = barred[barred.length - 1]
  for (let s = from + 1; s < to; s++) if (frets[s] === open) return false
  return true
}

function bits(mask: number): number {
  let count = 0
  for (let m = mask; m; m &= m - 1) count++
  return count
}

// Neck position (the lowest fretted fret, or the open position), then more
// strings sounding, then frets string by string.
type Found = { fingering: Fingering; position: number; sounding: number }

function compare(a: Found, b: Found): number {
  const byPosition = a.position - b.position
  if (byPosition) return byPosition
  const bySounding = b.sounding - a.sounding
  if (bySounding) return bySounding
  const x = a.fingering.frets
  const y = b.fingering.frets
  for (let s = 0; s < x.length; s++) {
    const diff = (x[s] ?? -1) - (y[s] ?? -1)
    if (diff) return diff
  }
  return 0
}

// Every shape for a chord as it sounds (with a capo, name the chord by what
// sounds: A, not the G shape). Ordered for now by neck position, lowest
// first, then by more strings sounding; task 3's playability score replaces
// this order.
export function findFingerings(
  guitar: Guitar,
  chord: ChordName,
  options: FingeringOptions = {},
): Fingering[] {
  const maxSpan = options.maxSpan ?? DEFAULT_SPAN
  if (!Number.isInteger(maxSpan) || maxSpan < MIN_SPAN || maxSpan > MAX_SPAN) {
    throw new RangeError(`span must be ${MIN_SPAN}–${MAX_SPAN} frets`)
  }
  const { bass, required, spelling } = tonesOf(chord)
  const open = guitar.capo
  const strings = guitar.strings.length

  // Each string's frets that sound a chord tone.
  const choices = guitar.strings.map((_, s) =>
    playableFrets(guitar, s).flatMap((fret) => {
      const midi = fretMidi(guitar, s, fret) as number
      const pc = mod(midi, 12)
      return spelling.has(pc) ? [{ fret, midi, pc }] : []
    }),
  )

  const found: Found[] = []
  const frets: (number | null)[] = []
  const midis: (number | null)[] = []

  const walk = (
    s: number,
    sounded: number,
    low: number,
    high: number,
  ): void => {
    // Too few strings left to sound the tones still missing.
    if (bits(required & ~sounded) > strings - s) return
    if (s === strings) {
      if ((sounded & required) === required && holdable(frets, open)) {
        found.push({
          fingering: {
            frets: [...frets],
            notes: midis.map((m) =>
              m === null
                ? null
                : (noteAtMidi(spelling.get(mod(m, 12)) as Note, m) as Note),
            ),
          },
          position: low === Infinity ? open : low,
          sounding: frets.filter((f) => f !== null).length,
        })
      }
      return
    }
    frets.push(null)
    midis.push(null)
    walk(s + 1, sounded, low, high)
    frets.pop()
    midis.pop()
    for (const choice of choices[s]) {
      // The lowest sounding string plays the bass.
      if (sounded === 0 && choice.pc !== bass) continue
      let nextLow = low
      let nextHigh = high
      if (choice.fret > open) {
        nextLow = Math.min(low, choice.fret)
        nextHigh = Math.max(high, choice.fret)
        if (nextHigh - nextLow + 1 > maxSpan) continue
      }
      frets.push(choice.fret)
      midis.push(choice.midi)
      walk(s + 1, sounded | (1 << choice.pc), nextLow, nextHigh)
      frets.pop()
      midis.pop()
    }
  }
  walk(0, 0, Infinity, -Infinity)

  return found.sort(compare).map((f) => f.fingering)
}

// A shape as guitarists write it, lowest string first: x32010 for open C.
// Frets past 9 are separated by dashes: x-10-12-12-12-10.
export function formatFrets(frets: (number | null)[]): string {
  const text = frets.map((f) => (f === null ? 'x' : String(f)))
  return frets.some((f) => f !== null && f > 9) ? text.join('-') : text.join('')
}
