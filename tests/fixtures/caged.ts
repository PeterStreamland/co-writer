// Golden fixture: the CAGED shape of hand-picked fingerings, lowest string
// first, frets from the nut. Each chord appears in all five shapes where it
// has one up to fret 15. Written out by hand; never edit this to make a test
// pass: ask David.
export const cagedShapes: {
  tuning: string
  sevenString?: boolean
  capo?: number
  chord: string
  shapes: Record<string, string>
}[] = [
  // C in all five: open C, A-shape barre at 3, G shape at 5, E-shape barre
  // at 8, D shape at 10.
  {
    tuning: 'standard',
    chord: 'C',
    shapes: {
      x32010: 'C',
      x35553: 'A',
      '875558': 'G',
      '8-10-10-9-8-8': 'E',
      'x-x-10-12-13-12': 'D',
    },
  },
  // A in all five: open A, G shape at 2, E-shape barre at 5, D shape at 7,
  // C shape at 9.
  {
    tuning: 'standard',
    chord: 'A',
    shapes: {
      x02220: 'A',
      '542225': 'G',
      '577655': 'E',
      'x-x-7-9-10-9': 'D',
      'x-12-11-9-10-9': 'C',
    },
  },
  // G in all five: open G, E-shape barre at 3, D shape at 5, C shape at 7,
  // A-shape barre at 10.
  {
    tuning: 'standard',
    chord: 'G',
    shapes: {
      '320003': 'G',
      '355433': 'E',
      xx5787: 'D',
      'x-10-9-7-8-7': 'C',
      'x-10-12-12-12-10': 'A',
    },
  },
  // Minor chords take the shape of their open minor chord.
  {
    tuning: 'standard',
    chord: 'Am',
    shapes: { x02210: 'A', '577555': 'E' },
  },
  { tuning: 'standard', chord: 'Em', shapes: { '022000': 'E' } },
  { tuning: 'standard', chord: 'Dm', shapes: { xx0231: 'D' } },
  { tuning: 'standard', chord: 'Bm', shapes: { x24432: 'A' } },
  { tuning: 'standard', chord: 'F#m', shapes: { '244222': 'E' } },
  { tuning: 'standard', chord: 'Cm', shapes: { x35543: 'A' } },
  // 7th chords: B7 is the C7 shape a fret lower, its open B string where
  // C7's B-string root is fretted.
  { tuning: 'standard', chord: 'C7', shapes: { x32310: 'C' } },
  { tuning: 'standard', chord: 'B7', shapes: { x21202: 'C' } },
  { tuning: 'standard', chord: 'G7', shapes: { '320001': 'G' } },
  { tuning: 'standard', chord: 'E7', shapes: { '020100': 'E' } },
  { tuning: 'standard', chord: 'A7', shapes: { x02020: 'A' } },
  { tuning: 'standard', chord: 'D7', shapes: { xx0212: 'D' } },
  // With a capo the shapes are read from the capo: at capo 2 the open G
  // shape sounds A, the C shape D and the Am shape Bm.
  {
    tuning: 'standard',
    capo: 2,
    chord: 'A',
    shapes: { '542225': 'G', '577655': 'E' },
  },
  { tuning: 'standard', capo: 2, chord: 'D', shapes: { x54232: 'C' } },
  { tuning: 'standard', capo: 2, chord: 'Bm', shapes: { x24432: 'A' } },
  // E♭ standard keeps standard's shapes: open C's fingering sounds B.
  { tuning: 'e-flat', chord: 'B', shapes: { x32010: 'C', x35553: 'A' } },
  // A 7-string's top six strings are standard.
  {
    tuning: 'standard',
    sevenString: true,
    chord: 'C',
    shapes: { xx32010: 'C', 'x-x-x-10-12-13-12': 'D' },
  },
]

// Golden fixture: shape names, as SPEC 5 writes them.
export const shapeNames: {
  tuning: string
  capo?: number
  chord: string
  frets: string
  name: string
}[] = [
  {
    tuning: 'standard',
    capo: 2,
    chord: 'A',
    frets: '542225',
    name: 'A (G shape, capo 2)',
  },
  { tuning: 'standard', chord: 'C', frets: 'x35553', name: 'C (A shape)' },
  { tuning: 'standard', chord: 'Bm', frets: 'x24432', name: 'Bm (Am shape)' },
  {
    tuning: 'standard',
    capo: 2,
    chord: 'Bm',
    frets: 'x24432',
    name: 'Bm (Am shape, capo 2)',
  },
  { tuning: 'standard', chord: 'C7', frets: 'x32310', name: 'C7 (C7 shape)' },
  { tuning: 'standard', chord: 'B7', frets: 'x21202', name: 'B7 (C7 shape)' },
  // No CAGED shapes in drop D: just the chord.
  { tuning: 'drop-d', chord: 'D', frets: '000232', name: 'D' },
]
