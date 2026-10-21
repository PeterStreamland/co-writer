// The chord-quality dictionary and diatonic chord shapes, as data. Ids are
// lead-sheet plain symbols in ASCII (SPEC 4), which is what ChordEvent.quality
// stores (SPEC 12); only the major triad differs, with id 'M' and no symbol.
// Each quality also has its jazz symbol (C△7, C–7, Cø7) and any other typed
// forms the parser accepts (chord-symbol.ts reads ♭, ♯, △ and the jazz
// prefixes itself, so aliases only list whole spellings it can't derive).

export type ChordQualityData = {
  id: string
  symbol: string
  jazz: string
  aliases?: string[]
  name: string
  intervals: string[]
  // A 7th chord that 9th, 11th and 13th chords extend: the symbol's prefix
  // before the number, and the alterations that follow it (m7b5 → Cm9b5).
  extends?: { prefix: string; alterations: string[] }
  // Roman-numeral form: upper case (I) or lower (i), and what follows it
  // (ø7 for viiø7). A 3rd-less chord takes the case of the key's own chord on
  // its degree ('key': ii7sus4 in C), or upper case off the scale (♭VI5). An
  // extended chord takes its 7th chord's suffix with the 7 replaced (V13), as
  // its symbols do (C13, C△13).
  numeral: { upper: boolean | 'key'; suffix: string }
  // A chord that can tonicise another: a dominant a 5th above its target,
  // or a leading-note chord a semitone below it (V/vi, vii°7/V).
  secondary?: 'dominant' | 'leading-note'
}

export const CHORD_QUALITIES: ChordQualityData[] = [
  // Triads
  {
    id: 'M',
    symbol: '',
    jazz: '',
    name: 'major',
    intervals: ['P1', 'M3', 'P5'],
    numeral: { upper: true, suffix: '' },
    secondary: 'dominant',
  },
  {
    id: 'm',
    symbol: 'm',
    jazz: '–',
    name: 'minor',
    intervals: ['P1', 'm3', 'P5'],
    numeral: { upper: false, suffix: '' },
  },
  {
    id: 'dim',
    symbol: 'dim',
    jazz: '°',
    name: 'diminished',
    intervals: ['P1', 'm3', 'd5'],
    numeral: { upper: false, suffix: '°' },
    secondary: 'leading-note',
  },
  {
    id: 'aug',
    symbol: 'aug',
    jazz: '+',
    name: 'augmented',
    intervals: ['P1', 'M3', 'A5'],
    numeral: { upper: true, suffix: '+' },
  },

  // 7th chords
  {
    id: 'maj7',
    symbol: 'maj7',
    jazz: '△7',
    name: 'major 7th',
    intervals: ['P1', 'M3', 'P5', 'M7'],
    extends: { prefix: 'maj', alterations: [] },
    numeral: { upper: true, suffix: 'maj7' },
  },
  {
    id: '7',
    symbol: '7',
    jazz: '7',
    name: 'dominant 7th',
    intervals: ['P1', 'M3', 'P5', 'm7'],
    extends: { prefix: '', alterations: [] },
    numeral: { upper: true, suffix: '7' },
    secondary: 'dominant',
  },
  {
    id: 'm7',
    symbol: 'm7',
    jazz: '–7',
    name: 'minor 7th',
    intervals: ['P1', 'm3', 'P5', 'm7'],
    extends: { prefix: 'm', alterations: [] },
    numeral: { upper: false, suffix: '7' },
  },
  {
    id: 'm7b5',
    symbol: 'm7b5',
    jazz: 'ø7',
    name: 'half-diminished 7th',
    intervals: ['P1', 'm3', 'd5', 'm7'],
    extends: { prefix: 'm', alterations: ['b5'] },
    numeral: { upper: false, suffix: 'ø7' },
    secondary: 'leading-note',
  },
  {
    id: 'dim7',
    symbol: 'dim7',
    jazz: '°7',
    name: 'diminished 7th',
    intervals: ['P1', 'm3', 'd5', 'd7'],
    extends: { prefix: 'dim', alterations: [] },
    numeral: { upper: false, suffix: '°7' },
    secondary: 'leading-note',
  },
  {
    id: 'mMaj7',
    symbol: 'mMaj7',
    jazz: '–△7',
    name: 'minor-major 7th',
    intervals: ['P1', 'm3', 'P5', 'M7'],
    extends: { prefix: 'mMaj', alterations: [] },
    numeral: { upper: false, suffix: 'maj7' },
  },
  {
    id: 'maj7#5',
    symbol: 'maj7#5',
    jazz: '+△7',
    name: 'augmented major 7th',
    intervals: ['P1', 'M3', 'A5', 'M7'],
    extends: { prefix: 'maj', alterations: ['#5'] },
    numeral: { upper: true, suffix: '+maj7' },
  },
  {
    id: '7#5',
    symbol: '7#5',
    jazz: '+7',
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
    jazz: 'sus2',
    name: 'sus2',
    intervals: ['P1', 'M2', 'P5'],
    numeral: { upper: 'key', suffix: 'sus2' },
  },
  {
    id: 'sus4',
    symbol: 'sus4',
    jazz: 'sus4',
    aliases: ['sus'],
    name: 'sus4',
    intervals: ['P1', 'P4', 'P5'],
    numeral: { upper: 'key', suffix: 'sus4' },
  },
  {
    id: '7sus4',
    symbol: '7sus4',
    jazz: '7sus4',
    aliases: ['7sus'],
    name: 'dominant 7th sus4',
    intervals: ['P1', 'P4', 'P5', 'm7'],
    numeral: { upper: 'key', suffix: '7sus4' },
  },
  {
    id: 'maj7sus4',
    symbol: 'maj7sus4',
    jazz: '△7sus4',
    name: 'major 7th sus4',
    intervals: ['P1', 'P4', 'P5', 'M7'],
    numeral: { upper: 'key', suffix: 'maj7sus4' },
  },
  {
    id: 'add9',
    symbol: 'add9',
    jazz: 'add9',
    name: 'major add9',
    intervals: ['P1', 'M3', 'P5', 'M9'],
    numeral: { upper: true, suffix: 'add9' },
  },
  {
    id: 'madd9',
    symbol: 'madd9',
    jazz: '–add9',
    name: 'minor add9',
    intervals: ['P1', 'm3', 'P5', 'M9'],
    numeral: { upper: false, suffix: 'add9' },
  },
  {
    id: 'add11',
    symbol: 'add11',
    jazz: 'add11',
    name: 'major add11',
    intervals: ['P1', 'M3', 'P5', 'P11'],
    numeral: { upper: true, suffix: 'add11' },
  },
  {
    id: 'madd11',
    symbol: 'madd11',
    jazz: '–add11',
    name: 'minor add11',
    intervals: ['P1', 'm3', 'P5', 'P11'],
    numeral: { upper: false, suffix: 'add11' },
  },
  {
    id: '6',
    symbol: '6',
    jazz: '6',
    aliases: ['maj6'],
    name: 'major 6th',
    intervals: ['P1', 'M3', 'P5', 'M6'],
    numeral: { upper: true, suffix: '6' },
  },
  {
    id: 'm6',
    symbol: 'm6',
    jazz: '–6',
    name: 'minor 6th',
    intervals: ['P1', 'm3', 'P5', 'M6'],
    numeral: { upper: false, suffix: '6' },
  },

  // Power chord, 7♭5 and 6/9 chords
  {
    id: '5',
    symbol: '5',
    jazz: '5',
    name: 'power chord',
    intervals: ['P1', 'P5'],
    numeral: { upper: 'key', suffix: '5' },
  },
  {
    id: '7b5',
    symbol: '7b5',
    jazz: '7b5',
    name: 'dominant 7th flat 5',
    intervals: ['P1', 'M3', 'd5', 'm7'],
    extends: { prefix: '', alterations: ['b5'] },
    numeral: { upper: true, suffix: '7♭5' },
    secondary: 'dominant',
  },
  {
    id: '6/9',
    symbol: '6/9',
    jazz: '6/9',
    aliases: ['69', '6add9'],
    name: 'major 6/9',
    intervals: ['P1', 'M3', 'P5', 'M6', 'M9'],
    numeral: { upper: true, suffix: '6/9' },
  },
  {
    id: 'm6/9',
    symbol: 'm6/9',
    jazz: '–6/9',
    aliases: ['m69', 'm6add9'],
    name: 'minor 6/9',
    intervals: ['P1', 'm3', 'P5', 'M6', 'M9'],
    numeral: { upper: false, suffix: '6/9' },
  },
  {
    id: '9sus4',
    symbol: '9sus4',
    jazz: '9sus4',
    aliases: ['9sus'],
    name: 'dominant 9th sus4',
    intervals: ['P1', 'P4', 'P5', 'm7', 'M9'],
    numeral: { upper: 'key', suffix: '9sus4' },
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
