// Chords. Qualities come from the dictionary in chord-data.ts; diatonic chords
// stack a seven-note scale's own notes from each degree, so they keep the
// key's spelling (F♭ major in A♭ minor, A♯7 in D♯ harmonic minor; SPEC 4).
import {
  CHORD_QUALITIES,
  DIATONIC_SHAPES,
  type ChordQualityData,
} from './chord-data'
import { formatInterval, intervalBetween, semitones } from './interval'
import type { Interval } from './interval'
import { formatAccidental, formatNote, type FormatOptions } from './note'
import type { Note } from './note'
import { getScale, scaleNotes, type Key } from './scale'

export type DiatonicKind = keyof typeof DIATONIC_SHAPES
export const DIATONIC_KINDS = Object.keys(DIATONIC_SHAPES) as DiatonicKind[]

// quality is a chord-quality id: 'M', 'm7', 'maj13#11' (SPEC 12).
export type Chord = { root: Note; quality: string; notes: Note[] }
export type DiatonicChord = Chord & { degree: number }

const BY_ID = new Map(CHORD_QUALITIES.map((q) => [q.id, q]))
const BY_INTERVALS = new Map<string, ChordQualityData>(
  CHORD_QUALITIES.map((q) => [q.intervals.join(' '), q]),
)

// Unaltered 9th, 11th and 13th, in semitones above the root.
const NATURAL_EXTENSIONS: Record<number, number> = { 9: 14, 11: 17, 13: 21 }

// Lead-sheet plain symbol: F♯m7♭5, A♭maj9♯11; with ascii, F#m7b5.
export function chordSymbol(
  chord: { root: Note; quality: string },
  options: FormatOptions = {},
): string {
  const suffix = BY_ID.get(chord.quality)?.symbol ?? chord.quality
  const shown = options.ascii
    ? suffix
    : suffix.replace(/b/g, '♭').replace(/#/g, '♯')
  return formatNote(chord.root, options) + shown
}

// A 9th, 11th or 13th chord is named from its 7th chord: the number is the
// highest unaltered extension and altered ones follow it, so a major 7th with
// a 9th, ♯11 and 13th is maj13#11, and a dominant 7th with ♭9, 11 and ♭13 is
// 11b9b13.
function extendedQuality(intervals: Interval[]): string | undefined {
  if (intervals.length <= 4) return undefined
  const seventh = BY_INTERVALS.get(
    intervals.slice(0, 4).map(formatInterval).join(' '),
  )
  if (!seventh?.extends) return undefined
  let number = 7
  const altered: string[] = []
  for (const interval of intervals.slice(4)) {
    const offset = semitones(interval) - NATURAL_EXTENSIONS[interval.number]
    if (offset === 0) number = interval.number
    else
      altered.push(formatAccidental(offset, { ascii: true }) + interval.number)
  }
  const { prefix, alterations } = seventh.extends
  return prefix + number + [...alterations, ...altered].join('')
}

function isSevenLetterScale(mode: string): boolean {
  const scale = getScale(mode)
  return (
    scale !== undefined &&
    scale.intervals.length === 7 &&
    scale.intervals.every((interval, i) => interval.number === i + 1)
  )
}

function stackChords(key: Key, kind: DiatonicKind): DiatonicChord[] {
  const notes = scaleNotes(key.tonic, key.mode)
  const chords: DiatonicChord[] = []
  notes.forEach((root, i) => {
    const tones = DIATONIC_SHAPES[kind].map((step) => notes[(i + step - 1) % 7])
    // Each tone's interval keeps its step number: the 9th is a 9th, not a 2nd.
    const intervals = tones.map((tone, t) => ({
      quality: intervalBetween(root, tone).quality,
      number: DIATONIC_SHAPES[kind][t],
    }))
    const quality =
      BY_INTERVALS.get(intervals.map(formatInterval).join(' '))?.id ??
      extendedQuality(intervals)
    if (quality) chords.push({ root, quality, notes: tones, degree: i + 1 })
  })
  return chords
}

// Whether a scale gets chords stacked in thirds: seven notes, one letter per
// degree, and a dictionary triad and 7th on every degree. That covers major,
// harmonic and melodic minor and all their modes, plus harmonic major and
// Lydian diminished from tonal's wider dictionary. Other scales use the
// "every dictionary chord in the scale" policy (Phase 1 task 4).
export function hasDiatonicChords(mode: string): boolean {
  if (!isSevenLetterScale(mode)) return false
  const key: Key = { tonic: { letter: 'C', accidental: 0 }, mode }
  return (['triad', 'seventh'] as const).every(
    (kind) => stackChords(key, kind).length === 7,
  )
}

// The key's diatonic chords of one kind, in degree order. Triads, 7ths and
// 9th, 11th and 13th chords sit on every degree; a sus, add or 6th chord is
// left out where the shape isn't a dictionary chord (C major has no Fsus4, and
// no Cmaj7sus4 until the dictionary grows in task 6).
export function diatonicChords(key: Key, kind: DiatonicKind): DiatonicChord[] {
  if (!hasDiatonicChords(key.mode)) {
    throw new Error(`${key.mode} has no chords stacked in thirds`)
  }
  return stackChords(key, kind)
}
