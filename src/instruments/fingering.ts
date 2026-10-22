// Fingering search (Phase 3 task 2): every way to play a chord on a guitar.
// Each string plays one fret that sounds a chord tone, or is muted. A shape
// keeps every required tone (the 5th is optional), has the chord's bass on
// its lowest sounding string, and fits under the hand: its fretted notes span
// no more than the maximum, and it needs no more than four fingers, a barre
// at its lowest fret counting as one. Each shape is scored for how easy it
// is to play (task 3), by the rules in playability-data.ts, easiest first.
// Filters (task 4) pick the inversion, the strings that may sound, the
// span, whether open strings are used, and whether the 5th is left out.
import {
  chordIntervals,
  chordNotes,
  inversionOf,
  inversions,
  mod,
  noteAtMidi,
  pitchClass,
  transpose,
  type ChordName,
  type Interval,
  type Note,
} from '../theory'
import { fretMidi, playableFrets, type Guitar } from './guitar'
import {
  PLAYABILITY_RULES,
  type PlayabilityRule,
  type PlayabilityRuleId,
} from './playability-data'

// One shape, lowest string first: the fret each string plays (null when
// muted) and the note it sounds, spelled as the chord spells it. An open
// string, or the capo's fret with a capo on, needs no finger. score is 100
// less the costs of the playability rules that apply, so higher is easier;
// costs lists each rule that applied, how many times, and its points.
// inversion is 0 for root position, 1 for the first inversion and so on, and
// undefined when the bass is outside the chord (F/G).
export type Fingering = {
  frets: (number | null)[]
  notes: (Note | null)[]
  inversion: number | undefined
  score: number
  costs: PlayabilityCost[]
}

export type PlayabilityCost = {
  rule: PlayabilityRuleId
  count: number
  points: number
}

// The filters (plan, Phase 3 task 4; SPEC 5), all off by default.
// - maxSpan: the widest stretch, in frets (3–6, default 4).
// - inversion: which tone is in the bass, as a number (0 root position, 1
//   first inversion…), or 'any' for every inversion. By default the chord's
//   own bass: its root, or the bass of a slash chord (C/E, F/G). A number
//   or 'any' replaces the chord's own bass.
// - strings: the strings that may sound, lowest string 0; the rest are
//   muted. Every string by default.
// - openStrings: false to keep every string fretted (with a capo, off the
//   capo's fret too).
// - omitFifth: true to leave the perfect 5th out wherever the 5th is
//   optional (not from a power chord); a 5th asked for in the bass stays.
export type FingeringOptions = {
  maxSpan?: number
  inversion?: number | 'any'
  strings?: number[]
  openStrings?: boolean
  omitFifth?: boolean
}

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

// The bass the filters ask for: the chord's own, one inversion's, or every
// inversion's (root, 3rd, 5th and 6th or 7th).
function basses(chord: ChordName, inversion: number | 'any' | undefined) {
  if (inversion === undefined) return [chord.bass ?? chord.root]
  const all = inversions(chord).map((i) => i.chord.bass ?? i.chord.root)
  if (inversion === 'any') return all
  if (!Number.isInteger(inversion) || !all[inversion]) {
    throw new RangeError(
      `${chord.quality} chords have inversions 0–${all.length - 1}`,
    )
  }
  return [all[inversion]]
}

function tonesOf(chord: ChordName, options: FingeringOptions) {
  const intervals = chordIntervals(chord.quality)
  if (!intervals) throw new Error(`unknown chord quality ${chord.quality}`)
  const isOptional = optional(intervals)
  const bassNotes = basses(chord, options.inversion)
  let bass = 0
  for (const note of bassNotes) bass |= 1 << pitchClass(note)
  let required = 0
  let all = 0
  let left = 0
  for (const interval of intervals) {
    const pc = 1 << pitchClass(transpose(chord.root, interval))
    if (
      options.omitFifth &&
      isOptional(interval) &&
      `${interval.quality}${interval.number}` === 'P5'
    ) {
      left |= pc
      continue
    }
    all |= pc
    if (!isOptional(interval)) required |= pc
  }
  // A slash chord's bass outside the chord is a tone too (F/G).
  if (bassNotes.length === 1) required |= bass
  // Each pitch class the shape can sound, with the chord's own spelling: a
  // 5th left out only in the bass.
  const spelling = new Map<number, Note>()
  const named: ChordName = { ...chord, bass: bassNotes[0] }
  if (bassNotes.length > 1) delete named.bass
  for (const note of [...chordNotes(named), ...bassNotes]) {
    const pc = pitchClass(note)
    if (!spelling.has(pc)) spelling.set(pc, note)
  }
  const upper = (pc: number) => spelling.has(pc) && !(left & (1 << pc))
  // With every inversion allowed, a 5th left out can't be the bass either.
  if (bassNotes.length > 1) bass &= ~left
  return { bass, required, all, spelling, upper }
}

// The fingers a shape needs, and whether it needs a barre: one finger per
// fretted string, or, past four, a barre across the lowest fret plus up to
// three more. A barre frets every string it crosses, so no open string can
// sit between its ends. Undefined when the shape can't be held.
function fingersNeeded(
  frets: (number | null)[],
  open: number,
): { fingers: number; barre: boolean } | undefined {
  const fretted = frets.flatMap((f, s) =>
    f !== null && f > open ? [{ s, f }] : [],
  )
  if (fretted.length <= FINGERS) {
    return { fingers: fretted.length, barre: false }
  }
  const lowest = Math.min(...fretted.map((n) => n.f))
  const barred = fretted.filter((n) => n.f === lowest).map((n) => n.s)
  const fingers = fretted.length - barred.length + 1
  if (fingers > FINGERS) return undefined
  const from = barred[0]
  const to = barred[barred.length - 1]
  for (let s = from + 1; s < to; s++) if (frets[s] === open) return undefined
  return { fingers, barre: true }
}

// A hand covers three frets without stretching, one finger per fret.
const REACH = 3
// A chord sounds full on four strings, or one more than its tones (three for
// a power chord).
const FULL = 4

// Open strings help near the nut; with the hand further up than this, an
// open string ringing under it is awkward instead.
const NEAR_NUT = 4

function costOf(rule: PlayabilityRuleId): number {
  return (PLAYABILITY_RULES.find((r) => r.id === rule) as PlayabilityRule).cost
}

// What each rule counts in a shape; the score is 100 less their costs.
function playability(
  frets: (number | null)[],
  open: number,
  hand: { fingers: number; barre: boolean },
  tones: { omitted: number; full: number; power: boolean },
): Pick<Fingering, 'score' | 'costs'> {
  const fretted = frets.filter((f): f is number => f !== null && f > open)
  const sounding = frets.flatMap((f, s) => (f === null ? [] : [s]))
  const first = sounding[0]
  const last = sounding[sounding.length - 1]
  const lowest = fretted.length ? Math.min(...fretted) : open
  const span = fretted.length ? Math.max(...fretted) - lowest + 1 : 0
  let inner = 0
  frets.forEach((f, s) => {
    if (f === null && s > first && s < last) inner++
  })
  const opens = frets.filter((f) => f === open).length
  const near = lowest - open <= NEAR_NUT
  const counts: [PlayabilityRuleId, number][] = [
    ['finger', hand.fingers],
    ['span', Math.max(0, span - REACH)],
    ['barre', hand.barre ? 1 : 0],
    ['muted-inner', inner],
    ['muted-low', first],
    // A power chord is played with its top strings damped on purpose.
    ['muted-high', tones.power ? 0 : frets.length - 1 - last],
    ['open-string', near ? opens : 0],
    ['open-string-far', near ? 0 : opens],
    ['position', lowest - open],
    ['omitted-tone', tones.omitted],
    ['thin', Math.max(0, tones.full - sounding.length)],
  ]
  const costs = counts.flatMap(([rule, count]) =>
    count ? [{ rule, count, points: count * costOf(rule) }] : [],
  )
  return { score: 100 - costs.reduce((sum, c) => sum + c.points, 0), costs }
}

function bits(mask: number): number {
  let count = 0
  for (let m = mask; m; m &= m - 1) count++
  return count
}

// Easiest first; then by neck position (the lowest fretted fret, or the open
// position), more strings sounding, and frets string by string, so the order
// never depends on the search's.
type Found = { fingering: Fingering; position: number; sounding: number }

function compare(a: Found, b: Found): number {
  const byScore = b.fingering.score - a.fingering.score
  if (byScore) return byScore
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
// sounds: A, not the G shape), easiest to play first.
export function findFingerings(
  guitar: Guitar,
  chord: ChordName,
  options: FingeringOptions = {},
): Fingering[] {
  const maxSpan = options.maxSpan ?? DEFAULT_SPAN
  if (!Number.isInteger(maxSpan) || maxSpan < MIN_SPAN || maxSpan > MAX_SPAN) {
    throw new RangeError(`span must be ${MIN_SPAN}–${MAX_SPAN} frets`)
  }
  const { bass, required, all, spelling, upper } = tonesOf(chord, options)
  const open = guitar.capo
  const strings = guitar.strings.length
  const allowed = new Set(options.strings ?? guitar.strings.keys())
  if (
    allowed.size === 0 ||
    [...allowed].some((s) => !Number.isInteger(s) || s < 0 || s >= strings)
  ) {
    throw new RangeError(`strings must be some of 0–${strings - 1}`)
  }
  const openStrings = options.openStrings ?? true

  // Each string's frets that sound a chord tone, if the string may sound.
  const choices = guitar.strings.map((_, s) =>
    !allowed.has(s)
      ? []
      : playableFrets(guitar, s).flatMap((fret) => {
          if (fret === open && !openStrings) return []
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
      const hand =
        (sounded & required) === required && fingersNeeded(frets, open)
      if (hand) {
        const notes = midis.map((m) =>
          m === null
            ? null
            : (noteAtMidi(spelling.get(mod(m, 12)) as Note, m) as Note),
        )
        const lowest = notes.find((n) => n !== null) as Note
        found.push({
          fingering: {
            frets: [...frets],
            notes,
            inversion: inversionOf({ ...chord, bass: lowest }),
            ...playability(frets, open, hand, {
              omitted: bits(all & ~sounded),
              full: Math.min(FULL, bits(all) + 1),
              power: bits(all) === 2,
            }),
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
      // The lowest sounding string plays the bass; a 5th left out sounds
      // nowhere else.
      if (sounded === 0 ? !(bass & (1 << choice.pc)) : !upper(choice.pc)) {
        continue
      }
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
