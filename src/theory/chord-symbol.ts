// Chord symbols (SPEC 4): a parser that reads lead-sheet and jazz symbols
// alike, and a namer that gives every name for a set of notes, the one that
// fits the key and keeps the lowest note as root first.
import { CHORD_QUALITIES } from './chord-data'
import { chordIntervals, chordQualityIds, qualityFromIntervals } from './chord'
import { semitones, transpose } from './interval'
import type { Interval } from './interval'
import {
  LETTERS,
  midiNumber,
  mod,
  naturalSemitones,
  parseNote,
  pitchClass,
  sameSpelling,
  type Note,
} from './note'
import { romanNumeral } from './numeral'
import type { Key } from './scale'

// A chord as a symbol names it: C, Am7/G, F/G. quality is a chord-quality id
// (SPEC 12); bass is set only when it isn't the root.
export type ChordName = { root: Note; quality: string; bass?: Note }

// A name for a set of notes; omitted lists the chord tones it leaves out, by
// interval number (5 for the 5th), so a view can show them as optional.
export type NamedChord = ChordName & { omitted?: number[] }

const NOTE = '[A-G](?:𝄪|𝄫|##|bb|x|[#♯b♭])?'
const ROOT_PATTERN = new RegExp(`^(${NOTE})(.*)$`, 'u')
const BASS_PATTERN = new RegExp(`/(${NOTE})$`, 'u')

// Whole suffixes the parser reads, after normalising: ids, symbols and
// aliases from chord-data.ts. Jazz symbols reach these through normalise.
const SUFFIXES = new Map<string, string>()
for (const q of CHORD_QUALITIES) {
  for (const text of [q.id, q.symbol, ...(q.aliases ?? [])]) {
    SUFFIXES.set(text, q.id)
  }
}

// Rewrites a typed suffix in lead-sheet ASCII: ♭ and ♯ as b and #, jazz
// prefixes (△ – ø ° +) as maj, m, m7b5, dim and #5, and + or - before a
// number as an alteration (C7+5, C7-9). Brackets, commas and spaces go.
function normalise(raw: string): string {
  let s = raw
    .replace(/♭/g, 'b')
    .replace(/♯/g, '#')
    .replace(/[–−]/g, '-')
    .replace(/[\s(),]/g, '')
    // △ alone is a major 7th; before a number it means maj (C△9).
    .replace(/[△Δ^](?!\d)/g, 'maj7')
    .replace(/[△Δ^]/g, 'maj')
    .replace(/(?<=.)\+(?=\d)/g, '#')
    .replace(/(?<=.)-(?=\d)/g, 'b')
    .replace(/(?<=\d)\+$/, '#5')
  let m: RegExpExecArray | null
  if ((m = /^(?:\+|aug)(.*)$/.exec(s))) s = m[1] ? `${m[1]}#5` : 'aug'
  else if ((m = /^ø(\d*)(.*)$/.exec(s))) s = `m${m[1] || '7'}b5${m[2]}`
  else if ((m = /^[o°](.*)$/.exec(s))) s = `dim${m[1]}`
  else if ((m = /^(?:min|mi|m|-)(?:maj|Maj|ma|M)(.*)$/.exec(s)))
    s = `mMaj${m[1]}`
  else if ((m = /^(?:maj|Maj|ma(?!dd)|Ma|M)(.*)$/.exec(s)))
    s = /^[1-57-9]/.test(m[1]) ? `maj${m[1]}` : m[1]
  else if ((m = /^(?:min|mi|-)(.*)$/.exec(s))) s = `m${m[1]}`
  return s || 'M'
}

// An extended suffix with its alterations in canonical order, 5ths first and
// then by number: 7b9#5 is 7#5b9, 7#11b9 is 7b9#11.
function orderAlterations(s: string): string | undefined {
  const match = /^([A-Za-z]*)(7|9|11|13)((?:[b#]+\d+)*)$/.exec(s)
  if (!match) return undefined
  const [, prefix, number, tail] = match
  const alterations = (tail.match(/[b#]+\d+/g) ?? []).sort((a, b) => {
    const rank = (t: string) => {
      const n = Number(t.replace(/[b#]+/, ''))
      return n === 5 ? 0 : n
    }
    return rank(a) - rank(b)
  })
  return prefix + number + alterations.join('')
}

function quality(suffix: string): string | undefined {
  const s = normalise(suffix)
  const candidate = SUFFIXES.get(s) ?? orderAlterations(s)
  if (!candidate) return undefined
  const intervals = chordIntervals(candidate)
  return intervals && qualityFromIntervals(intervals)
}

// Reads a chord symbol in either style, with typed or displayed accidentals:
// Cmaj7, C△7, F#m7b5, F♯ø7, Bb7(b9,#11), C7+5, Am7/G, C6/9. Undefined when the
// text isn't a chord symbol.
export function parseChordSymbol(text: string): ChordName | undefined {
  let body = text.trim()
  let bass: Note | undefined
  const slash = BASS_PATTERN.exec(body)
  if (slash) {
    bass = parseNote(slash[1])
    body = body.slice(0, slash.index)
  }
  const match = ROOT_PATTERN.exec(body)
  if (!match) return undefined
  const root = parseNote(match[1])
  const id = quality(match[2])
  if (!root || !id) return undefined
  const chord: ChordName = { root, quality: id }
  if (bass && !sameSpelling(bass, root)) chord.bass = bass
  return chord
}

function requireIntervals(quality: string): Interval[] {
  const intervals = chordIntervals(quality)
  if (!intervals) throw new Error(`unknown chord quality ${quality}`)
  return intervals
}

// A chord's notes, root first and spelled from the root. A bass that is a
// chord tone (by pitch) moves that tone to the bottom, in the bass's
// spelling; any other bass sits under the whole chord: F/G is G F A C.
export function chordNotes(chord: ChordName): Note[] {
  const tones = requireIntervals(chord.quality).map((i) =>
    transpose(chord.root, i),
  )
  const { bass } = chord
  if (!bass) return tones
  const at = tones.findIndex((t) => pitchClass(t) === pitchClass(bass))
  if (at < 0) return [bass, ...tones]
  return [bass, ...tones.slice(at + 1), ...tones.slice(0, at)]
}

// Each quality the namer knows, as pitch-class masks above the root. A name
// can leave out its perfect 5th if it has four or more notes, unless it has
// a ♯11 or ♭13 (which would then sound as a ♭5 or ♯5), and an 11th or 13th
// chord can leave out its natural 9th, and a 13th chord its natural 11th.
type Entry = {
  id: string
  intervals: Interval[]
  pitches: number[]
  mask: number
  required: number
}

let ENTRIES: Entry[] | undefined

function entries(): Entry[] {
  ENTRIES ??= chordQualityIds().map((id) => {
    const intervals = requireIntervals(id)
    const has = (text: string) =>
      intervals.some((i) => `${i.quality}${i.number}` === text)
    const optional = (i: Interval) => {
      const text = `${i.quality}${i.number}`
      if (text === 'P5') {
        return intervals.length >= 4 && !has('A11') && !has('m13')
      }
      if (text === 'M9') return has('P11') || has('M13')
      if (text === 'P11') return has('M13')
      return false
    }
    const pitches = intervals.map((i) => mod(semitones(i), 12))
    let mask = 0
    let required = 0
    intervals.forEach((interval, i) => {
      mask |= 1 << pitches[i]
      if (!optional(interval)) required |= 1 << pitches[i]
    })
    return { id, intervals, pitches, mask, required }
  })
  return ENTRIES
}

function rotate(mask: number, by: number): number {
  return ((mask << by) | (mask >> (12 - by))) & 0xfff
}

// A root spelled with a double accidental reads as its plain neighbour
// (B𝄫 as A, E𝄪 as F♯), keeping the direction of the accidental.
function simplified(note: Note): Note {
  if (Math.abs(note.accidental) <= 1) return note
  const pitch = pitchClass(note)
  const options = LETTERS.map((letter) => ({
    letter,
    accidental: mod(pitch - naturalSemitones(letter) + 6, 12) - 6,
  })).filter((n) => Math.abs(n.accidental) <= 1)
  return (
    options.find((n) => n.accidental === 0) ??
    options.find(
      (n) => Math.sign(n.accidental) === Math.sign(note.accidental),
    ) ??
    options[0]
  )
}

// Names are spelled without octaves: C/E, not C5/E4.
function withoutOctave(note: Note): Note {
  return { letter: note.letter, accidental: note.accidental }
}

function lowest(notes: Note[]): Note {
  const midis = notes.map(midiNumber)
  if (midis.some((m) => m === undefined)) return notes[0]
  let low = 0
  midis.forEach((m, i) => {
    if ((m as number) < (midis[low] as number)) low = i
  })
  return notes[low]
}

const KIND_RANK = { diatonic: 0, secondary: 1, borrowed: 1, chromatic: 2 }

type Candidate = {
  name: NamedChord
  rank: number[]
  outsideBass: boolean
}

// Every name for a set of notes (SPEC 4), the primary first. The lowest note
// is the bass: the lowest by octave, or the first note when any has none.
// Names are ranked by:
//   1. fit with the key, when there is one: diatonic, then secondary or
//      borrowed, then chromatic
//   2. fewest chord tones spelled differently from the notes given
//   3. the bass as root, then as another chord tone, then outside the chord
//   4. fewest tones left out
//   5. the order of the roots in the notes given
// Roots and the bass keep the spelling given (a double-accidental root is
// simplified, so Cdim7's fourth name is Adim7/C). No name has a 9th, 11th or
// 13th in the bass (Fadd9/G is F/G), and a bass outside the chord is only
// offered when no complete name has a chord tone in the bass.
export function chordNames(
  notes: Note[],
  options: { key?: Key } = {},
): NamedChord[] {
  const pitches = new Set(notes.map(pitchClass))
  if (pitches.size < 2) return []
  const bass = lowest(notes)
  const bassPitch = pitchClass(bass)
  let all = 0
  for (const p of pitches) all |= 1 << p
  const upper = all & ~(1 << bassPitch)

  const roots: { note: Note; pitch: number }[] = []
  for (const n of notes) {
    if (!roots.some((r) => r.pitch === pitchClass(n))) {
      roots.push({ note: simplified(withoutOctave(n)), pitch: pitchClass(n) })
    }
  }

  const found: Candidate[] = []
  roots.forEach((root, rootIndex) => {
    entries().forEach((entry, entryIndex) => {
      const mask = rotate(entry.mask, root.pitch)
      const required = rotate(entry.required, root.pitch)
      const outsideBass = !(mask & (1 << bassPitch))
      const target = outsideBass ? upper : all
      if (target & ~mask || required & ~target) return
      const present = entry.intervals.filter(
        (_, i) => target & (1 << mod(entry.pitches[i] + root.pitch, 12)),
      )
      const omitted = entry.intervals
        .filter((i) => !present.includes(i))
        .map((i) => i.number)
      if (omitted.length && present.length < 3) return

      const tones = present.map((i) => transpose(root.note, i))
      const bassTone = outsideBass
        ? undefined
        : present.findIndex((i) => {
            const pitch = mod(semitones(i) + root.pitch, 12)
            return pitch === bassPitch
          })
      if (bassTone !== undefined && present[bassTone].number > 7) return

      const name: NamedChord = { root: root.note, quality: entry.id }
      if (bassTone !== 0) name.bass = withoutOctave(bass)
      if (omitted.length) name.omitted = omitted

      let keyRank = 0
      if (options.key) {
        // Read the bass as the chord spells it, so Caug/A♭ in A minor is
        // III+ over its 5th, not a chord over a foreign bass.
        const reading = romanNumeral(options.key, {
          root: root.note,
          quality: entry.id,
          bass:
            bassTone === undefined
              ? bass
              : bassTone
                ? tones[bassTone]
                : undefined,
        })
        keyRank = KIND_RANK[reading.kind]
      }
      const respelled = tones.filter(
        (t) =>
          !notes.some(
            (n) => n.letter === t.letter && n.accidental === t.accidental,
          ),
      ).length
      const bassRank = bassTone === 0 ? 0 : outsideBass ? 2 : 1
      found.push({
        name,
        outsideBass,
        rank: [
          keyRank,
          respelled,
          bassRank,
          omitted.length,
          rootIndex,
          entryIndex,
        ],
      })
    })
  })

  const complete = found.some((c) => !c.outsideBass && !c.name.omitted)
  return found
    .filter((c) => !(complete && c.outsideBass))
    .sort((a, b) => {
      for (let i = 0; i < a.rank.length; i++) {
        if (a.rank[i] !== b.rank[i]) return a.rank[i] - b.rank[i]
      }
      return 0
    })
    .map((c) => c.name)
}
