// Roman numerals (SPEC 4). Every numeral is measured from the major scale on
// the key's tonic with flats shown, so ♭VI means the same in every key and
// mode, and E Dorian's C♯° is vi°. A chord is read as diatonic, then as a
// secondary chord (V/vi, vii°7/V), then as borrowed from the closest parallel
// mode, and otherwise as chromatic.
import {
  chordIntervals,
  diatonicChords,
  hasDiatonicChords,
  qualityNumeral,
} from './chord'
import { degreeLabel, parseInterval, transpose } from './interval'
import type { Interval } from './interval'
import { formatNote, pitchClass, type Note } from './note'
import { getScale, scaleNotes, type Key } from './scale'

export type NumeralKind = 'diatonic' | 'secondary' | 'borrowed' | 'chromatic'

export type RomanNumeral = {
  numeral: string
  kind: NumeralKind
  // A secondary chord's target: its degree in the key and its numeral.
  target?: {
    degree: number
    numeral: string
    role: 'dominant' | 'leading-note'
  }
  // A borrowed chord's source keys, closest to the key first.
  sources?: Key[]
}

// Inversions use classical figures (V⁶₅) unless slash is set (V7/3).
export type NumeralOptions = { slash?: boolean }

type ChordInput = { root: Note; quality: string; bass?: Note }

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII']

// Parallel modes a chord can be borrowed from, in the order that breaks ties
// between equally close ones. Harmonic and melodic minor are sources for a
// minor key, or for any key when no major mode has the chord.
const MAJOR_MODES = [
  'major',
  'natural-minor',
  'mixolydian',
  'dorian',
  'lydian',
  'phrygian',
  'locrian',
]
const MINOR_SCALES = ['harmonic-minor', 'melodic-minor']

// How keys and sources are named in descriptions.
const KEY_NAMES: Record<string, string> = {
  major: 'major',
  'natural-minor': 'minor',
}
const SOURCE_NAMES: Record<string, string> = {
  major: 'major',
  'natural-minor': 'Aeolian',
  'harmonic-minor': 'harmonic minor',
  'melodic-minor': 'melodic minor',
}

// Figured-bass inversions for triads and 7th chords, by bass chord tone.
const TRIAD_FIGURES = ['', '⁶', '⁶₄']
const SEVENTH_FIGURES = ['', '⁶₅', '⁴₃', '⁴₂']

const PERFECT_4TH = parseInterval('P4') as Interval
const MINOR_2ND = parseInterval('m2') as Interval

function sameNote(a: Note, b: Note): boolean {
  return a.letter === b.letter && a.accidental === b.accidental
}

function requireQuality(quality: string) {
  const numeral = qualityNumeral(quality)
  const intervals = chordIntervals(quality)
  if (!numeral || !intervals)
    throw new Error(`unknown chord quality ${quality}`)
  return { ...numeral, intervals }
}

function scaleId(mode: string): string {
  const scale = getScale(mode)
  if (!scale) throw new Error(`unknown scale ${mode}`)
  return scale.id
}

// The numeral for a root, before any suffix: ♭VI, ♯iv, vii.
function numeralBody(tonic: Note, root: Note, upper: boolean): string {
  const label = degreeLabel(tonic, root)
  const roman = ROMAN[Number(label.slice(-1)) - 1]
  return label.slice(0, -1) + (upper ? roman : roman.toLowerCase())
}

// Whether every note sits in the key: by spelling for a scale that stacks in
// thirds, by pitch otherwise (as chordsInScale does).
function inKey(key: Key, notes: Note[]): boolean {
  const scale = scaleNotes(key.tonic, key.mode)
  if (hasDiatonicChords(key.mode)) {
    return notes.every((n) => scale.some((s) => sameNote(s, n)))
  }
  const pitches = new Set(scale.map(pitchClass))
  return notes.every((n) => pitches.has(pitchClass(n)))
}

// A dominant a 5th above, or a leading-note chord a semitone below, a major
// or minor diatonic triad other than the tonic or ♭VII. A plain major triad on the
// tonic reads as I, but C7 in C is V7/IV.
function secondaryTarget(
  key: Key,
  chord: ChordInput,
  role: 'dominant' | 'leading-note' | undefined,
): RomanNumeral['target'] {
  if (!role || !hasDiatonicChords(key.mode)) return undefined
  if (chord.quality === 'M' && sameNote(chord.root, key.tonic)) return undefined
  const targetRoot = transpose(
    chord.root,
    role === 'dominant' ? PERFECT_4TH : MINOR_2ND,
  )
  const triads = diatonicChords(key, 'triad')
  const triad = triads.find((t) => sameNote(t.root, targetRoot))
  if (!triad || triad.degree === 1) return undefined
  // A major chord a 5th above ♭VII is the Dorian IV (A in E minor), so ♭VII
  // is never a target.
  if (degreeLabel(key.tonic, triad.root) === '♭7') return undefined
  if (triad.quality !== 'M' && triad.quality !== 'm') return undefined
  return {
    degree: triad.degree,
    numeral: numeralBody(key.tonic, triad.root, triad.quality === 'M'),
    role,
  }
}

function isMinorKey(key: Key): boolean {
  const third = getScale(key.mode)?.intervals[2]
  return third?.number === 3 && third.quality === 'm'
}

// Parallel keys whose notes hold the chord, fewest notes changed from the
// key's scale first.
function borrowedSources(key: Key, notes: Note[]): Key[] | undefined {
  if (!hasDiatonicChords(key.mode)) return undefined
  const own = scaleId(key.mode)
  const scale = scaleNotes(key.tonic, key.mode)
  const fits = (modes: string[]) =>
    modes
      .filter((mode) => mode !== own)
      .map((mode) => ({ mode, notes: scaleNotes(key.tonic, mode) }))
      .filter((source) =>
        notes.every((n) => source.notes.some((s) => sameNote(s, n))),
      )
  const major = fits(MAJOR_MODES)
  const minor = fits(MINOR_SCALES)
  const found = isMinorKey(key) || !major.length ? [...major, ...minor] : major
  if (!found.length) return undefined
  const changed = (source: Note[]) =>
    source.filter((n, i) => !sameNote(n, scale[i])).length
  const order = [...MAJOR_MODES, ...MINOR_SCALES]
  return found
    .sort(
      (a, b) =>
        changed(a.notes) - changed(b.notes) ||
        order.indexOf(a.mode) - order.indexOf(b.mode),
    )
    .map(({ mode }) => ({ tonic: key.tonic, mode }))
}

// The Roman numeral for a chord in a key: V7/vi for E7 in C major, ♭VI for
// A♭ in C major (borrowed from C Aeolian), V⁶₅ for G7/B.
export function romanNumeral(
  key: Key,
  chord: ChordInput,
  options: NumeralOptions = {},
): RomanNumeral {
  const { numeral, secondary, intervals } = requireQuality(chord.quality)
  const notes = intervals.map((i) => transpose(chord.root, i))

  let kind: NumeralKind = 'chromatic'
  let target: RomanNumeral['target']
  let sources: Key[] | undefined
  if (inKey(key, notes)) kind = 'diatonic'
  else if ((target = secondaryTarget(key, chord, secondary))) kind = 'secondary'
  else if ((sources = borrowedSources(key, notes))) kind = 'borrowed'

  // A secondary chord is numbered from its target: V of vi, vii° of V.
  const body = target
    ? target.role === 'dominant'
      ? 'V'
      : 'vii'
    : numeralBody(key.tonic, chord.root, numeral.upper)
  let head = body + numeral.suffix
  const of = target ? `/${target.numeral}` : ''

  let text = head + of
  const bassIndex = chord.bass
    ? notes.findIndex((n) => sameNote(n, chord.bass as Note))
    : 0
  if (chord.bass && bassIndex < 0) {
    text += ` (bass ${degreeLabel(key.tonic, chord.bass)})`
  } else if (bassIndex > 0) {
    const numbers = intervals.map((i) => i.number).join(' ')
    const figures =
      numbers === '1 3 5'
        ? TRIAD_FIGURES
        : numbers === '1 3 5 7'
          ? SEVENTH_FIGURES
          : undefined
    const tone = intervals[bassIndex].number
    if (figures && !options.slash) {
      head = body + numeral.suffix.replace(/7$/, '') + figures[bassIndex]
      text = head + of
    } else {
      text = target ? `(${head}${of})/${tone}` : `${head}/${tone}`
    }
  }

  const result: RomanNumeral = { numeral: text, kind }
  if (target) result.target = target
  if (sources) result.sources = sources
  return result
}

function modeName(mode: string, names: Record<string, string>): string {
  const id = scaleId(mode)
  return names[id] ?? getScale(id)?.name ?? mode
}

// One line for the ⓘ panel (SPEC 6.3): "♭VI, borrowed from C Aeolian",
// "V7/vi, secondary dominant of vi", "♭II7, chromatic in C major".
export function describeNumeral(key: Key, numeral: RomanNumeral): string {
  const tonic = formatNote(key.tonic)
  const keyName = `${tonic} ${modeName(key.mode, KEY_NAMES)}`
  switch (numeral.kind) {
    case 'diatonic':
      return `${numeral.numeral}, diatonic in ${keyName}`
    case 'secondary': {
      const role =
        numeral.target?.role === 'dominant' ? 'dominant' : 'leading-note chord'
      return `${numeral.numeral}, secondary ${role} of ${numeral.target?.numeral}`
    }
    case 'borrowed': {
      const source = numeral.sources?.[0]
      const name = source ? modeName(source.mode, SOURCE_NAMES) : ''
      return `${numeral.numeral}, borrowed from ${tonic} ${name}`
    }
    case 'chromatic':
      return `${numeral.numeral}, chromatic in ${keyName}`
  }
}
