// Golden fixture: motif options (PLAN Phase 7 task 3). Never edit this to
// make a test pass: ask David.
// A motif is the notes that start in one bar, two or more of them. The
// motif offered is the bar whose rhythm comes back most in the melody,
// else the first. Its options go in the next free bar, each note at the
// same place in that bar as in the motif's own:
// - repeat: the motif again
// - sequence: moved up or down by scale steps, spelled in the key, an
//   altered note keeping its alteration (G♯ a step up is A♯)
// - changed ending: the last note swapped for another
// - upside down: each step from the first note mirrored (up a 2nd becomes
//   down a 2nd)
// Melodies are typed as the Melody tab reads them, each word a crotchet;
// chords are a bar each in 4/4.

export type MotifFixture = {
  name: string
  key: string // tonic and scale id
  chords: string[]
  melody: string
  range?: [string, string] // tenor C3–A4 when unset
  motifBar?: number // the bar offered as the motif; none when there is none
  repeat?: string // the repeat's notes
  startsAt?: { n: number; d: number } // where the options start
  bestSequence?: string // the best sequence's notes
  sequence?: { steps: number; notes: string } // a sequence by these steps
  upsideDown?: string
}

export const motifs: MotifFixture[] = [
  {
    // E F G G over C, then G: the repeat goes in bar 2. Up a 3rd, G A B B
    // puts chord tones of G on both strong beats (G and B), nearest the
    // last note.
    name: 'a bar of crotchets over C, then G',
    key: 'C major',
    chords: ['C', 'G'],
    melody: 'E4 F G G',
    range: ['C4', 'A5'],
    motifBar: 1,
    repeat: 'E4 F4 G4 G4',
    startsAt: { n: 1, d: 1 },
    bestSequence: 'G4 A4 B4 B4',
    sequence: { steps: -1, notes: 'D4 E4 F4 F4' },
    upsideDown: 'E4 D4 C4 C4',
  },
  {
    // The rhythm crotchet, crotchet, minim comes back in bar 3, so bar 1
    // is the motif, not bar 2's four crotchets.
    name: 'the rhythm that comes back is the motif',
    key: 'C major',
    chords: ['C', 'F', 'G'],
    melody: 'C4 D E - G G G G D E F -',
    motifBar: 1,
    repeat: 'C4 D4 E4',
    startsAt: { n: 3, d: 1 },
  },
  {
    // The melody stops mid-bar: the motif so far goes in the next bar.
    name: 'an unfinished bar',
    key: 'C major',
    chords: ['C', 'C'],
    melody: 'C4 D E',
    motifBar: 1,
    repeat: 'C4 D4 E4',
    startsAt: { n: 1, d: 1 },
    upsideDown: 'C4 B3 A3',
  },
  {
    // In D, a step up from F♯ G A is G A B, spelled by the key.
    name: 'sequences keep the key’s spelling',
    key: 'D major',
    chords: ['D', 'D'],
    melody: 'F♯4 G A',
    range: ['C4', 'A5'],
    sequence: { steps: 1, notes: 'G4 A4 B4' },
  },
  {
    // A G♯ A in A minor: a step up keeps the raised note, B A♯ B.
    name: 'an altered note keeps its alteration',
    key: 'A natural-minor',
    chords: ['Am', 'Am'],
    melody: 'A3 G♯ A',
    sequence: { steps: 1, notes: 'B3 A♯3 B3' },
  },
  {
    // A melody typed above the range: tenor tops out at A4, so the repeat
    // of B4 C5 moves down an octave to fit.
    name: 'an option out of range moves by an octave',
    key: 'C major',
    chords: ['G', 'G'],
    melody: 'B4 C5',
    repeat: 'B3 C4',
  },
  {
    // One note to a bar is no motif.
    name: 'a single note is no motif',
    key: 'C major',
    chords: ['C'],
    melody: 'C4 - - -',
  },
]
