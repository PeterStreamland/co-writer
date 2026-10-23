// Golden fixture: textbook moves the line modes must make (PLAN Phase 6
// task 3, SPEC 7.4). Never edit this to make a test pass: ask David.
// ASCII accidentals: # sharp, b flat. Keys are "tonic mode".

// A note a semitone from a target, from below or above. Spelled toward the
// target: F# rises to G, Ab falls to G. A semitone that is in the key is a
// diatonic approach (B to C in C major); otherwise it is chromatic.
export const approaches: {
  key: string
  target: string
  from: 'below' | 'above'
  note: string
  chromatic: boolean
}[] = [
  { key: 'C major', target: 'G', from: 'below', note: 'F#', chromatic: true },
  { key: 'C major', target: 'G', from: 'above', note: 'Ab', chromatic: true },
  { key: 'C major', target: 'C', from: 'below', note: 'B', chromatic: false },
  { key: 'C major', target: 'E', from: 'above', note: 'F', chromatic: false },
  {
    key: 'A natural-minor',
    target: 'A',
    from: 'below',
    note: 'G#',
    chromatic: true,
  },
  {
    key: 'E natural-minor',
    target: 'D',
    from: 'below',
    note: 'C#',
    chromatic: true,
  },
]

// Enclosures: the scale step above the target, then the semitone below it,
// then the target.
export const enclosures: { key: string; target: string; notes: string[] }[] = [
  { key: 'C major', target: 'E', notes: ['F', 'D#'] },
  { key: 'C major', target: 'C', notes: ['D', 'B'] },
  { key: 'C major', target: 'G', notes: ['A', 'F#'] },
  { key: 'A natural-minor', target: 'A', notes: ['B', 'G#'] },
]

// Guide-tone lines over ii–V–I in C: each chord's 3rd or 7th, whichever is
// nearer the last, so the line moves by a step or not at all.
export const guideTones: {
  key: string
  chords: string
  from: '3rd' | '7th'
  notes: string[]
}[] = [
  {
    key: 'C major',
    chords: 'Dm7 G7 Cmaj7',
    from: '3rd',
    notes: ['F', 'F', 'E'],
  },
  {
    key: 'C major',
    chords: 'Dm7 G7 Cmaj7',
    from: '7th',
    notes: ['C', 'B', 'B'],
  },
  {
    key: 'C major',
    chords: 'Am7 D7 Gmaj7',
    from: '3rd',
    notes: ['C', 'C', 'B'],
  },
]

// Root and 5th: a bar of 4/4 as two minims, the root then the 5th.
export const rootFifths: { key: string; chord: string; notes: string[] }[] = [
  { key: 'C major', chord: 'C', notes: ['C', 'G'] },
  { key: 'C major', chord: 'Am', notes: ['A', 'E'] },
  { key: 'C major', chord: 'Bdim', notes: ['B', 'F'] },
  { key: 'E natural-minor', chord: 'E5', notes: ['E', 'B'] },
]

// Added 2026-10-23 (Phase 6 gate review): a semitone the key already has
// takes the key's spelling, so it isn't chromatic; and an enclosure's step
// above is at most a whole tone.
export const keyApproaches: {
  key: string
  target: string
  from: 'below' | 'above'
  note: string
}[] = [
  { key: 'C major', target: 'Ab', from: 'above', note: 'A' },
  { key: 'C major', target: 'Bb', from: 'above', note: 'B' },
  { key: 'C major', target: 'F#', from: 'below', note: 'F' },
  { key: 'C major', target: 'G#', from: 'below', note: 'G' },
  { key: 'C major', target: 'Db', from: 'below', note: 'C' },
]

export const chromaticEnclosures: {
  key: string
  target: string
  notes: string[]
}[] = [
  { key: 'C major', target: 'Ab', notes: ['Bb', 'G'] },
  { key: 'C major', target: 'Db', notes: ['Eb', 'C'] },
]

// Chromatic passing notes: naturals where they exist, sharps going up and
// flats coming down for the rest, never stacking accidentals on one letter.
export const chromaticRuns: {
  key: string
  from: string
  to: string
  notes: string[]
}[] = [
  { key: 'A harmonic-minor', from: 'F4', to: 'G#4', notes: ['F#', 'G'] },
  { key: 'A minor-pentatonic', from: 'E4', to: 'G4', notes: ['F', 'F#'] },
  { key: 'C major', from: 'C4', to: 'E4', notes: ['C#', 'D', 'D#'] },
  { key: 'C major', from: 'E4', to: 'C4', notes: ['Eb', 'D', 'Db'] },
  { key: 'F# major', from: 'F#4', to: 'A#4', notes: ['G', 'G#', 'A'] },
]
