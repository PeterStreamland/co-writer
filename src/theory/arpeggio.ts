// Arpeggios (PLAN Phase 6 task 2): a chord's tones up to a level (triad to
// 13th), spread over a range, walked in a pattern at a rate to fill a
// length exactly. A chord's own tones always stay. The tones it doesn't
// have come from the key, stacked in 3rds on the root: the 7th, 9th, 11th
// and 13th are the key's notes six, one, three and five letters up (E7 is
// V/vi in C, A♭maj7 its ♭VI). An added note a semitone above a chord tone
// is left out, as the experimental lenses do (the arranger's avoid notes),
// except the ♭9 and ♭13 of a dominant 7th, which are its colours.
import {
  ADDED_TONES,
  ARPEGGIO_LEVELS,
  BORROW_ORDER,
  type ArpeggioLevel,
  type ArpeggioPattern,
} from './arpeggio-data'
import { chordIntervals, chordSymbol, qualityFromIntervals } from './chord'
import type { ChordName } from './chord-symbol'
import {
  ZERO,
  addDur,
  compareDur,
  ratioOf,
  subDur,
  timesDur,
  type Dur,
} from './duration'
import {
  degreeLabel,
  intervalBetween,
  parseInterval,
  transpose,
  type Interval,
} from './interval'
import {
  LETTERS,
  letterIndex,
  midiNumber,
  mod,
  noteAtMidi,
  pitchClass,
  type Note,
} from './note'
import { scaleNotes, type Key } from './scale'

export * from './arpeggio-data'

// A tone of the arpeggio: its note (no octave), its interval number above
// the root (9 for the 9th) and its label (R, ♭3, 5, ♭7, 9).
export type ArpeggioTone = { note: Note; number: number; label: string }

// A tone the key offered but the arpeggio leaves out, and why.
export type LeftOutTone = ArpeggioTone & { reason: string }

export type ArpeggioTones = { tones: ArpeggioTone[]; left: LeftOutTone[] }

const TONE_NAMES: Record<number, string> = {
  1: 'root',
  2: '2nd',
  3: '3rd',
  4: '4th',
  5: '5th',
  6: '6th',
  7: '7th',
}

// A label from the root to a note, numbered as given: ♭9, not ♭2.
export function toneLabel(root: Note, note: Note, number: number): string {
  if (number === 1) return 'R'
  return degreeLabel(root, note).replace(/\d+$/, String(number))
}

function tone(root: Note, note: Note, number: number): ArpeggioTone {
  return { note, number, label: toneLabel(root, note, number) }
}

// The scale a chord's added tones come from: the key's when it holds all
// the chord's own notes (as spelled); for a borrowed chord, the first mode
// on the key's tonic that does (BORROW_ORDER); otherwise the key's.
export function sourceScale(chord: ChordName, key: Key): Note[] {
  const own = ownTones(chord).map((t) => t.note)
  const holds = (scale: Note[]) =>
    own.every((n) =>
      scale.some((s) => s.letter === n.letter && s.accidental === n.accidental),
    )
  const keys = scaleNotes(key.tonic, key.mode)
  if (holds(keys)) return keys
  const third = mod(
    pitchClass(keys[2] ?? key.tonic) - pitchClass(key.tonic),
    12,
  )
  const order = BORROW_ORDER[third === 3 ? 'minor' : 'major']
  for (const mode of order) {
    if (mode === key.mode) continue
    const scale = scaleNotes(key.tonic, mode)
    if (holds(scale)) return scale
  }
  return keys
}

// The scale's note on the letter `letters` above the root, if it has one.
function noteAbove(
  scale: Note[],
  root: Note,
  letters: number,
): Note | undefined {
  const letter = LETTERS[mod(letterIndex(root.letter) + letters, 7)]
  return scale.find((n) => n.letter === letter)
}

// Which simple numbers stand in for an added tone: a 6th for the 7th (C6),
// and the 2nd, 4th and 6th for the 9th, 11th and 13th (sus chords, C6).
const STANDS_IN: Record<number, number[]> = {
  7: [7, 6],
  9: [9, 2],
  11: [11, 4],
  13: [13, 6],
}

// The chord's own tones, labelled, root first (a lens's colour, as is).
export function ownTones(chord: ChordName): ArpeggioTone[] {
  const intervals = chordIntervals(chord.quality)
  if (!intervals) throw new Error(`unknown chord quality ${chord.quality}`)
  return intervals.map((i) =>
    tone(chord.root, transpose(chord.root, i), i.number),
  )
}

// The chord's tones up to a level, with the key's notes added where the
// chord has none of its own.
export function arpeggioTones(
  chord: ChordName,
  key: Key,
  level: ArpeggioLevel,
): ArpeggioTones {
  const numbers = ARPEGGIO_LEVELS.find((l) => l.id === level)?.numbers
  if (!numbers) throw new Error(`unknown arpeggio level ${level}`)
  const top = numbers.at(-1) as number
  const root = chord.root
  const own = ownTones(chord)
  const tones = own.filter((t) => t.number <= top)
  const left: LeftOutTone[] = []
  const scale = sourceScale(chord, key)
  for (const number of [7, 9, 11, 13]) {
    if (!numbers.includes(number)) continue
    if (own.some((t) => STANDS_IN[number].includes(t.number))) continue
    const { letters, fallback } = ADDED_TONES[number]
    const note =
      noteAbove(scale, root, letters) ??
      transpose(root, parseInterval(fallback) as Interval)
    const added = tone(root, note, number)
    if (tones.some((t) => pitchClass(t.note) === pitchClass(note))) continue
    const clash = clashOf(tones, added)
    if (clash) {
      left.push({ ...added, reason: clash })
      continue
    }
    tones.push(added)
  }
  return { tones: tones.sort((a, b) => a.number - b.number), left }
}

// Why an added tone can't join the chord: it sits a semitone above one of
// the chord's tones (R, 3rd, 5th, 7th). A dominant 7th keeps its ♭9 over
// the root and ♭13 over the 5th.
function clashOf(
  tones: ArpeggioTone[],
  added: ArpeggioTone,
): string | undefined {
  const basic = tones.filter((t) => t.number <= 7)
  const root = basic[0].note
  const pcFromRoot = (t: ArpeggioTone) =>
    mod(pitchClass(t.note) - pitchClass(root), 12)
  const dominant =
    basic.some((t) => t.number === 3 && pcFromRoot(t) === 4) &&
    basic.some((t) => t.number === 7 && pcFromRoot(t) === 10)
  const under = basic.find(
    (t) => mod(pitchClass(added.note) - pitchClass(t.note), 12) === 1,
  )
  if (!under) return undefined
  if (dominant && (under.number === 1 || under.number === 5)) return undefined
  return `a semitone above the ${TONE_NAMES[under.number] ?? under.label}`
}

// The arpeggio's name: the chord its tones make (Cmaj9, G13, Fmaj13♯11),
// or undefined when no symbol fits.
export function arpeggioName(
  chord: ChordName,
  { tones }: ArpeggioTones,
): string | undefined {
  const intervals = tones.map((t) => ({
    quality: intervalBetween(chord.root, t.note).quality,
    number: t.number,
  }))
  const quality = qualityFromIntervals(intervals)
  if (quality) return chordSymbol({ root: chord.root, quality })
  // A sus chord the namer doesn't know as such: named as the chord with a
  // 3rd in place of its 4th, then "sus4" (G13sus4).
  const fourth = tones.findIndex((t) => t.number === 4)
  if (fourth < 0 || tones.some((t) => t.number === 3)) return undefined
  const withThird = intervals.map((i, k) =>
    k === fourth ? { quality: 'M', number: 3 } : i,
  )
  const asThird = qualityFromIntervals(
    [...withThird].sort((a, b) => a.number - b.number),
  )
  return asThird && `${chordSymbol({ root: chord.root, quality: asThird })}sus4`
}

// A note of the arpeggio in its range: spelled with its octave, with its
// tone's label and number.
export type ArpeggioNote = ArpeggioTone & { midi: number }

// Every tone of the arpeggio from the root at `low` up through `octaves`
// octaves, ending on the root at the top, lowest first. A 9th, 11th or 13th
// sounds in every octave, still labelled as the extension it is.
export function arpeggioNotes(
  tones: ArpeggioTone[],
  low: Note,
  octaves: number,
): ArpeggioNote[] {
  const base = midiNumber(low)
  if (base === undefined) throw new Error('the lowest note needs an octave')
  const top = base + 12 * octaves
  const notes: ArpeggioNote[] = []
  for (let o = 0; o <= octaves; o++) {
    for (const t of tones) {
      const midi = base + 12 * o + mod(pitchClass(t.note) - pitchClass(low), 12)
      if (midi > top) continue
      notes.push({ ...t, note: noteAtMidi(t.note, midi) as Note, midi })
    }
  }
  return notes.sort((a, b) => a.midi - b.midi)
}

// One cycle of a pattern over `count` notes, as indexes (0 is the lowest).
export function patternCycle(
  count: number,
  pattern: ArpeggioPattern,
): number[] {
  const up = Array.from({ length: count }, (_, i) => i)
  const down = [...up].reverse()
  if (pattern.shape === 'alberti') {
    return count < 3 ? up : [...pattern.group]
  }
  if (pattern.shape === 'pedal') {
    return count < 2 ? up : up.slice(1).flatMap((i) => [0, i])
  }
  if (pattern.shape === 'outside-in') {
    const order: number[] = []
    for (let lo = 0, hi = count - 1; lo <= hi; lo++, hi--) {
      order.push(lo)
      if (hi !== lo) order.push(hi)
    }
    return order
  }
  const path = {
    up,
    down,
    'up-down': [...up, ...down.slice(1, -1)],
    'down-up': [...down, ...up.slice(1, -1)],
  }[pattern.direction]
  const reach = Math.max(...pattern.group)
  if (reach === 0 || path.length <= reach) return path
  const cycle: number[] = []
  for (let p = 0; p + reach < path.length; p++) {
    for (const offset of pattern.group) cycle.push(path[p + offset])
  }
  return cycle
}

// A note of the arpeggio in time: which note (index into the range), when
// it starts and how long it lasts, as fractions of a whole note.
export type ArpeggioEvent = { index: number; onset: Dur; length: Dur }

// The pattern repeated at the rate to fill the length exactly: every note
// starts on the rate's grid, and the last is cut short if the length isn't
// a whole number of them (triplets in a bar of 7/8).
export function arpeggioRhythm(
  count: number,
  pattern: ArpeggioPattern,
  rate: Dur,
  length: Dur,
): ArpeggioEvent[] {
  if (count === 0 || compareDur(length, ZERO) <= 0) return []
  const cycle = patternCycle(count, pattern)
  const whole = Math.floor(ratioOf(length, rate))
  const events: ArpeggioEvent[] = []
  for (let i = 0; i < whole; i++) {
    events.push({
      index: cycle[i % cycle.length],
      onset: timesDur(rate, i),
      length: rate,
    })
  }
  const used = timesDur(rate, whole)
  const rest = subDur(length, used)
  if (compareDur(rest, ZERO) > 0) {
    events.push({
      index: cycle[whole % cycle.length],
      onset: used,
      length: rest,
    })
  }
  return events
}

// The span of the events, for checking they fill the length.
export function eventsLength(events: ArpeggioEvent[]): Dur {
  return events.reduce((sum, e) => addDur(sum, e.length), ZERO)
}

// What a note of a bar's pattern does instead of playing (David's
// request): a rest is silence; a hold strikes no new note, so the note
// before rings on (silence too, after a rest).
export type ArpeggioGap = 'rest' | 'hold'

// The bar's notes with its rests and holds, keyed by each note's place in
// the pattern. Each note left keeps that place as `event`.
export function withGaps(
  events: ArpeggioEvent[],
  gaps: Record<number, ArpeggioGap> = {},
): (ArpeggioEvent & { event: number })[] {
  const out: (ArpeggioEvent & { event: number })[] = []
  let ringing = true // whether the note before is sounding
  events.forEach((e, k) => {
    const gap = gaps[k]
    if (!gap) {
      out.push({ ...e, event: k })
      ringing = true
      return
    }
    const last = out.at(-1)
    if (gap === 'hold' && ringing && last) {
      last.length = subDur(addDur(e.onset, e.length), last.onset)
      return
    }
    ringing = false
  })
  return out
}
