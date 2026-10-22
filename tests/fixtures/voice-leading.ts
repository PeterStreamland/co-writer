// Golden fixture: voice-leading cost between two voicings, worked out by
// hand (PLAN Phase 5 task 2). Never edit this to make a test pass: ask
// David.
// Voicings list one note per voice, lowest voice first, in ASCII (# sharp,
// b flat) with scientific octaves (C4 is middle C). Voices of equal-sized
// chords pair in order, so a voice listed above another can cross it.
// Chords of different sizes are paired in pitch order, each note of each
// chord used at least once, for the least total movement.

export const voiceLeadings: {
  name: string
  from: string
  to: string
  movement: number // total semitones moved by all voices
  kept: number // voices holding the same note
  common: number // pitch classes the two chords share
  missed: number // shared pitch classes no voice holds
  crossings: number // pairs of voices out of order in the second chord
  overlaps: number // voices moving past where a neighbour just was
}[] = [
  {
    name: 'C to G/B: two steps down, G held',
    from: 'C4 E4 G4',
    to: 'B3 D4 G4',
    movement: 3,
    kept: 1,
    common: 1,
    missed: 0,
    crossings: 0,
    overlaps: 0,
  },
  {
    name: 'C to F/C: two steps up, C held',
    from: 'C4 E4 G4',
    to: 'C4 F4 A4',
    movement: 3,
    kept: 1,
    common: 1,
    missed: 0,
    crossings: 0,
    overlaps: 0,
  },
  {
    name: 'C to F in root position: every voice leaps a 4th',
    from: 'C4 E4 G4',
    to: 'F4 A4 C5',
    movement: 15,
    kept: 0,
    common: 1,
    missed: 1,
    crossings: 0,
    // C4 rises to F4, past E4; E4 rises to A4, past G4.
    overlaps: 2,
  },
  {
    name: 'C to Am: C and E held, G up a tone',
    from: 'C4 E4 G4',
    to: 'C4 E4 A4',
    movement: 2,
    kept: 2,
    common: 2,
    missed: 0,
    crossings: 0,
    overlaps: 0,
  },
  {
    name: 'G7 to C in four parts: the leading note rises, the 7th falls',
    from: 'G2 B3 D4 F4',
    to: 'C3 C4 C4 E4',
    movement: 1 + 1 + 2 + 5,
    kept: 0,
    common: 0,
    missed: 0,
    crossings: 0,
    overlaps: 0,
  },
  {
    name: 'C to F in four parts with the tenor crossing the alto',
    from: 'C3 E4 G4 C5',
    to: 'F3 A4 F4 C5',
    movement: 5 + 5 + 2 + 0,
    kept: 1,
    common: 1,
    missed: 0,
    crossings: 1,
    overlaps: 1,
  },
  {
    name: 'a voice moving past where its neighbour was, without crossing',
    from: 'C4 E4 G4',
    to: 'F4 G4 C5',
    movement: 5 + 3 + 5,
    kept: 0,
    // C and G are shared, but no voice stays on either.
    common: 2,
    missed: 2,
    crossings: 0,
    overlaps: 1,
  },
  {
    name: 'C triad to G7: three notes to four, paired in pitch order',
    from: 'C4 E4 G4',
    to: 'G3 B3 D4 F4',
    // C4 to G3 (5) and B3 (1), E4 to D4 (2), G4 to F4 (2).
    movement: 10,
    kept: 0,
    common: 1,
    missed: 1,
    crossings: 0,
    overlaps: 0,
  },
  {
    name: 'C7 to F: four notes to three, the 7th and the 3rd both falling',
    from: 'C4 E4 G4 Bb4',
    to: 'C4 F4 A4',
    // C4 held, E4 to F4 (1), G4 to A4 (2), Bb4 to A4 (1).
    movement: 4,
    kept: 1,
    common: 1,
    missed: 0,
    crossings: 0,
    overlaps: 0,
  },
  {
    name: 'enharmonic notes count as held: C# to Db',
    from: 'A3 C#4 E4',
    to: 'Ab3 Db4 F4',
    movement: 1 + 0 + 1,
    kept: 1,
    common: 1,
    missed: 0,
    crossings: 0,
    overlaps: 0,
  },
]
