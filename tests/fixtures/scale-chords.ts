// Golden fixture: chords for scales that don't stack in thirds, written out by
// hand. Never edit this to make a test pass: ask David.
// ASCII accidentals: # sharp, b flat, ## double sharp, bb double flat. Chord
// symbols are lead-sheet plain (SPEC 4).
//
// Policy (Phase 1 task 4): every dictionary chord whose notes all sit in the
// scale by pitch, rooted on each scale note and spelled from that root. Chords
// are listed per degree, in dictionary order: triads, 7ths, then sus, add and
// 6th chords, then the chords task 6 added (power chords, 7b5, 6/9, m6/9 and
// 9sus4; David agreed these scales show them). A degree with no chord has an
// empty list.

export const scaleChords: {
  tonic: string
  mode: string
  degrees: string[][]
}[] = [
  {
    tonic: 'C',
    mode: 'major-pentatonic',
    degrees: [
      ['C', 'Csus2', 'Cadd9', 'C6', 'C5', 'C6/9'],
      ['Dsus2', 'Dsus4', 'D7sus4', 'D5', 'D9sus4'],
      [],
      ['Gsus2', 'Gsus4', 'G5'],
      ['Am', 'Am7', 'Asus4', 'A7sus4', 'Amadd11', 'A5'],
    ],
  },
  {
    tonic: 'A',
    mode: 'minor-pentatonic',
    degrees: [
      ['Am', 'Am7', 'Asus4', 'A7sus4', 'Amadd11', 'A5'],
      ['C', 'Csus2', 'Cadd9', 'C6', 'C5', 'C6/9'],
      ['Dsus2', 'Dsus4', 'D7sus4', 'D5', 'D9sus4'],
      [],
      ['Gsus2', 'Gsus4', 'G5'],
    ],
  },
  {
    tonic: 'C',
    mode: 'minor-blues',
    degrees: [
      ['Cm', 'Cdim', 'Cm7', 'Cm7b5', 'Csus4', 'C7sus4', 'Cmadd11', 'C5'],
      [
        'Eb',
        'Ebm',
        'Ebsus2',
        'Ebadd9',
        'Ebmadd9',
        'Eb6',
        'Ebm6',
        'Eb5',
        'Eb6/9',
        'Ebm6/9',
      ],
      ['Fsus2', 'Fsus4', 'F7sus4', 'F5', 'F9sus4'],
      [],
      [],
      ['Bbsus2', 'Bbsus4', 'Bb5'],
    ],
  },
  {
    tonic: 'C',
    mode: 'whole-tone',
    degrees: [
      ['Caug', 'C7#5', 'C7b5'],
      ['Daug', 'D7#5', 'D7b5'],
      ['Eaug', 'E7#5', 'E7b5'],
      ['F#aug', 'F#7#5', 'F#7b5'],
      ['G#aug', 'G#7#5', 'G#7b5'],
      ['A#aug', 'A#7#5', 'A#7b5'],
    ],
  },
  {
    tonic: 'C',
    mode: 'diminished-half-whole',
    degrees: [
      [
        'C',
        'Cm',
        'Cdim',
        'C7',
        'Cm7',
        'Cm7b5',
        'Cdim7',
        'C6',
        'Cm6',
        'C5',
        'C7b5',
      ],
      ['Dbdim', 'Dbdim7'],
      [
        'Eb',
        'Ebm',
        'Ebdim',
        'Eb7',
        'Ebm7',
        'Ebm7b5',
        'Ebdim7',
        'Eb6',
        'Ebm6',
        'Eb5',
        'Eb7b5',
      ],
      ['Edim', 'Edim7'],
      [
        'F#',
        'F#m',
        'F#dim',
        'F#7',
        'F#m7',
        'F#m7b5',
        'F#dim7',
        'F#6',
        'F#m6',
        'F#5',
        'F#7b5',
      ],
      ['Gdim', 'Gdim7'],
      [
        'A',
        'Am',
        'Adim',
        'A7',
        'Am7',
        'Am7b5',
        'Adim7',
        'A6',
        'Am6',
        'A5',
        'A7b5',
      ],
      ['Bbdim', 'Bbdim7'],
    ],
  },
  // Seven notes, but its "thirds" include a diminished 3rd (F# to Ab), so it
  // uses this policy rather than stacking thirds.
  {
    tonic: 'C',
    mode: 'hungarian-minor',
    degrees: [
      ['Cm', 'Cdim', 'CmMaj7', 'Csus2', 'Cmadd9', 'C5'],
      ['D7b5'],
      ['Ebaug', 'Ebmaj7#5'],
      [],
      ['G', 'Gaug', 'Gmaj7', 'Gmaj7#5', 'Gsus4', 'Gmaj7sus4', 'Gadd11', 'G5'],
      [
        'Ab',
        'Abm',
        'Abdim',
        'Abmaj7',
        'Ab7',
        'Abm7',
        'Abm7b5',
        'AbmMaj7',
        'Ab5',
        'Ab7b5',
      ],
      ['B', 'Bm', 'Baug', 'B6', 'Bm6', 'B5'],
    ],
  },
]

// Chord tones are spelled from the chord's root, not copied from the scale,
// so a chord name always matches its notes.
export const spelledScaleChords: {
  tonic: string
  mode: string
  symbol: string
  notes: string[]
}[] = [
  {
    tonic: 'C',
    mode: 'whole-tone',
    symbol: 'C7#5',
    notes: ['C', 'E', 'G#', 'Bb'],
  },
  {
    tonic: 'C',
    mode: 'whole-tone',
    symbol: 'E7#5',
    notes: ['E', 'G#', 'B#', 'D'],
  },
  {
    tonic: 'C',
    mode: 'diminished-half-whole',
    symbol: 'Cdim7',
    notes: ['C', 'Eb', 'Gb', 'Bbb'],
  },
  {
    tonic: 'C',
    mode: 'minor-blues',
    symbol: 'Ebm6',
    notes: ['Eb', 'Gb', 'Bb', 'C'],
  },
  {
    tonic: 'C',
    mode: 'major-pentatonic',
    symbol: 'Cadd9',
    notes: ['C', 'E', 'G', 'D'],
  },
  {
    tonic: 'C',
    mode: 'hungarian-minor',
    symbol: 'Abm',
    notes: ['Ab', 'Cb', 'Eb'],
  },
  {
    tonic: 'C',
    mode: 'hungarian-minor',
    symbol: 'Gaug',
    notes: ['G', 'B', 'D#'],
  },
]
