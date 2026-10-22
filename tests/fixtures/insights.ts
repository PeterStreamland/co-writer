// Golden fixture: the theory lines in a chord's ⓘ panel, written out by hand
// (PLAN Phase 4 task 6, SPEC 6.2). Never edit this to make a test pass: ask
// David.
// Keys and chords are typed in ASCII (# sharp, b flat); the lines are
// written as displayed, with ♯ and ♭.

export const insights: {
  key: string
  previous?: string
  chord: string
  reading: string
  notes: string
  motion?: string
  common?: string
  moves?: string
}[] = [
  {
    key: 'C major',
    chord: 'C',
    reading: 'I, diatonic in C major',
    notes: 'C E G',
  },
  {
    // The leading note rises to the tonic and the 7th falls to the 3rd.
    key: 'C major',
    previous: 'G7',
    chord: 'C',
    reading: 'I, diatonic in C major',
    notes: 'C E G',
    motion: 'The root rises a perfect 4th, G to C.',
    common: 'Keeps G from G7.',
    moves: 'Moves: B up a semitone to C, F down a semitone to E.',
  },
  {
    key: 'C major',
    previous: 'C',
    chord: 'Ab',
    reading: '♭VI, borrowed from C Aeolian',
    notes: 'A♭ C E♭',
    motion: 'The root falls a major 3rd, C to A♭.',
    common: 'Keeps C from C.',
    moves: 'Moves: G up a semitone to A♭, E down a semitone to E♭.',
  },
  {
    key: 'C major',
    previous: 'C',
    chord: 'G',
    reading: 'V, diatonic in C major',
    notes: 'G B D',
    motion: 'The root falls a perfect 4th, C to G.',
    common: 'Keeps G from C.',
    moves: 'Moves: C down a semitone to B, E down a tone to D.',
  },
  {
    key: 'E minor',
    previous: 'Em',
    chord: 'F',
    reading: '♭II, borrowed from E Phrygian',
    notes: 'F A C',
    motion: 'The root rises a minor 2nd, E to F.',
    common: 'Shares no notes with Em.',
    moves:
      'Moves: E up a semitone to F, G up a tone to A, B up a semitone to C.',
  },
  {
    key: 'C major',
    previous: 'C',
    chord: 'C/E',
    reading: 'I⁶, diatonic in C major',
    notes: 'E G C',
    motion: 'Same root as C.',
    common: 'Keeps E, G and C from C.',
  },
]
