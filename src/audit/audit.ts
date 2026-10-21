// The Phase 1 audit table: every key's scales and chords, read straight from
// the theory core so David can check them as a musician. No theory lives
// here; this only arranges what the core returns for display.
import {
  allScales,
  chordNames,
  chordNotes,
  chordSymbol,
  chordsInScale,
  closeVoicing,
  degreeLabel,
  describeNumeral,
  diatonicChords,
  formatNote,
  getScale,
  hasDiatonicChords,
  inversionName,
  inversions,
  keySignature,
  parentKey,
  romanNumeral,
  scaleNotes,
  type ChordName,
  type ChordStyle,
  type DiatonicKind,
  type Key,
  type Note,
  type Scale,
} from '../theory'

// Display order: '6' would sort first as an object key.
export const KINDS: DiatonicKind[] = [
  'triad',
  'seventh',
  'ninth',
  'eleventh',
  'thirteenth',
  'sus2',
  'sus4',
  '7sus4',
  'add9',
  'add11',
  '6',
]

export const KIND_LABELS: Record<DiatonicKind, string> = {
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

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const

// Every tonic with at most one sharp or flat: C♭ C C♯ D♭ D D♯ and so on.
export function auditTonics(): Note[] {
  return LETTERS.flatMap((letter) =>
    [-1, 0, 1].map((accidental) => ({ letter, accidental })),
  )
}

// The tonics of the 30 key signatures: 15 major and 15 minor.
const MAJOR_TONICS = 'C G D A E B F# C# F Bb Eb Ab Db Gb Cb'.split(' ')
const MINOR_TONICS = 'A E B F# C# G# D# A# D G C F Bb Eb Ab'.split(' ')

function ascii(note: Note): string {
  return formatNote(note, { ascii: true })
}

// Every key of a scale that has a real key signature, flats to sharps: a
// mode of major appears on the 15 tonics whose parent is a major key, a mode
// of harmonic or melodic minor on the 15 whose parent is a minor key. A scale
// that isn't a mode appears on the tonics of all 30 signatures.
export function keysForScale(mode: string): Key[] {
  const keys = auditTonics().map((tonic) => ({ tonic, mode }))
  const scale = getScale(mode)
  if (!scale?.modeOf) {
    const tonics = new Set([...MAJOR_TONICS, ...MINOR_TONICS])
    return keys.filter((key) => tonics.has(ascii(key.tonic)))
  }
  const tonics = scale.modeOf.scale === 'major' ? MAJOR_TONICS : MINOR_TONICS
  return keys
    .filter((key) => tonics.includes(ascii(parentKey(key).tonic)))
    .sort((a, b) => (keySignature(a) ?? 0) - (keySignature(b) ?? 0))
}

export function keyName(key: Key): string {
  return `${formatNote(key.tonic)} ${getScale(key.mode)?.name ?? key.mode}`
}

// '2♯', '3♭', 'no sharps or flats', or 'none' for a scale that isn't a mode.
export function signatureLabel(key: Key): string {
  const n = keySignature(key)
  if (n === undefined) return 'none (not a mode)'
  if (n === 0) return 'no sharps or flats'
  return n > 0 ? `${n}♯` : `${-n}♭`
}

// The key whose signature a mode shows: 'D major' for E Dorian.
export function parentLabel(key: Key): string | undefined {
  const parent = parentKey(key)
  if (parent.mode === key.mode && sameKey(parent, key)) return undefined
  return keyName(parent)
}

function sameKey(a: Key, b: Key): boolean {
  return (
    a.tonic.letter === b.tonic.letter &&
    a.tonic.accidental === b.tonic.accidental
  )
}

// Scales grouped for the picker, core families first.
export function scaleGroups(): { label: string; scales: Scale[] }[] {
  const labels: Record<string, string> = {
    'major-modes': 'Major and its modes',
    'harmonic-minor-modes': 'Harmonic minor and its modes',
    'melodic-minor-modes': 'Melodic minor and its modes',
    pentatonic: 'Pentatonic',
    blues: 'Blues',
    symmetrical: 'Symmetrical',
    bebop: 'Bebop',
    other: 'Wider dictionary',
  }
  const groups = new Map<string, Scale[]>()
  for (const scale of allScales()) {
    const list = groups.get(scale.family) ?? []
    list.push(scale)
    groups.set(scale.family, list)
  }
  return [...groups].map(([family, scales]) => ({
    label: labels[family] ?? family,
    scales,
  }))
}

export type ScaleRow = { notes: string[]; degrees: string[] }

export function scaleRow(key: Key): ScaleRow {
  const notes = scaleNotes(key.tonic, key.mode)
  return {
    notes: notes.map((n) => formatNote(n)),
    degrees: notes.map((n) => degreeLabel(key.tonic, n)),
  }
}

export type ChordCell = {
  chord: ChordName
  symbol: string
  numeral: string
  notes: string[]
}

export function chordCell(
  key: Key,
  chord: ChordName,
  style: ChordStyle,
): ChordCell {
  return {
    chord,
    symbol: chordSymbol(chord, { style }),
    numeral: romanNumeral(key, chord).numeral,
    notes: chordNotes(chord).map((n) => formatNote(n)),
  }
}

// One kind of stacked chord on every degree, with a gap where the shape
// isn't a dictionary chord (C major has no Fsus4).
export function stackedRow(
  key: Key,
  kind: DiatonicKind,
  style: ChordStyle,
): (ChordCell | undefined)[] {
  const cells: (ChordCell | undefined)[] = scaleNotes(key.tonic, key.mode).map(
    () => undefined,
  )
  for (const c of diatonicChords(key, kind)) {
    cells[c.degree - 1] = chordCell(
      key,
      { root: c.root, quality: c.quality },
      style,
    )
  }
  return cells
}

export type ChordTable =
  | { stacked: true; kinds: DiatonicKind[]; rows: (ChordCell | undefined)[][] }
  | { stacked: false; degrees: ChordCell[][] }

// The key's chords: by kind and degree for a scale that stacks in thirds,
// otherwise every dictionary chord in the scale, degree by degree.
export function chordTable(key: Key, style: ChordStyle): ChordTable {
  if (hasDiatonicChords(key.mode)) {
    return {
      stacked: true,
      kinds: KINDS,
      rows: KINDS.map((kind) => stackedRow(key, kind, style)),
    }
  }
  const degrees: ChordCell[][] = scaleNotes(key.tonic, key.mode).map(() => [])
  for (const c of chordsInScale(key)) {
    degrees[c.degree - 1].push(
      chordCell(key, { root: c.root, quality: c.quality }, style),
    )
  }
  return { stacked: false, degrees }
}

export type ChordDetail = {
  symbol: string
  notes: string[]
  description: string
  names: { symbol: string; omitted: string }[]
  inversions: {
    label: string
    symbol: string
    numeral: string
    voicing: string
  }[]
}

const TONE_NAMES: Record<number, string> = {
  1: 'root',
  2: '2nd',
  3: '3rd',
  4: '4th',
  5: '5th',
  6: '6th',
  7: '7th',
  9: '9th',
  11: '11th',
  13: '13th',
}

// Everything the core says about one chord in a key: its numeral line, every
// name for its notes, and each inversion with its numeral and a voicing.
export function chordDetail(
  key: Key,
  chord: ChordName,
  style: ChordStyle,
): ChordDetail {
  const notes = chordNotes(chord)
  return {
    symbol: chordSymbol(chord, { style }),
    notes: notes.map((n) => formatNote(n)),
    description: describeNumeral(key, romanNumeral(key, chord)),
    names: chordNames(notes, { key }).map((name) => ({
      symbol: chordSymbol(name, { style }),
      omitted: (name.omitted ?? []).map((n) => TONE_NAMES[n] ?? n).join(', '),
    })),
    inversions: inversions(chord).map((inv) => ({
      label: inversionName(inv.inversion),
      symbol: chordSymbol(inv.chord, { style }),
      numeral: romanNumeral(key, inv.chord).numeral,
      voicing: closeVoicing(inv.chord, 3)
        .map((n) => formatNote(n))
        .join(' '),
    })),
  }
}
