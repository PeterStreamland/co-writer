// Golden fixture: the notes of each arpeggio, by chord, key and level.
// Never edit this to make a test pass: ask David.
// ASCII accidentals: # sharp, b flat. Each tone is "note label".
// Extensions come from the key, stacked in 3rds on the chord's root
// (the 7th, 9th, 11th and 13th are the key's notes on those letters). An
// added note a semitone above a chord tone is left out (arrangers' avoid
// notes: the 11th over a major 3rd, a b9 or b13 over a minor chord), except
// that a dominant 7th keeps its b9 and b13, which are its colours.

export type ArpeggioFixture = {
  key: string // "C major", "A natural-minor"
  chord: string
  level: 'triad' | 'seventh' | 'ninth' | 'eleventh' | 'thirteenth'
  tones: string[]
  left?: string[] // added notes left out
}

export const arpeggios: ArpeggioFixture[] = [
  // The tonic of C major, up the levels.
  { key: 'C major', chord: 'C', level: 'triad', tones: ['C R', 'E 3', 'G 5'] },
  {
    key: 'C major',
    chord: 'C',
    level: 'seventh',
    tones: ['C R', 'E 3', 'G 5', 'B 7'],
  },
  {
    key: 'C major',
    chord: 'C',
    level: 'ninth',
    tones: ['C R', 'E 3', 'G 5', 'B 7', 'D 9'],
  },
  {
    key: 'C major',
    chord: 'C',
    level: 'eleventh',
    tones: ['C R', 'E 3', 'G 5', 'B 7', 'D 9'],
    left: ['F 11'],
  },
  {
    key: 'C major',
    chord: 'C',
    level: 'thirteenth',
    tones: ['C R', 'E 3', 'G 5', 'B 7', 'D 9', 'A 13'],
    left: ['F 11'],
  },
  // Every chord of C major as a 13th.
  {
    key: 'C major',
    chord: 'Dm',
    level: 'thirteenth',
    tones: ['D R', 'F b3', 'A 5', 'C b7', 'E 9', 'G 11', 'B 13'],
  },
  {
    key: 'C major',
    chord: 'Em',
    level: 'thirteenth',
    tones: ['E R', 'G b3', 'B 5', 'D b7', 'A 11'],
    left: ['F b9', 'C b13'],
  },
  {
    key: 'C major',
    chord: 'F',
    level: 'thirteenth',
    tones: ['F R', 'A 3', 'C 5', 'E 7', 'G 9', 'B #11', 'D 13'],
  },
  {
    key: 'C major',
    chord: 'G',
    level: 'thirteenth',
    tones: ['G R', 'B 3', 'D 5', 'F b7', 'A 9', 'E 13'],
    left: ['C 11'],
  },
  {
    key: 'C major',
    chord: 'Am',
    level: 'thirteenth',
    tones: ['A R', 'C b3', 'E 5', 'G b7', 'B 9', 'D 11'],
    left: ['F b13'],
  },
  {
    key: 'C major',
    chord: 'Bdim',
    level: 'thirteenth',
    tones: ['B R', 'D b3', 'F b5', 'A b7', 'E 11', 'G b13'],
    left: ['C b9'],
  },
  // Chromatic chords take their extensions from the key too: V/vi in C is
  // E7, and bVI is Abmaj7.
  {
    key: 'C major',
    chord: 'E',
    level: 'seventh',
    tones: ['E R', 'G# 3', 'B 5', 'D b7'],
  },
  {
    key: 'C major',
    chord: 'Ab',
    level: 'seventh',
    tones: ['Ab R', 'C 3', 'Eb 5', 'G 7'],
  },
  // V in A minor keeps its b9 and b13; the 11th clashes with the 3rd.
  {
    key: 'A natural-minor',
    chord: 'E',
    level: 'thirteenth',
    tones: ['E R', 'G# 3', 'B 5', 'D b7', 'F b9', 'C b13'],
    left: ['A 11'],
  },
  // A chord's own tones always stay, and are never replaced by the key's.
  {
    key: 'C major',
    chord: 'C7',
    level: 'ninth',
    tones: ['C R', 'E 3', 'G 5', 'Bb b7', 'D 9'],
  },
  {
    key: 'C major',
    chord: 'Cmaj9',
    level: 'triad',
    tones: ['C R', 'E 3', 'G 5'],
  },
  // A 6th stands in for the 7th, and the 13th it would double is skipped.
  {
    key: 'C major',
    chord: 'C6',
    level: 'thirteenth',
    tones: ['C R', 'E 3', 'G 5', 'A 6', 'D 9'],
    left: ['F 11'],
  },
  // Sus chords keep their 4th; the 11th would double it.
  {
    key: 'C major',
    chord: 'Gsus4',
    level: 'eleventh',
    tones: ['G R', 'C 4', 'D 5', 'F b7', 'A 9'],
  },
  // Power chords stay without a 3rd.
  {
    key: 'E natural-minor',
    chord: 'E5',
    level: 'triad',
    tones: ['E R', 'B 5'],
  },
]

// Added 2026-10-23 (Phase 6 gate, David's choice): a borrowed chord takes
// its 7th and extensions from the mode it's borrowed from, as players
// expect. Fm in C is iv from C minor, so Fm7; Bb is bVII, so Bb7.
// Secondary dominants (E7, A7 in C) aren't borrowed and keep the key's.
export const borrowedArpeggios: ArpeggioFixture[] = [
  {
    key: 'C major',
    chord: 'Fm',
    level: 'seventh',
    tones: ['F R', 'Ab b3', 'C 5', 'Eb b7'],
  },
  {
    key: 'C major',
    chord: 'Fm',
    level: 'thirteenth',
    tones: ['F R', 'Ab b3', 'C 5', 'Eb b7', 'G 9', 'Bb 11', 'D 13'],
  },
  {
    key: 'C major',
    chord: 'Bb',
    level: 'seventh',
    tones: ['Bb R', 'D 3', 'F 5', 'Ab b7'],
  },
  {
    key: 'C major',
    chord: 'A',
    level: 'seventh',
    tones: ['A R', 'C# 3', 'E 5', 'G b7'],
  },
]
