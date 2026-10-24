// Golden fixture: melodies to generate phrases after (PLAN Phase 7 task 7).
// Never edit this to make a test pass: ask David.
// Each case is a key, chords (a bar each unless a length is given), a
// meter and the melody so far, typed as the Melody tab reads it (each word
// lasting `value`, a crotchet when unset). The exit criterion: every
// generated phrase keeps every next-note rule:
// - every note within the range (tenor C3–A4 unless given)
// - a chord tone on each strong beat (in 4/4 beats 1 and 3; in 3/4 beat 1;
//   in 6/8 beats 1 and 4; in 7/8 the start of each group), where a chord
//   sounds
// - after a leap of a 4th or more (5 semitones), a change of direction
// - notes of the key only

export type PhraseFixture = {
  name: string
  key: string // tonic and scale id
  chords: (string | [string, { n: number; d: number }])[]
  meter: string
  melody: string
  value?: { n: number; d: number }
  range?: [string, string]
}

export const phrases: PhraseFixture[] = [
  {
    name: 'from nothing, over I vi IV V in C',
    key: 'C major',
    chords: ['C', 'Am', 'F', 'G'],
    meter: '4/4',
    melody: '',
  },
  {
    name: 'after a rising leap, in C',
    key: 'C major',
    chords: ['C', 'F', 'G7', 'C'],
    meter: '4/4',
    // C4 up to A4 is a 6th: the phrase must turn back down.
    melody: 'C4 A4',
  },
  {
    name: 'after a falling leap, in E minor',
    key: 'E natural-minor',
    chords: ['Em', 'C', 'G', 'D'],
    meter: '4/4',
    melody: 'B3 G3 B4 E4',
  },
  {
    name: 'halfway through a bar, in D major',
    key: 'D major',
    chords: ['D', 'G', 'A7', 'D'],
    meter: '4/4',
    melody: 'F#4 E4 D4',
  },
  {
    name: 'a waltz in G',
    key: 'G major',
    chords: ['G', 'C', 'D7', 'G'],
    meter: '3/4',
    melody: 'D4 G4 A4',
  },
  {
    name: 'a jig in A minor',
    key: 'A harmonic-minor',
    chords: [
      ['Am', { n: 3, d: 4 }],
      ['E', { n: 3, d: 4 }],
      ['Am', { n: 3, d: 4 }],
      ['E7', { n: 3, d: 4 }],
    ],
    meter: '6/8',
    melody: 'E4 A4',
    value: { n: 1, d: 8 },
  },
  {
    name: 'seven-eight in D Dorian',
    key: 'D dorian',
    chords: [
      ['Dm', { n: 7, d: 8 }],
      ['G', { n: 7, d: 8 }],
      ['Dm', { n: 7, d: 8 }],
      ['C', { n: 7, d: 8 }],
    ],
    meter: '7/8',
    melody: 'D4 F4',
    value: { n: 1, d: 8 },
  },
  {
    name: 'near the top of a narrow range, in B♭',
    key: 'Bb major',
    chords: ['Bb', 'Eb', 'F', 'Bb'],
    meter: '4/4',
    melody: 'D5 F5',
    range: ['Bb4', 'G5'],
  },
  {
    name: 'past the last chord, in F',
    key: 'F major',
    chords: ['F'],
    meter: '4/4',
    melody: 'F4 G4 A4 C5',
    range: ['C4', 'F5'],
  },
  {
    name: 'with no chords, in A major',
    key: 'A major',
    chords: [],
    meter: '4/4',
    melody: 'E4',
  },
]
