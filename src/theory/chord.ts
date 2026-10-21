// Chords. Qualities come from the dictionary in chord-data.ts; diatonic chords
// stack a seven-note scale's own notes from each degree, so they keep the
// key's spelling (F♭ major in A♭ minor, A♯7 in D♯ harmonic minor; SPEC 4).
import {
  CHORD_QUALITIES,
  DIATONIC_SHAPES,
  type ChordQualityData,
} from './chord-data'
import {
  formatInterval,
  intervalBetween,
  parseInterval,
  semitones,
  transpose,
} from './interval'
import type { Interval } from './interval'
import {
  formatAccidental,
  formatNote,
  pitchClass,
  type FormatOptions,
} from './note'
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

// Each quality's intervals, parsed once.
const QUALITY_INTERVALS = CHORD_QUALITIES.map((q) => ({
  id: q.id,
  intervals: q.intervals.map((text) => {
    const interval = parseInterval(text)
    if (!interval) throw new Error(`bad chord interval ${text}`)
    return interval
  }),
}))

const INTERVALS_BY_ID = new Map(
  QUALITY_INTERVALS.map((q) => [q.id, q.intervals]),
)

// Unaltered 9th, 11th and 13th, in semitones above the root.
const NATURAL_EXTENSIONS: Record<number, number> = { 9: 14, 11: 17, 13: 21 }

export type ChordStyle = 'lead-sheet' | 'jazz'
export type SymbolOptions = FormatOptions & { style?: ChordStyle }

// A quality's symbol after the root, in ASCII: 'm7b5' lead-sheet, 'ø7' jazz.
// An extended chord follows its 7th chord with the 7 replaced: Cm9♭5 is Cø9.
function qualitySymbol(quality: string, style: ChordStyle): string {
  const known = BY_ID.get(quality)
  if (known) return style === 'jazz' ? known.jazz : known.symbol
  if (style === 'lead-sheet') return quality
  const extended = parseExtended(quality)
  if (!extended) return quality
  const { seventh, number, altered } = extended
  return (
    seventh.jazz.replace('7', String(number)) +
    altered
      .map((a) => formatAccidental(a.offset, { ascii: true }) + a.number)
      .join('')
  )
}

// A chord symbol, lead-sheet plain by default (F♯m7♭5, A♭maj9♯11/C) or jazz
// (F♯ø7, A♭△9♯11/C); with ascii, F#m7b5. A slash shows the bass (SPEC 4).
export function chordSymbol(
  chord: { root: Note; quality: string; bass?: Note },
  options: SymbolOptions = {},
): string {
  const suffix = qualitySymbol(chord.quality, options.style ?? 'lead-sheet')
  const shown = options.ascii
    ? suffix
    : suffix.replace(/b/g, '♭').replace(/#/g, '♯')
  const bass = chord.bass ? `/${formatNote(chord.bass, options)}` : ''
  return formatNote(chord.root, options) + shown + bass
}

// A 9th, 11th or 13th chord is named from its 7th chord: the number is the
// highest unaltered extension and altered ones follow it, so a major 7th with
// a 9th, ♯11 and 13th is maj13#11, and a dominant 7th with ♭9, 11 and ♭13 is
// 11b9b13. Unaltered extensions below the number are implied; altered ones
// above it are not, so a dominant 7th with only a ♯11 is 7#11.
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
    const quality = qualityFromIntervals(intervals)
    if (quality) chords.push({ root, quality, notes: tones, degree: i + 1 })
  })
  return chords
}

// Whether a scale gets chords stacked in thirds: seven notes, one letter per
// degree, and a dictionary triad and 7th on every degree. That covers major,
// harmonic and melodic minor and all their modes, plus harmonic major and
// Lydian diminished from tonal's wider dictionary. Other scales use the
// "every dictionary chord in the scale" policy: chordsInScale.
export function hasDiatonicChords(mode: string): boolean {
  if (!isSevenLetterScale(mode)) return false
  const key: Key = { tonic: { letter: 'C', accidental: 0 }, mode }
  return (['triad', 'seventh'] as const).every(
    (kind) => stackChords(key, kind).length === 7,
  )
}

// The key's diatonic chords of one kind, in degree order. Triads, 7ths and
// 9th, 11th and 13th chords sit on every degree; a sus, add or 6th chord is
// left out where the shape isn't a dictionary chord (C major has no Fsus4). The
// 7sus4 kind takes a major or minor 7th: Cmaj7sus4 and D7sus4 in C major.
export function diatonicChords(key: Key, kind: DiatonicKind): DiatonicChord[] {
  if (!hasDiatonicChords(key.mode)) {
    throw new Error(`${key.mode} has no chords stacked in thirds`)
  }
  return stackChords(key, kind)
}

// Every dictionary chord whose notes all sit in the scale, for any scale: the
// policy for scales that don't stack in thirds (pentatonics, blues,
// whole-tone, diminished, bebop, Hungarian minor). A note sits in the scale if
// its pitch does, but chords are spelled from their root so the name matches
// the notes: C whole-tone holds E7♯5 as E G♯ B♯ D. Roots are the scale's own
// notes; chords come in degree order, then dictionary order.
export function chordsInScale(key: Key): DiatonicChord[] {
  const notes = scaleNotes(key.tonic, key.mode)
  const pitches = new Set(notes.map(pitchClass))
  const chords: DiatonicChord[] = []
  notes.forEach((root, i) => {
    for (const { id, intervals } of QUALITY_INTERVALS) {
      const tones = intervals.map((interval) => transpose(root, interval))
      if (tones.every((tone) => pitches.has(pitchClass(tone)))) {
        chords.push({ root, quality: id, notes: tones, degree: i + 1 })
      }
    }
  })
  return chords
}

// An extended quality id read back into its 7th chord, its number and the
// alterations past the 7th chord's own: 'maj13#11' is maj7, 13 and ♯11;
// 'm11b5b9b13' is m7b5, 11, ♭9 and ♭13.
function parseExtended(quality: string) {
  const match = /^([A-Za-z]*)(7|9|11|13)((?:[b#]+\d+)*)$/.exec(quality)
  if (!match) return undefined
  const [, prefix, digits, tail] = match
  const alterations = tail.match(/[b#]+\d+/g) ?? []
  let seventh: ChordQualityData | undefined
  for (const q of CHORD_QUALITIES) {
    const own = q.extends?.alterations
    if (q.extends?.prefix !== prefix || !own) continue
    if (own.some((a, i) => alterations[i] !== a)) continue
    if (!seventh || own.length > (seventh.extends?.alterations.length ?? 0)) {
      seventh = q
    }
  }
  if (!seventh) return undefined
  const altered = alterations
    .slice(seventh.extends?.alterations.length)
    .map((text) => ({
      number: Number(text.replace(/[b#]+/, '')),
      offset: (text.match(/#/g)?.length ?? 0) - (text.match(/b/g)?.length ?? 0),
    }))
  const number = Number(digits)
  if (number === 7 && altered.length === 0) return undefined
  if (altered.some((a) => !(a.number in NATURAL_EXTENSIONS))) return undefined
  // Each extension once, and the number itself unaltered: no 7b9#9 or 9b9.
  const numbers = altered.map((a) => a.number)
  if (new Set(numbers).size < numbers.length || numbers.includes(number)) {
    return undefined
  }
  return { seventh, number, altered }
}

const EXTENSION_INTERVALS: Record<number, Record<number, string>> = {
  9: { [-1]: 'm9', 0: 'M9', 1: 'A9' },
  11: { [-1]: 'd11', 0: 'P11', 1: 'A11' },
  13: { [-1]: 'm13', 0: 'M13', 1: 'A13' },
}

// The intervals above the root for a quality id, including extended ones
// that diatonicChords names (G13, Fmaj13♯11): every stacked tone up to the
// number is kept, so a 13th chord has its 9th and 11th. An alteration adds
// only its own note: C7♯11 is C E G B♭ F♯, with no 9th.
export function chordIntervals(quality: string): Interval[] | undefined {
  const known = INTERVALS_BY_ID.get(quality)
  if (known) return known
  const extended = parseExtended(quality)
  if (!extended) return undefined
  const { seventh, number, altered } = extended
  const intervals = [...(INTERVALS_BY_ID.get(seventh.id) ?? [])]
  for (const n of [9, 11, 13]) {
    const offset = altered.find((a) => a.number === n)?.offset
    if (offset === undefined && n > number) continue
    const interval = parseInterval(EXTENSION_INTERVALS[n][offset ?? 0] ?? '')
    if (!interval) return undefined
    intervals.push(interval)
  }
  return intervals
}

// The quality id for intervals above a root: a dictionary chord, or a 7th
// chord with extensions. Undefined when no symbol fits.
export function qualityFromIntervals(
  intervals: Interval[],
): string | undefined {
  return (
    BY_INTERVALS.get(intervals.map(formatInterval).join(' '))?.id ??
    extendedQuality(intervals)
  )
}

// The alterations each extension can take in an extended chord's name.
const EXTENSION_ALTERATIONS: Record<number, number[]> = {
  9: [-1, 1],
  11: [1],
  13: [-1],
}

// Every extended quality of each 7th chord: a number (7, 9, 11 or 13) with
// the extensions below it natural or altered and those above it absent or
// altered. A name whose notes double a pitch (7♯5♭13, m7♯9) is left out.
function extendedQualityIds(): string[] {
  const ids: string[] = []
  for (const seventh of CHORD_QUALITIES) {
    if (!seventh.extends) continue
    const { prefix, alterations } = seventh.extends
    for (const number of [7, 9, 11, 13]) {
      let combos: number[][] = [[]]
      for (const n of [9, 11, 13]) {
        const options: (number | undefined)[] =
          n === number
            ? [0]
            : [n < number ? 0 : undefined, ...EXTENSION_ALTERATIONS[n]]
        combos = combos.flatMap((combo) =>
          options.map((o) => (o === undefined ? combo : [...combo, n, o])),
        )
      }
      for (const combo of combos) {
        let tail = ''
        for (let i = 0; i < combo.length; i += 2) {
          if (combo[i + 1] !== 0) {
            tail += formatAccidental(combo[i + 1], { ascii: true }) + combo[i]
          }
        }
        if (number === 7 && !tail) continue
        const id = prefix + number + alterations.join('') + tail
        const intervals = chordIntervals(id)
        if (!intervals) continue
        const pitches = new Set(intervals.map((i) => semitones(i) % 12))
        if (pitches.size === intervals.length) ids.push(id)
      }
    }
  }
  return ids
}

let QUALITY_IDS: string[] | undefined

// Every quality the namer knows: the dictionary, then the extended chords.
export function chordQualityIds(): string[] {
  QUALITY_IDS ??= [...CHORD_QUALITIES.map((q) => q.id), ...extendedQualityIds()]
  return QUALITY_IDS
}

// How a quality reads after a Roman numeral (see chord-data.ts), and whether
// it can be a secondary chord. Extended chords follow their 7th chord.
export function qualityNumeral(
  quality: string,
): Pick<ChordQualityData, 'numeral' | 'secondary'> | undefined {
  const known = BY_ID.get(quality)
  if (known) return known
  const extended = parseExtended(quality)
  if (!extended) return undefined
  const { seventh, number, altered } = extended
  const alterations = altered
    .map((a) => formatAccidental(a.offset) + a.number)
    .join('')
  return {
    numeral: {
      upper: seventh.numeral.upper,
      suffix: seventh.numeral.suffix.replace('7', String(number)) + alterations,
    },
    secondary: seventh.secondary,
  }
}
