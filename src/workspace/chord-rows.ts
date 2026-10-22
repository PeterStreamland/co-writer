// The Explore panel's chord rows, read from the theory core: one row per
// kind of stacked chord for a scale that stacks in thirds, otherwise every
// chord in the scale, degree by degree. No theory lives here.
import {
  chordNotes,
  chordSymbol,
  chordsInScale,
  degreeLabel,
  describeNumeral,
  diatonicChords,
  formatNote,
  hasDiatonicChords,
  playbackVoicing,
  romanNumeral,
  scaleNotes,
  type ChordName,
  type DiatonicKind,
  type Key,
  type Note,
} from '../theory'

// Triads, 7ths and extended chords show first; the rest sit behind "More
// chords" (SPEC 2: common items first).
export const MAIN_KINDS: DiatonicKind[] = [
  'triad',
  'seventh',
  'ninth',
  'eleventh',
  'thirteenth',
]
export const MORE_KINDS: DiatonicKind[] = [
  'sus2',
  'sus4',
  '7sus4',
  'add9',
  'add11',
  '6',
]

const KIND_LABELS: Record<DiatonicKind, string> = {
  triad: 'Triads',
  seventh: '7ths',
  ninth: '9ths',
  eleventh: '11ths',
  thirteenth: '13ths',
  sus2: 'sus2',
  sus4: 'sus4',
  '7sus4': '7sus4',
  add9: 'add9',
  add11: 'add11',
  '6': '6ths',
}

export type ChordButton = {
  id: string
  chord: ChordName
  symbol: string
  numeral: string
}

export type ChordRows =
  | {
      stacked: true
      degrees: string[]
      rows: { label: string; cells: (ChordButton | undefined)[] }[]
    }
  | {
      stacked: false
      degrees: string[]
      columns: ChordButton[][]
    }

function button(key: Key, chord: ChordName): ChordButton {
  const symbol = chordSymbol(chord)
  return {
    id: chordSymbol(chord, { ascii: true }),
    chord,
    symbol,
    numeral: romanNumeral(key, chord).numeral,
  }
}

export function chordRows(key: Key, showMore: boolean): ChordRows {
  const tonic = key.tonic
  const degrees = scaleNotes(tonic, key.mode).map((n) => degreeLabel(tonic, n))
  if (!hasDiatonicChords(key.mode)) {
    const columns: ChordButton[][] = degrees.map(() => [])
    for (const c of chordsInScale(key)) {
      columns[c.degree - 1].push(button(key, c))
    }
    return { stacked: false, degrees, columns }
  }
  const kinds = showMore ? [...MAIN_KINDS, ...MORE_KINDS] : MAIN_KINDS
  return {
    stacked: true,
    degrees,
    rows: kinds.map((kind) => {
      // A gap where the shape isn't a dictionary chord (C major has no Fsus4).
      const cells: (ChordButton | undefined)[] = degrees.map(() => undefined)
      for (const c of diatonicChords(key, kind)) {
        cells[c.degree - 1] = button(key, c)
      }
      return { label: KIND_LABELS[kind], cells }
    }),
  }
}

export type CurrentChord = {
  symbol: string
  description: string
  notes: string[]
  voicing: Note[]
}

// The chord last clicked, as the current chord for every tool (SPEC 2).
export function currentChord(key: Key, chord: ChordName): CurrentChord {
  return {
    symbol: chordSymbol(chord),
    description: describeNumeral(key, romanNumeral(key, chord)),
    notes: chordNotes(chord).map((n) => formatNote(n)),
    voicing: playbackVoicing(chord),
  }
}
