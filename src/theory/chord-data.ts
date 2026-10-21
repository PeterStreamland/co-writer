// The chord-quality dictionary and diatonic chord shapes, as data. Ids are
// lead-sheet plain symbols in ASCII (SPEC 4), which is what ChordEvent.quality
// stores (SPEC 12); only the major triad differs, with id 'M' and no symbol.
// Phase 1 task 6 widens the dictionary for the chord-symbol parser.

export type ChordQualityData = {
  id: string
  symbol: string
  name: string
  intervals: string[]
  // A 7th chord that 9th, 11th and 13th chords extend: the symbol's prefix
  // before the number, and the alterations that follow it (m7b5 → Cm9b5).
  extends?: { prefix: string; alterations: string[] }
  // Roman-numeral form: upper case (I) or lower (i), and what follows it
  // (ø7 for viiø7). A 3rd-less chord is upper case, as SPEC 4's ♭VI5. An
  // extended chord takes its 7th chord's suffix with the 7 replaced (V13).
  numeral: { upper: boolean; suffix: string }
  // A chord that can tonicise another: a dominant a 5th above its target,
  // or a leading-note chord a semitone below it (V/vi, vii°7/V).
  secondary?: 'dominant' | 'leading-note'
}

export const CHORD_QUALITIES: ChordQualityData[] = [
  // Triads
  {
    id: 'M',
    symbol: '',
    name: 'major',
    intervals: ['P1', 'M3', 'P5'],
    numeral: { upper: true, suffix: '' },
    secondary: 'dominant',
  },
  {
    id: 'm',
    symbol: 'm',
    name: 'minor',
    intervals: ['P1', 'm3', 'P5'],
    numeral: { upper: false, suffix: '' },
  },
  {
    id: 'dim',
    symbol: 'dim',
    name: 'diminished',
    intervals: ['P1', 'm3', 'd5'],
    numeral: { upper: false, suffix: '°' },
    secondary: 'leading-note',
  },
  {
    id: 'aug',
    symbol: 'aug',
    name: 'augmented',
    intervals: ['P1', 'M3', 'A5'],
    numeral: { upper: true, suffix: '+' },
  },

  // 7th chords
  {
    id: 'maj7',
    symbol: 'maj7',
    name: 'major 7th',
    intervals: ['P1', 'M3', 'P5', 'M7'],
    extends: { prefix: 'maj', alterations: [] },
    numeral: { upper: true, suffix: 'maj7' },
  },
  {
    id: '7',
    symbol: '7',
    name: 'dominant 7th',
    intervals: ['P1', 'M3', 'P5', 'm7'],
    extends: { prefix: '', alterations: [] },
    numeral: { upper: true, suffix: '7' },
    secondary: 'dominant',
  },
  {
    id: 'm7',
    symbol: 'm7',
    name: 'minor 7th',
    intervals: ['P1', 'm3', 'P5', 'm7'],
    extends: { prefix: 'm', alterations: [] },
    numeral: { upper: false, suffix: '7' },
  },
  {
    id: 'm7b5',
    symbol: 'm7b5',
    name: 'half-diminished 7th',
    intervals: ['P1', 'm3', 'd5', 'm7'],
    extends: { prefix: 'm', alterations: ['b5'] },
    numeral: { upper: false, suffix: 'ø7' },
    secondary: 'leading-note',
  },
  {
    id: 'dim7',
    symbol: 'dim7',
    name: 'diminished 7th',
    intervals: ['P1', 'm3', 'd5', 'd7'],
    extends: { prefix: 'dim', alterations: [] },
    numeral: { upper: false, suffix: '°7' },
    secondary: 'leading-note',
  },
  {
    id: 'mMaj7',
    symbol: 'mMaj7',
    name: 'minor-major 7th',
    intervals: ['P1', 'm3', 'P5', 'M7'],
    extends: { prefix: 'mMaj', alterations: [] },
    numeral: { upper: false, suffix: 'maj7' },
  },
  {
    id: 'maj7#5',
    symbol: 'maj7#5',
    name: 'augmented major 7th',
    intervals: ['P1', 'M3', 'A5', 'M7'],
    extends: { prefix: 'maj', alterations: ['#5'] },
    numeral: { upper: true, suffix: '+maj7' },
  },
  {
    id: '7#5',
    symbol: '7#5',
    name: 'augmented 7th',
    intervals: ['P1', 'M3', 'A5', 'm7'],
    extends: { prefix: '', alterations: ['#5'] },
    numeral: { upper: true, suffix: '+7' },
    secondary: 'dominant',
  },

  // Sus, add and 6th chords
  {
    id: 'sus2',
    symbol: 'sus2',
    name: 'sus2',
    intervals: ['P1', 'M2', 'P5'],
    numeral: { upper: true, suffix: 'sus2' },
  },
  {
    id: 'sus4',
    symbol: 'sus4',
    name: 'sus4',
    intervals: ['P1', 'P4', 'P5'],
    numeral: { upper: true, suffix: 'sus4' },
  },
  {
    id: '7sus4',
    symbol: '7sus4',
    name: 'dominant 7th sus4',
    intervals: ['P1', 'P4', 'P5', 'm7'],
    numeral: { upper: true, suffix: '7sus4' },
  },
  {
    id: 'maj7sus4',
    symbol: 'maj7sus4',
    name: 'major 7th sus4',
    intervals: ['P1', 'P4', 'P5', 'M7'],
    numeral: { upper: true, suffix: 'maj7sus4' },
  },
  {
    id: 'add9',
    symbol: 'add9',
    name: 'major add9',
    intervals: ['P1', 'M3', 'P5', 'M9'],
    numeral: { upper: true, suffix: 'add9' },
  },
  {
    id: 'madd9',
    symbol: 'madd9',
    name: 'minor add9',
    intervals: ['P1', 'm3', 'P5', 'M9'],
    numeral: { upper: false, suffix: 'add9' },
  },
  {
    id: 'add11',
    symbol: 'add11',
    name: 'major add11',
    intervals: ['P1', 'M3', 'P5', 'P11'],
    numeral: { upper: true, suffix: 'add11' },
  },
  {
    id: 'madd11',
    symbol: 'madd11',
    name: 'minor add11',
    intervals: ['P1', 'm3', 'P5', 'P11'],
    numeral: { upper: false, suffix: 'add11' },
  },
  {
    id: '6',
    symbol: '6',
    name: 'major 6th',
    intervals: ['P1', 'M3', 'P5', 'M6'],
    numeral: { upper: true, suffix: '6' },
  },
  {
    id: 'm6',
    symbol: 'm6',
    name: 'minor 6th',
    intervals: ['P1', 'm3', 'P5', 'M6'],
    numeral: { upper: false, suffix: '6' },
  },
]

// Which scale steps above the chord's root each kind of diatonic chord takes:
// a triad is steps 1, 3 and 5; sus2 replaces the 3rd with the 2nd.
export const DIATONIC_SHAPES = {
  triad: [1, 3, 5],
  seventh: [1, 3, 5, 7],
  ninth: [1, 3, 5, 7, 9],
  eleventh: [1, 3, 5, 7, 9, 11],
  thirteenth: [1, 3, 5, 7, 9, 11, 13],
  sus2: [1, 2, 5],
  sus4: [1, 4, 5],
  '7sus4': [1, 4, 5, 7],
  add9: [1, 3, 5, 9],
  add11: [1, 3, 5, 11],
  '6': [1, 3, 5, 6],
} as const satisfies Record<string, readonly number[]>
