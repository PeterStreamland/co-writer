// Golden fixture: melodies to write a phrase into a chosen bar (PLAN
// Phase 7 task 10, David's note). Never edit this to make a test pass: ask
// David.
// Each case is a key, chords (a bar each unless a length is given), a
// meter, the melody (typed as the Melody tab reads it, each word lasting
// `value`, a crotchet when unset; r is a rest, - holds the note before)
// and the bar the phrase goes into, counted from 1. David's choices:
// - the phrase replaces the notes starting in its span; a note ringing in
//   from before stops at the bar's start, and notes after it stay put
// - the notes before lead into it and it leads into the note after: its
//   last note is within a 3rd of the note after (less than a 4th), where
//   a note keeping the rules can be
// - a bar past the melody's end starts with a rest from the melody's end
// It keeps every rule a phrase after the melody keeps (see phrases.ts).

export type PhraseIntoFixture = {
  name: string
  key: string // tonic and scale id
  chords: (string | [string, { n: number; d: number }])[]
  meter: string
  melody: string
  value?: { n: number; d: number }
  range?: [string, string]
  bar: number
  // The notes before the phrase as they stand afterwards, and the notes
  // after a phrase to the bar's end, as note@onset in whole notes.
  before: string
  after: string
}

export const phrasesInto: PhraseIntoFixture[] = [
  {
    name: 'the middle bar of three, in C',
    key: 'C major',
    chords: ['C', 'F', 'G', 'C'],
    meter: '4/4',
    melody: 'E4 D4 C4 D4 F4 E4 D4 C4 B3 C4 D4 G4',
    bar: 2,
    before: 'E4@0 D4@1/4 C4@1/2 D4@3/4',
    after: 'B3@2 C4@9/4 D4@5/2 G4@11/4',
  },
  {
    name: 'a note ringing in from the bar before, in G',
    key: 'G major',
    chords: ['G', 'C', 'D', 'G'],
    meter: '4/4',
    // Dotted minims: B3 at 0, D4 from beat 4 over the barline, G4 at bar
    // 2's beat 3, A4 at bar 3's beat 2.
    melody: 'B3 D4 G4 A4',
    value: { n: 3, d: 4 },
    bar: 2,
    before: 'B3@0 D4@3/4',
    after: 'A4@9/4',
  },
  {
    name: 'the first bar, in E minor',
    key: 'E natural-minor',
    chords: ['Em', 'C', 'G', 'D'],
    meter: '4/4',
    melody: 'B3 G3 B3 E4 D4 B3 A3 G3',
    bar: 1,
    before: '',
    after: 'D4@1 B3@5/4 A3@3/2 G3@7/4',
  },
  {
    name: 'an empty bar after the melody, in D',
    key: 'D major',
    chords: ['D', 'G', 'A7', 'D'],
    meter: '4/4',
    melody: 'F#4 E4 D4 E4',
    bar: 3,
    before: 'F#4@0 E4@1/4 D4@1/2 E4@3/4',
    after: '',
  },
  {
    name: 'the second bar of a waltz, in F',
    key: 'F major',
    chords: ['F', 'Bb', 'C7', 'F'],
    meter: '3/4',
    melody: 'C4 F4 A4 G4 F4 E4 F4 - -',
    range: ['C4', 'F5'],
    bar: 2,
    before: 'C4@0 F4@1/4 A4@1/2',
    after: 'F4@3/2',
  },
  {
    name: 'the second bar of a jig, in A minor',
    key: 'A harmonic-minor',
    chords: [
      ['Am', { n: 3, d: 4 }],
      ['E', { n: 3, d: 4 }],
      ['Am', { n: 3, d: 4 }],
    ],
    meter: '6/8',
    melody: 'E4 A4 C5 B4 A4 G#4 A4 E4 C4 B3 C4 E4 A4',
    value: { n: 1, d: 8 },
    range: ['A3', 'E5'],
    bar: 2,
    before: 'E4@0 A4@1/8 C5@1/4 B4@3/8 A4@1/2 G#4@5/8',
    after: 'A4@3/2',
  },
]
