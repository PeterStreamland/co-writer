// Golden fixture: the 30 key signatures, written out by hand.
// Never edit this to make a test pass: ask David.
// ASCII accidentals: # sharp, b flat, ## double sharp.
// signature: number of sharps (positive) or flats (negative).

export type KeyFixture = { tonic: string; signature: number; scale: string[] }

export const majorKeys: KeyFixture[] = [
  { tonic: 'C', signature: 0, scale: ['C', 'D', 'E', 'F', 'G', 'A', 'B'] },
  { tonic: 'G', signature: 1, scale: ['G', 'A', 'B', 'C', 'D', 'E', 'F#'] },
  { tonic: 'D', signature: 2, scale: ['D', 'E', 'F#', 'G', 'A', 'B', 'C#'] },
  { tonic: 'A', signature: 3, scale: ['A', 'B', 'C#', 'D', 'E', 'F#', 'G#'] },
  { tonic: 'E', signature: 4, scale: ['E', 'F#', 'G#', 'A', 'B', 'C#', 'D#'] },
  { tonic: 'B', signature: 5, scale: ['B', 'C#', 'D#', 'E', 'F#', 'G#', 'A#'] },
  {
    tonic: 'F#',
    signature: 6,
    scale: ['F#', 'G#', 'A#', 'B', 'C#', 'D#', 'E#'],
  },
  {
    tonic: 'C#',
    signature: 7,
    scale: ['C#', 'D#', 'E#', 'F#', 'G#', 'A#', 'B#'],
  },
  { tonic: 'F', signature: -1, scale: ['F', 'G', 'A', 'Bb', 'C', 'D', 'E'] },
  { tonic: 'Bb', signature: -2, scale: ['Bb', 'C', 'D', 'Eb', 'F', 'G', 'A'] },
  { tonic: 'Eb', signature: -3, scale: ['Eb', 'F', 'G', 'Ab', 'Bb', 'C', 'D'] },
  {
    tonic: 'Ab',
    signature: -4,
    scale: ['Ab', 'Bb', 'C', 'Db', 'Eb', 'F', 'G'],
  },
  {
    tonic: 'Db',
    signature: -5,
    scale: ['Db', 'Eb', 'F', 'Gb', 'Ab', 'Bb', 'C'],
  },
  {
    tonic: 'Gb',
    signature: -6,
    scale: ['Gb', 'Ab', 'Bb', 'Cb', 'Db', 'Eb', 'F'],
  },
  {
    tonic: 'Cb',
    signature: -7,
    scale: ['Cb', 'Db', 'Eb', 'Fb', 'Gb', 'Ab', 'Bb'],
  },
]

// Natural minor.
export const minorKeys: KeyFixture[] = [
  { tonic: 'A', signature: 0, scale: ['A', 'B', 'C', 'D', 'E', 'F', 'G'] },
  { tonic: 'E', signature: 1, scale: ['E', 'F#', 'G', 'A', 'B', 'C', 'D'] },
  { tonic: 'B', signature: 2, scale: ['B', 'C#', 'D', 'E', 'F#', 'G', 'A'] },
  { tonic: 'F#', signature: 3, scale: ['F#', 'G#', 'A', 'B', 'C#', 'D', 'E'] },
  { tonic: 'C#', signature: 4, scale: ['C#', 'D#', 'E', 'F#', 'G#', 'A', 'B'] },
  {
    tonic: 'G#',
    signature: 5,
    scale: ['G#', 'A#', 'B', 'C#', 'D#', 'E', 'F#'],
  },
  {
    tonic: 'D#',
    signature: 6,
    scale: ['D#', 'E#', 'F#', 'G#', 'A#', 'B', 'C#'],
  },
  {
    tonic: 'A#',
    signature: 7,
    scale: ['A#', 'B#', 'C#', 'D#', 'E#', 'F#', 'G#'],
  },
  { tonic: 'D', signature: -1, scale: ['D', 'E', 'F', 'G', 'A', 'Bb', 'C'] },
  { tonic: 'G', signature: -2, scale: ['G', 'A', 'Bb', 'C', 'D', 'Eb', 'F'] },
  { tonic: 'C', signature: -3, scale: ['C', 'D', 'Eb', 'F', 'G', 'Ab', 'Bb'] },
  { tonic: 'F', signature: -4, scale: ['F', 'G', 'Ab', 'Bb', 'C', 'Db', 'Eb'] },
  {
    tonic: 'Bb',
    signature: -5,
    scale: ['Bb', 'C', 'Db', 'Eb', 'F', 'Gb', 'Ab'],
  },
  {
    tonic: 'Eb',
    signature: -6,
    scale: ['Eb', 'F', 'Gb', 'Ab', 'Bb', 'Cb', 'Db'],
  },
  {
    tonic: 'Ab',
    signature: -7,
    scale: ['Ab', 'Bb', 'Cb', 'Db', 'Eb', 'Fb', 'Gb'],
  },
]

// SPEC section 13: double sharps in D# minor's harmonic minor.
export const dSharpHarmonicMinor = ['D#', 'E#', 'F#', 'G#', 'A#', 'B', 'C##']
