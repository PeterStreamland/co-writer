// The theory behind a chord for the ⓘ panel's "More" (PLAN Phase 4 task 6,
// SPEC 6.2–6.3): its reading in the key, its notes, how its root moves from
// the chord before, the notes the two share, and how the other notes move,
// each from the nearest free note of the chord before (voice leading in its
// simplest form).
import { chordSymbol } from './chord'
import { chordNotes, type ChordName } from './chord-symbol'
import { intervalBetween, type Interval } from './interval'
import { formatNote, mod, pitchClass, type Note } from './note'
import { describeNumeral, romanNumeral } from './numeral'
import type { Key } from './scale'

export type ChordInsight = {
  // "♭VI, borrowed from C Aeolian".
  reading: string
  // "A♭ C E♭".
  notes: string
  // The lines that compare it with the chord before, when there is one.
  motion?: string
  common?: string
  moves?: string
}

const QUALITY_WORDS: Record<string, string> = {
  P: 'perfect',
  M: 'major',
  m: 'minor',
  A: 'augmented',
  d: 'diminished',
}

const NUMBER_WORDS = ['unison', '2nd', '3rd', '4th', '5th', '6th', '7th']

export function intervalWords(interval: Interval): string {
  const quality =
    QUALITY_WORDS[interval.quality] ??
    (interval.quality[0] === 'A' ? 'doubly augmented' : 'doubly diminished')
  const words = `${quality} ${NUMBER_WORDS[(interval.number - 1) % 7]}`
  return /^[aeiou]/.test(words) ? `an ${words}` : `a ${words}`
}

function names(notes: Note[]): string {
  const list = notes.map((n) => formatNote(n))
  return list.length > 1
    ? `${list.slice(0, -1).join(', ')} and ${list.at(-1)}`
    : (list[0] ?? '')
}

// The root's move the short way round: up to a 4th it rises, otherwise it
// falls (C to G falls a 4th rather than rising a 5th).
function rootMotion(from: ChordName, to: ChordName): string {
  const pair = `${formatNote(from.root)} to ${formatNote(to.root)}`
  const up = intervalBetween(from.root, to.root)
  if (up.number === 1 && up.quality === 'P') {
    return `Same root as ${chordSymbol(from)}.`
  }
  if (up.number <= 4) return `The root rises ${intervalWords(up)}, ${pair}.`
  const down = intervalBetween(to.root, from.root)
  return `The root falls ${intervalWords(down)}, ${pair}.`
}

// A note's move named by its spelled interval (SPEC 4): a minor or major
// 2nd (or E to E♭) is a semitone or a tone, anything else takes its
// interval's name, so C down to A♯ is a diminished 3rd, not a tone.
function stepWords(from: Note, to: Note, semitones: number): string {
  const up = semitones > 0
  const interval = up ? intervalBetween(from, to) : intervalBetween(to, from)
  const size = Math.abs(semitones)
  const amount =
    interval.number === 2 && size === 1
      ? 'a semitone'
      : interval.number === 2 && size === 2
        ? 'a tone'
        : interval.number === 1 && size === 1
          ? 'a semitone'
          : intervalWords(interval)
  return `${up ? 'up' : 'down'} ${amount}`
}

// The theory lines for a chord in a key, compared with the chord before.
export function chordInsight(
  key: Key,
  chord: ChordName,
  previous?: ChordName,
): ChordInsight {
  const notes = chordNotes(chord)
  const insight: ChordInsight = {
    reading: describeNumeral(key, romanNumeral(key, chord)),
    notes: notes.map((n) => formatNote(n)).join(' '),
  }
  if (!previous) return insight
  const before = chordNotes(previous)
  const shared = notes.filter((n) =>
    before.some((b) => pitchClass(b) === pitchClass(n)),
  )
  insight.motion = rootMotion(previous, chord)
  insight.common = shared.length
    ? `Keeps ${names(shared)} from ${chordSymbol(previous)}.`
    : `Shares no notes with ${chordSymbol(previous)}.`
  // Each new note from the nearest note of the chord before, each of those
  // moving only once; shared notes stay where they are.
  const sources = before.filter(
    (b) => !shared.some((n) => pitchClass(n) === pitchClass(b)),
  )
  const used = new Set<Note>()
  const moves: string[] = []
  for (const n of notes.filter((x) => !shared.includes(x))) {
    const free = sources.filter((b) => !used.has(b))
    let best: { from: Note; step: number } | undefined
    for (const b of free.length ? free : sources) {
      const step = mod(pitchClass(n) - pitchClass(b) + 6, 12) - 6
      if (!best || Math.abs(step) < Math.abs(best.step)) {
        best = { from: b, step }
      }
    }
    if (!best || best.step === 0) continue
    used.add(best.from)
    moves.push(
      `${formatNote(best.from)} ${stepWords(best.from, n, best.step)} to ${formatNote(n)}`,
    )
  }
  if (moves.length) insight.moves = `Moves: ${moves.join(', ')}.`
  return insight
}
