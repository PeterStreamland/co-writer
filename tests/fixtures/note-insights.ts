// Golden fixture: a next note's ⓘ reading (PLAN Phase 7 task 4, SPEC 6.2).
// Never edit this to make a test pass: ask David.
// The reading names the note's degree in the key (with its traditional
// name), its place in the chord under it, and its move from the note
// before, by spelled interval: a semitone or a tone for 2nds, otherwise
// the interval's name.

export type NoteInsightFixture = {
  key: string // tonic and scale id
  note: string
  chord?: string
  from?: string
  reading: string
  move?: string
}

export const noteInsights: NoteInsightFixture[] = [
  {
    key: 'C major',
    note: 'E4',
    chord: 'C',
    from: 'C4',
    reading: 'E4: degree 3 of C major (mediant), the 3rd of C.',
    move: 'Up a major 3rd from C4.',
  },
  {
    key: 'C major',
    note: 'C♯4',
    chord: 'A7',
    from: 'C4',
    reading: 'C♯4: degree ♯1 of C major (sharpened tonic), the 3rd of A7.',
    move: 'Up a semitone from C4.',
  },
  {
    key: 'C major',
    note: 'B3',
    chord: 'G7',
    from: 'C4',
    reading: 'B3: degree 7 of C major (leading note), the 3rd of G7.',
    move: 'Down a semitone from C4.',
  },
  {
    key: 'C major',
    note: 'F4',
    chord: 'C',
    from: 'G4',
    reading: 'F4: degree 4 of C major (subdominant), not a note of C.',
    move: 'Down a tone from G4.',
  },
  {
    key: 'A natural-minor',
    note: 'G♯3',
    chord: 'E',
    from: 'E4',
    // Degrees count from the major scale on the tonic (SPEC 4), so G♯ is
    // 7 in A minor and G is ♭7.
    reading: 'G♯3: degree 7 of A minor (leading note), the 3rd of E.',
    move: 'Down a minor 6th from E4.',
  },
  {
    key: 'C major',
    note: 'C5',
    from: 'C4',
    reading: 'C5: degree 1 of C major (tonic).',
    move: 'Up an octave from C4.',
  },
  {
    // Spelled as another note of the chord: A♭ over E (G♯).
    key: 'C major',
    note: 'A♭4',
    chord: 'E',
    from: 'G4',
    reading:
      'A♭4: degree ♭6 of C major (submediant), sounding as a note of E, spelled another way.',
    move: 'Up a semitone from G4.',
  },
]
