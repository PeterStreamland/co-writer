// Golden fixture: Roman numerals, written out by hand (SPEC 4). Never edit
// this to make a test pass: ask David.
// Keys and chords are typed in ASCII (# sharp, b flat, x double sharp) with
// chord-quality ids from chord-data.ts ('M' is a major triad). Numerals are
// written as displayed: measured from the major scale on the tonic, flats and
// sharps shown, ° diminished, ø half-diminished, + augmented.

// Triads and 7ths on every degree, for major, the three minors and the seven
// modes, all on C. Same rows as chordsOnC in diatonic-chords.ts.
export const numeralsOnC: Record<
  string,
  { triads: string[]; sevenths: string[] }
> = {
  major: {
    triads: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'],
    sevenths: ['Imaj7', 'ii7', 'iii7', 'IVmaj7', 'V7', 'vi7', 'viiø7'],
  },
  dorian: {
    triads: ['i', 'ii', '♭III', 'IV', 'v', 'vi°', '♭VII'],
    sevenths: ['i7', 'ii7', '♭IIImaj7', 'IV7', 'v7', 'viø7', '♭VIImaj7'],
  },
  phrygian: {
    triads: ['i', '♭II', '♭III', 'iv', 'v°', '♭VI', '♭vii'],
    sevenths: ['i7', '♭IImaj7', '♭III7', 'iv7', 'vø7', '♭VImaj7', '♭vii7'],
  },
  lydian: {
    triads: ['I', 'II', 'iii', '♯iv°', 'V', 'vi', 'vii'],
    sevenths: ['Imaj7', 'II7', 'iii7', '♯ivø7', 'Vmaj7', 'vi7', 'vii7'],
  },
  mixolydian: {
    triads: ['I', 'ii', 'iii°', 'IV', 'v', 'vi', '♭VII'],
    sevenths: ['I7', 'ii7', 'iiiø7', 'IVmaj7', 'v7', 'vi7', '♭VIImaj7'],
  },
  'natural-minor': {
    triads: ['i', 'ii°', '♭III', 'iv', 'v', '♭VI', '♭VII'],
    sevenths: ['i7', 'iiø7', '♭IIImaj7', 'iv7', 'v7', '♭VImaj7', '♭VII7'],
  },
  locrian: {
    triads: ['i°', '♭II', '♭iii', 'iv', '♭V', '♭VI', '♭vii'],
    sevenths: ['iø7', '♭IImaj7', '♭iii7', 'iv7', '♭Vmaj7', '♭VI7', '♭vii7'],
  },
  'harmonic-minor': {
    triads: ['i', 'ii°', '♭III+', 'iv', 'V', '♭VI', 'vii°'],
    sevenths: ['imaj7', 'iiø7', '♭III+maj7', 'iv7', 'V7', '♭VImaj7', 'vii°7'],
  },
  'melodic-minor': {
    triads: ['i', 'ii', '♭III+', 'IV', 'V', 'vi°', 'vii°'],
    sevenths: ['imaj7', 'ii7', '♭III+maj7', 'IV7', 'V7', 'viø7', 'viiø7'],
  },
}

// Modal and minor keys number from their own tonic (SPEC 4).
export const triadsInKey: { tonic: string; mode: string; triads: string[] }[] =
  [
    {
      tonic: 'E',
      mode: 'natural-minor',
      triads: ['i', 'ii°', '♭III', 'iv', 'v', '♭VI', '♭VII'],
    },
    {
      tonic: 'E',
      mode: 'dorian',
      triads: ['i', 'ii', '♭III', 'IV', 'v', 'vi°', '♭VII'],
    },
    {
      tonic: 'Ab',
      mode: 'natural-minor',
      triads: ['i', 'ii°', '♭III', 'iv', 'v', '♭VI', '♭VII'],
    },
  ]

export type NumeralCase = {
  tonic: string
  mode: string
  root: string
  quality: string
  bass?: string
  numeral: string
  // The slash form, where it differs from the default figures.
  slash?: string
  kind: 'diatonic' | 'secondary' | 'borrowed' | 'chromatic'
  // Borrowed chords: the source modes, closest first.
  sources?: string[]
}

export const numeralCases: NumeralCase[] = [
  // Diatonic, spelled by the key
  {
    tonic: 'E',
    mode: 'dorian',
    root: 'C#',
    quality: 'dim',
    numeral: 'vi°',
    kind: 'diatonic',
  },
  {
    tonic: 'E',
    mode: 'dorian',
    root: 'A',
    quality: 'M',
    numeral: 'IV',
    kind: 'diatonic',
  },
  {
    tonic: 'Ab',
    mode: 'natural-minor',
    root: 'Fb',
    quality: 'M',
    numeral: '♭VI',
    kind: 'diatonic',
  },
  {
    tonic: 'D#',
    mode: 'harmonic-minor',
    root: 'A#',
    quality: '7',
    numeral: 'V7',
    kind: 'diatonic',
  },
  {
    tonic: 'D#',
    mode: 'harmonic-minor',
    root: 'Cx',
    quality: 'dim7',
    numeral: 'vii°7',
    kind: 'diatonic',
  },

  // Extensions, sus, add and 6th chords
  {
    tonic: 'C',
    mode: 'major',
    root: 'G',
    quality: '13',
    numeral: 'V13',
    kind: 'diatonic',
  },
  {
    tonic: 'C',
    mode: 'major',
    root: 'F',
    quality: 'maj13#11',
    numeral: 'IVmaj13♯11',
    kind: 'diatonic',
  },
  {
    tonic: 'C',
    mode: 'major',
    root: 'D',
    quality: 'm9',
    numeral: 'ii9',
    kind: 'diatonic',
  },
  {
    tonic: 'C',
    mode: 'major',
    root: 'E',
    quality: 'm7b9',
    numeral: 'iii7♭9',
    kind: 'diatonic',
  },
  {
    tonic: 'C',
    mode: 'major',
    root: 'B',
    quality: 'm11b5b9b13',
    numeral: 'viiø11♭9♭13',
    kind: 'diatonic',
  },
  {
    tonic: 'A',
    mode: 'harmonic-minor',
    root: 'E',
    quality: '11b9b13',
    numeral: 'V11♭9♭13',
    kind: 'diatonic',
  },
  {
    tonic: 'C',
    mode: 'major',
    root: 'G',
    quality: 'sus4',
    numeral: 'Vsus4',
    kind: 'diatonic',
  },
  {
    tonic: 'C',
    mode: 'major',
    root: 'D',
    quality: '7sus4',
    numeral: 'ii7sus4',
    kind: 'diatonic',
  },
  // A 3rd-less chord takes the case of the key's own chord on its degree.
  {
    tonic: 'C',
    mode: 'major',
    root: 'D',
    quality: 'sus4',
    numeral: 'iisus4',
    kind: 'diatonic',
  },
  {
    tonic: 'C',
    mode: 'natural-minor',
    root: 'G',
    quality: 'sus4',
    numeral: 'vsus4',
    kind: 'diatonic',
  },
  {
    tonic: 'C',
    mode: 'natural-minor',
    root: 'G',
    quality: '7sus4',
    numeral: 'v7sus4',
    kind: 'diatonic',
  },
  // Scales that don't stack in thirds: the scale's own triad on the root
  // sets the case (David's choice). Lower only when every triad there is
  // minor or diminished; upper with none (A in E minor pentatonic) or with
  // both a major and a minor one (C in C major blues).
  {
    tonic: 'E',
    mode: 'minor-pentatonic',
    root: 'E',
    quality: '5',
    numeral: 'i5',
    kind: 'diatonic',
  },
  {
    tonic: 'E',
    mode: 'minor-pentatonic',
    root: 'G',
    quality: '5',
    numeral: '♭III5',
    kind: 'diatonic',
  },
  {
    tonic: 'E',
    mode: 'minor-pentatonic',
    root: 'A',
    quality: '5',
    numeral: 'IV5',
    kind: 'diatonic',
  },
  {
    tonic: 'E',
    mode: 'minor-pentatonic',
    root: 'E',
    quality: 'sus4',
    numeral: 'isus4',
    kind: 'diatonic',
  },
  {
    tonic: 'E',
    mode: 'minor-blues',
    root: 'E',
    quality: '5',
    numeral: 'i5',
    kind: 'diatonic',
  },
  {
    tonic: 'C',
    mode: 'major-blues',
    root: 'C',
    quality: '5',
    numeral: 'I5',
    kind: 'diatonic',
  },
  {
    tonic: 'A',
    mode: 'major-pentatonic',
    root: 'F#',
    quality: '5',
    numeral: 'vi5',
    kind: 'diatonic',
  },
  // On a degree with no chord in the key, upper case (SPEC 4's ♭VI5).
  {
    tonic: 'C',
    mode: 'major',
    root: 'Ab',
    quality: 'sus2',
    numeral: '♭VIsus2',
    kind: 'borrowed',
    sources: ['natural-minor', 'phrygian', 'locrian'],
  },
  {
    tonic: 'C',
    mode: 'major',
    root: 'C',
    quality: 'add9',
    numeral: 'Iadd9',
    kind: 'diatonic',
  },
  {
    tonic: 'C',
    mode: 'major',
    root: 'D',
    quality: 'm6',
    numeral: 'ii6',
    kind: 'diatonic',
  },

  // Secondary dominants and leading-note chords
  {
    tonic: 'C',
    mode: 'major',
    root: 'E',
    quality: '7',
    numeral: 'V7/vi',
    kind: 'secondary',
  },
  {
    tonic: 'C',
    mode: 'major',
    root: 'E',
    quality: 'M',
    numeral: 'V/vi',
    kind: 'secondary',
  },
  {
    tonic: 'C',
    mode: 'major',
    root: 'D',
    quality: 'M',
    numeral: 'V/V',
    kind: 'secondary',
  },
  {
    tonic: 'C',
    mode: 'major',
    root: 'D',
    quality: '7',
    numeral: 'V7/V',
    kind: 'secondary',
  },
  {
    tonic: 'C',
    mode: 'major',
    root: 'A',
    quality: '7',
    numeral: 'V7/ii',
    kind: 'secondary',
  },
  {
    tonic: 'C',
    mode: 'major',
    root: 'B',
    quality: '7',
    numeral: 'V7/iii',
    kind: 'secondary',
  },
  {
    tonic: 'C',
    mode: 'major',
    root: 'C',
    quality: '7',
    numeral: 'V7/IV',
    kind: 'secondary',
  },
  {
    tonic: 'C',
    mode: 'major',
    root: 'G#',
    quality: 'dim7',
    numeral: 'vii°7/vi',
    kind: 'secondary',
  },
  {
    tonic: 'C',
    mode: 'major',
    root: 'C#',
    quality: 'dim7',
    numeral: 'vii°7/ii',
    kind: 'secondary',
  },
  {
    tonic: 'C',
    mode: 'major',
    root: 'E',
    quality: '7#5',
    numeral: 'V+7/vi',
    kind: 'secondary',
  },
  {
    tonic: 'C',
    mode: 'major',
    root: 'F#',
    quality: 'dim',
    numeral: 'vii°/V',
    kind: 'secondary',
  },
  {
    tonic: 'C',
    mode: 'major',
    root: 'F#',
    quality: 'm7b5',
    numeral: 'viiø7/V',
    kind: 'secondary',
  },
  {
    tonic: 'E',
    mode: 'natural-minor',
    root: 'E',
    quality: '7',
    numeral: 'V7/iv',
    kind: 'secondary',
  },
  {
    tonic: 'E',
    mode: 'natural-minor',
    root: 'F#',
    quality: '7',
    numeral: 'V7/v',
    kind: 'secondary',
  },

  // Borrowed: the closest parallel mode first
  {
    tonic: 'C',
    mode: 'major',
    root: 'Bb',
    quality: 'M',
    numeral: '♭VII',
    kind: 'borrowed',
    sources: ['mixolydian', 'dorian', 'natural-minor'],
  },
  {
    tonic: 'C',
    mode: 'major',
    root: 'F',
    quality: 'm',
    numeral: 'iv',
    kind: 'borrowed',
    sources: ['natural-minor', 'phrygian', 'locrian'],
  },
  {
    tonic: 'C',
    mode: 'major',
    root: 'Ab',
    quality: 'M',
    numeral: '♭VI',
    kind: 'borrowed',
    sources: ['natural-minor', 'phrygian', 'locrian'],
  },
  {
    tonic: 'C',
    mode: 'major',
    root: 'Eb',
    quality: 'M',
    numeral: '♭III',
    kind: 'borrowed',
    sources: ['dorian', 'natural-minor', 'phrygian'],
  },
  {
    tonic: 'C',
    mode: 'major',
    root: 'Db',
    quality: 'M',
    numeral: '♭II',
    kind: 'borrowed',
    sources: ['phrygian', 'locrian'],
  },
  {
    tonic: 'C',
    mode: 'major',
    root: 'G',
    quality: 'm',
    numeral: 'v',
    kind: 'borrowed',
    sources: ['mixolydian', 'dorian', 'natural-minor'],
  },
  {
    tonic: 'C',
    mode: 'major',
    root: 'D',
    quality: 'm7b5',
    numeral: 'iiø7',
    kind: 'borrowed',
    sources: ['natural-minor'],
  },
  {
    tonic: 'C',
    mode: 'major',
    root: 'F',
    quality: 'm6',
    numeral: 'iv6',
    kind: 'borrowed',
    sources: ['natural-minor'],
  },
  // No major mode has B with A♭, so harmonic minor supplies it.
  {
    tonic: 'C',
    mode: 'major',
    root: 'B',
    quality: 'dim7',
    numeral: 'vii°7',
    kind: 'borrowed',
    sources: ['harmonic-minor'],
  },
  // A minor key looks to harmonic and melodic minor too.
  {
    tonic: 'E',
    mode: 'natural-minor',
    root: 'B',
    quality: '7',
    numeral: 'V7',
    kind: 'borrowed',
    sources: ['harmonic-minor', 'melodic-minor', 'major'],
  },
  {
    tonic: 'E',
    mode: 'natural-minor',
    root: 'A',
    quality: 'M',
    numeral: 'IV',
    kind: 'borrowed',
    sources: ['dorian', 'mixolydian', 'melodic-minor', 'major'],
  },
  // The Dorian IV, not V/♭VII: ♭VII is never a secondary target.
  {
    tonic: 'E',
    mode: 'natural-minor',
    root: 'A',
    quality: '7',
    numeral: 'IV7',
    kind: 'borrowed',
    sources: ['dorian', 'melodic-minor'],
  },
  {
    tonic: 'E',
    mode: 'natural-minor',
    root: 'F',
    quality: 'M',
    numeral: '♭II',
    kind: 'borrowed',
    sources: ['phrygian', 'locrian'],
  },
  {
    tonic: 'Ab',
    mode: 'natural-minor',
    root: 'Eb',
    quality: 'M',
    numeral: 'V',
    kind: 'borrowed',
    sources: ['harmonic-minor', 'melodic-minor', 'major', 'lydian'],
  },

  // A chord on the tonic comes from the parallel major or minor when that
  // holds it: the Picardy third.
  {
    tonic: 'E',
    mode: 'natural-minor',
    root: 'E',
    quality: 'M',
    numeral: 'I',
    kind: 'borrowed',
    sources: ['major', 'mixolydian', 'lydian'],
  },
  {
    tonic: 'C',
    mode: 'major',
    root: 'C',
    quality: 'm',
    numeral: 'i',
    kind: 'borrowed',
    sources: ['natural-minor', 'dorian', 'phrygian'],
  },

  // Chromatic: none of the above
  {
    tonic: 'C',
    mode: 'major',
    root: 'Db',
    quality: '7',
    numeral: '♭II7',
    kind: 'chromatic',
  },
  {
    tonic: 'C',
    mode: 'major',
    root: 'F#',
    quality: '7',
    numeral: '♯IV7',
    kind: 'chromatic',
  },
  {
    tonic: 'C',
    mode: 'major',
    root: 'C',
    quality: 'aug',
    numeral: 'I+',
    kind: 'chromatic',
  },

  // Inversions: figures by default, chord-tone slash as the option
  {
    tonic: 'C',
    mode: 'major',
    root: 'C',
    quality: 'M',
    bass: 'E',
    numeral: 'I⁶',
    slash: 'I/3',
    kind: 'diatonic',
  },
  {
    tonic: 'C',
    mode: 'major',
    root: 'C',
    quality: 'M',
    bass: 'G',
    numeral: 'I⁶₄',
    slash: 'I/5',
    kind: 'diatonic',
  },
  {
    tonic: 'C',
    mode: 'major',
    root: 'G',
    quality: '7',
    bass: 'B',
    numeral: 'V⁶₅',
    slash: 'V7/3',
    kind: 'diatonic',
  },
  {
    tonic: 'C',
    mode: 'major',
    root: 'G',
    quality: '7',
    bass: 'D',
    numeral: 'V⁴₃',
    slash: 'V7/5',
    kind: 'diatonic',
  },
  {
    tonic: 'C',
    mode: 'major',
    root: 'G',
    quality: '7',
    bass: 'F',
    numeral: 'V⁴₂',
    slash: 'V7/7',
    kind: 'diatonic',
  },
  {
    tonic: 'C',
    mode: 'major',
    root: 'B',
    quality: 'm7b5',
    bass: 'D',
    numeral: 'viiø⁶₅',
    slash: 'viiø7/3',
    kind: 'diatonic',
  },
  {
    tonic: 'C',
    mode: 'major',
    root: 'F',
    quality: 'maj7',
    bass: 'A',
    numeral: 'IVmaj⁶₅',
    slash: 'IVmaj7/3',
    kind: 'diatonic',
  },
  {
    tonic: 'C',
    mode: 'major',
    root: 'E',
    quality: '7',
    bass: 'G#',
    numeral: 'V⁶₅/vi',
    slash: '(V7/vi)/3',
    kind: 'secondary',
  },
  {
    tonic: 'C',
    mode: 'major',
    root: 'A',
    quality: 'm',
    bass: 'C',
    numeral: 'vi⁶',
    slash: 'vi/3',
    kind: 'diatonic',
  },
  // Chords with no figured-bass form use the slash in both styles.
  {
    tonic: 'C',
    mode: 'major',
    root: 'C',
    quality: 'sus4',
    bass: 'G',
    numeral: 'Isus4/5',
    kind: 'diatonic',
  },
  {
    tonic: 'C',
    mode: 'major',
    root: 'G',
    quality: '9',
    bass: 'B',
    numeral: 'V9/3',
    kind: 'diatonic',
  },
  {
    tonic: 'C',
    mode: 'major',
    root: 'C',
    quality: 'add9',
    bass: 'D',
    numeral: 'Iadd9/9',
    kind: 'diatonic',
  },

  // A bass outside the chord, shown as its degree in the key. It counts
  // towards the reading: the B♭ makes C/B♭ borrowed from C Mixolydian.
  {
    tonic: 'C',
    mode: 'major',
    root: 'F',
    quality: 'M',
    bass: 'G',
    numeral: 'IV (bass 5)',
    kind: 'diatonic',
  },
  {
    tonic: 'C',
    mode: 'major',
    root: 'C',
    quality: 'M',
    bass: 'Bb',
    numeral: 'I (bass ♭7)',
    kind: 'borrowed',
    sources: ['mixolydian'],
  },
  {
    tonic: 'C',
    mode: 'major',
    root: 'C',
    quality: 'M',
    bass: 'D',
    numeral: 'I (bass 2)',
    kind: 'diatonic',
  },
  {
    tonic: 'C',
    mode: 'major',
    root: 'F',
    quality: 'M',
    bass: 'F#',
    numeral: 'IV (bass ♯4)',
    kind: 'chromatic',
  },
]

// One-line ⓘ descriptions (SPEC 6.3).
export const numeralDescriptions: {
  tonic: string
  mode: string
  root: string
  quality: string
  text: string
}[] = [
  {
    tonic: 'C',
    mode: 'major',
    root: 'Ab',
    quality: 'M',
    text: '♭VI, borrowed from C Aeolian',
  },
  {
    tonic: 'C',
    mode: 'major',
    root: 'Bb',
    quality: 'M',
    text: '♭VII, borrowed from C Mixolydian',
  },
  {
    tonic: 'E',
    mode: 'natural-minor',
    root: 'B',
    quality: '7',
    text: 'V7, borrowed from E harmonic minor',
  },
  {
    tonic: 'E',
    mode: 'natural-minor',
    root: 'F',
    quality: 'M',
    text: '♭II, borrowed from E Phrygian',
  },
  {
    tonic: 'E',
    mode: 'natural-minor',
    root: 'E',
    quality: 'M',
    text: 'I, borrowed from E major',
  },
  {
    tonic: 'C',
    mode: 'major',
    root: 'E',
    quality: '7',
    text: 'V7/vi, secondary dominant of vi',
  },
  {
    tonic: 'C',
    mode: 'major',
    root: 'G#',
    quality: 'dim7',
    text: 'vii°7/vi, secondary leading-note chord of vi',
  },
  {
    tonic: 'C',
    mode: 'major',
    root: 'Db',
    quality: '7',
    text: '♭II7, chromatic in C major',
  },
  {
    tonic: 'E',
    mode: 'dorian',
    root: 'C#',
    quality: 'dim',
    text: 'vi°, diatonic in E Dorian',
  },
  {
    tonic: 'E',
    mode: 'natural-minor',
    root: 'G',
    quality: 'M',
    text: '♭III, diatonic in E minor',
  },
  {
    tonic: 'A',
    mode: 'harmonic-minor',
    root: 'E',
    quality: '7',
    text: 'V7, diatonic in A harmonic minor',
  },
]
