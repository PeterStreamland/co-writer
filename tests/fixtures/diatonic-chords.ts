// Golden fixture: diatonic chords stacked in thirds from each scale degree,
// written out by hand. Never edit this to make a test pass: ask David.
// ASCII accidentals: # sharp, b flat, ## double sharp. Chord symbols are
// lead-sheet plain (SPEC 4): Cmaj7, Cm7, Cm7b5, Cdim7, Caug.

// Triads and 7ths on every degree, for major, the three minors and the seven
// modes, all on C.
export const chordsOnC: Record<
  string,
  { triads: string[]; sevenths: string[] }
> = {
  major: {
    triads: ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'Bdim'],
    sevenths: ['Cmaj7', 'Dm7', 'Em7', 'Fmaj7', 'G7', 'Am7', 'Bm7b5'],
  },
  dorian: {
    triads: ['Cm', 'Dm', 'Eb', 'F', 'Gm', 'Adim', 'Bb'],
    sevenths: ['Cm7', 'Dm7', 'Ebmaj7', 'F7', 'Gm7', 'Am7b5', 'Bbmaj7'],
  },
  phrygian: {
    triads: ['Cm', 'Db', 'Eb', 'Fm', 'Gdim', 'Ab', 'Bbm'],
    sevenths: ['Cm7', 'Dbmaj7', 'Eb7', 'Fm7', 'Gm7b5', 'Abmaj7', 'Bbm7'],
  },
  lydian: {
    triads: ['C', 'D', 'Em', 'F#dim', 'G', 'Am', 'Bm'],
    sevenths: ['Cmaj7', 'D7', 'Em7', 'F#m7b5', 'Gmaj7', 'Am7', 'Bm7'],
  },
  mixolydian: {
    triads: ['C', 'Dm', 'Edim', 'F', 'Gm', 'Am', 'Bb'],
    sevenths: ['C7', 'Dm7', 'Em7b5', 'Fmaj7', 'Gm7', 'Am7', 'Bbmaj7'],
  },
  'natural-minor': {
    triads: ['Cm', 'Ddim', 'Eb', 'Fm', 'Gm', 'Ab', 'Bb'],
    sevenths: ['Cm7', 'Dm7b5', 'Ebmaj7', 'Fm7', 'Gm7', 'Abmaj7', 'Bb7'],
  },
  locrian: {
    triads: ['Cdim', 'Db', 'Ebm', 'Fm', 'Gb', 'Ab', 'Bbm'],
    sevenths: ['Cm7b5', 'Dbmaj7', 'Ebm7', 'Fm7', 'Gbmaj7', 'Ab7', 'Bbm7'],
  },
  'harmonic-minor': {
    triads: ['Cm', 'Ddim', 'Ebaug', 'Fm', 'G', 'Ab', 'Bdim'],
    sevenths: ['CmMaj7', 'Dm7b5', 'Ebmaj7#5', 'Fm7', 'G7', 'Abmaj7', 'Bdim7'],
  },
  'melodic-minor': {
    triads: ['Cm', 'Dm', 'Ebaug', 'F', 'G', 'Adim', 'Bdim'],
    sevenths: ['CmMaj7', 'Dm7', 'Ebmaj7#5', 'F7', 'G7', 'Am7b5', 'Bm7b5'],
  },
}

// 9th, 11th and 13th chords. The number is the highest unaltered extension;
// altered ones follow it (Fmaj13#11, Em11b9b13).
export const extendedChords: {
  tonic: string
  mode: string
  ninths: string[]
  elevenths: string[]
  thirteenths: string[]
}[] = [
  {
    tonic: 'C',
    mode: 'major',
    ninths: ['Cmaj9', 'Dm9', 'Em7b9', 'Fmaj9', 'G9', 'Am9', 'Bm7b5b9'],
    elevenths: [
      'Cmaj11',
      'Dm11',
      'Em11b9',
      'Fmaj9#11',
      'G11',
      'Am11',
      'Bm11b5b9',
    ],
    thirteenths: [
      'Cmaj13',
      'Dm13',
      'Em11b9b13',
      'Fmaj13#11',
      'G13',
      'Am11b13',
      'Bm11b5b9b13',
    ],
  },
  {
    tonic: 'A',
    mode: 'harmonic-minor',
    ninths: [
      'AmMaj9',
      'Bm7b5b9',
      'Cmaj9#5',
      'Dm9',
      'E7b9',
      'Fmaj7#9',
      'G#dim7b9',
    ],
    elevenths: [
      'AmMaj11',
      'Bm11b5b9',
      'Cmaj11#5',
      'Dm9#11',
      'E11b9',
      'Fmaj7#9#11',
      'G#dim7b9b11',
    ],
    thirteenths: [
      'AmMaj11b13',
      'Bm13b5b9',
      'Cmaj13#5',
      'Dm13#11',
      'E11b9b13',
      'Fmaj13#9#11',
      'G#dim7b9b11b13',
    ],
  },
]

// Sus, add and 6th chords on each degree. A degree is left out when the shape
// isn't a dictionary chord there (no Fsus4 in C major: C major has B, not Bb).
export const susAndAddChords: {
  tonic: string
  mode: string
  chords: Record<string, string[]>
}[] = [
  {
    tonic: 'C',
    mode: 'major',
    chords: {
      sus2: ['Csus2', 'Dsus2', 'Fsus2', 'Gsus2', 'Asus2'],
      sus4: ['Csus4', 'Dsus4', 'Esus4', 'Gsus4', 'Asus4'],
      '7sus4': ['D7sus4', 'E7sus4', 'G7sus4', 'A7sus4'],
      add9: ['Cadd9', 'Dmadd9', 'Fadd9', 'Gadd9', 'Amadd9'],
      add11: ['Cadd11', 'Dmadd11', 'Emadd11', 'Gadd11', 'Amadd11'],
      '6': ['C6', 'Dm6', 'F6', 'G6'],
    },
  },
  {
    tonic: 'A',
    mode: 'harmonic-minor',
    chords: {
      sus2: ['Asus2', 'Dsus2'],
      sus4: ['Asus4', 'Esus4'],
      '7sus4': ['E7sus4'],
      add9: ['Amadd9', 'Dmadd9'],
      add11: ['Amadd11', 'Eadd11'],
      '6': ['Dm6', 'F6'],
    },
  },
]

// Chords spelled in awkward keys: functional spelling stands (SPEC 4 and 13).
export const spelledChords: {
  tonic: string
  mode: string
  kind: string
  degree: number
  symbol: string
  notes: string[]
}[] = [
  {
    tonic: 'Ab',
    mode: 'natural-minor',
    kind: 'triad',
    degree: 6,
    symbol: 'Fb',
    notes: ['Fb', 'Ab', 'Cb'],
  },
  {
    tonic: 'Ab',
    mode: 'natural-minor',
    kind: 'seventh',
    degree: 6,
    symbol: 'Fbmaj7',
    notes: ['Fb', 'Ab', 'Cb', 'Eb'],
  },
  {
    tonic: 'D#',
    mode: 'harmonic-minor',
    kind: 'seventh',
    degree: 5,
    symbol: 'A#7',
    notes: ['A#', 'C##', 'E#', 'G#'],
  },
  {
    tonic: 'D#',
    mode: 'harmonic-minor',
    kind: 'seventh',
    degree: 7,
    symbol: 'C##dim7',
    notes: ['C##', 'E#', 'G#', 'B'],
  },
  {
    tonic: 'F#',
    mode: 'major',
    kind: 'triad',
    degree: 7,
    symbol: 'E#dim',
    notes: ['E#', 'G#', 'B'],
  },
  {
    tonic: 'Cb',
    mode: 'major',
    kind: 'triad',
    degree: 4,
    symbol: 'Fb',
    notes: ['Fb', 'Ab', 'Cb'],
  },
  {
    tonic: 'E',
    mode: 'dorian',
    kind: 'triad',
    degree: 6,
    symbol: 'C#dim',
    notes: ['C#', 'E', 'G'],
  },
  {
    tonic: 'E',
    mode: 'dorian',
    kind: 'seventh',
    degree: 6,
    symbol: 'C#m7b5',
    notes: ['C#', 'E', 'G', 'B'],
  },
  {
    tonic: 'G#',
    mode: 'melodic-minor',
    kind: 'seventh',
    degree: 3,
    symbol: 'Bmaj7#5',
    notes: ['B', 'D#', 'F##', 'A#'],
  },
  {
    tonic: 'C',
    mode: 'major',
    kind: 'thirteenth',
    degree: 5,
    symbol: 'G13',
    notes: ['G', 'B', 'D', 'F', 'A', 'C', 'E'],
  },
  {
    tonic: 'Eb',
    mode: 'major',
    kind: 'eleventh',
    degree: 4,
    symbol: 'Abmaj9#11',
    notes: ['Ab', 'C', 'Eb', 'G', 'Bb', 'D'],
  },
  {
    tonic: 'C',
    mode: 'major',
    kind: 'sus2',
    degree: 2,
    symbol: 'Dsus2',
    notes: ['D', 'E', 'A'],
  },
]
