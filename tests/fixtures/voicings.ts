// Golden fixture: keyboard voicings (Phase 3 task 6), lowest note first,
// with octaves (middle C = C4), each placed as near middle C as it goes.
// Written out by hand; never edit this to make a test pass: ask David.
//
// close: the chord tones stacked as tightly as they go.
// open: close position with every second note up an octave (1 5 3 7).
// drop-2 / drop-3: close position with the 2nd or 3rd note from the top
//   dropped an octave, starting from the close position that leaves the
//   chord's bass at the bottom.
// spread: open position with the bass a further octave down.
export const keyboardVoicings: {
  chord: string
  style: 'close' | 'open' | 'drop-2' | 'drop-3' | 'spread'
  notes: string
}[] = [
  // Cmaj7 in every style: C E G B, C G E B, C G B E, C B E G, then spread.
  { chord: 'Cmaj7', style: 'close', notes: 'C4 E4 G4 B4' },
  { chord: 'Cmaj7', style: 'open', notes: 'C3 G3 E4 B4' },
  { chord: 'Cmaj7', style: 'drop-2', notes: 'C3 G3 B3 E4' },
  { chord: 'Cmaj7', style: 'drop-3', notes: 'C3 B3 E4 G4' },
  { chord: 'Cmaj7', style: 'spread', notes: 'C2 G3 E4 B4' },
  // A triad: drop-2 is the open triad; drop-3 drops the bass alone.
  { chord: 'C', style: 'close', notes: 'C4 E4 G4' },
  { chord: 'C', style: 'open', notes: 'C3 G3 E4' },
  { chord: 'C', style: 'drop-2', notes: 'C3 G3 E4' },
  { chord: 'C', style: 'drop-3', notes: 'C3 E4 G4' },
  { chord: 'C', style: 'spread', notes: 'C3 G4 E5' },
  // Other qualities and spellings.
  { chord: 'Am7', style: 'drop-2', notes: 'A3 E4 G4 C5' },
  { chord: 'G7', style: 'drop-2', notes: 'G3 D4 F4 B4' },
  { chord: 'G7', style: 'drop-3', notes: 'G2 F3 B3 D4' },
  { chord: 'G7', style: 'spread', notes: 'G2 D4 B4 F5' },
  { chord: 'Bb7', style: 'close', notes: 'Bb3 D4 F4 Ab4' },
  { chord: 'Ab', style: 'close', notes: 'Ab3 C4 Eb4' },
  // Inversions keep their bass at the bottom.
  { chord: 'C/E', style: 'close', notes: 'E3 G3 C4' },
  { chord: 'Cmaj7/E', style: 'drop-2', notes: 'E3 B3 C4 G4' },
  // A bass outside the chord sits under the chord's own voicing.
  { chord: 'F/G', style: 'close', notes: 'G3 F4 A4 C5' },
]

// Golden fixture: the left/right-hand split (SPEC 5). The left hand's bass
// is the highest one below C3, alone, with the chord's 5th, or doubled an
// octave up; in an inversion it plays the inverted bass alone or doubled.
// The right hand plays the chord in root position around middle C.
export const handSplits: {
  chord: string
  style?: 'close' | 'open' | 'drop-2' | 'drop-3' | 'spread'
  left?: 'bass' | 'fifth' | 'octave'
  leftNotes: string
  rightNotes: string
}[] = [
  { chord: 'C', leftNotes: 'C2', rightNotes: 'C4 E4 G4' },
  { chord: 'C', left: 'fifth', leftNotes: 'C2 G2', rightNotes: 'C4 E4 G4' },
  { chord: 'C', left: 'octave', leftNotes: 'C2 C3', rightNotes: 'C4 E4 G4' },
  { chord: 'B', leftNotes: 'B2', rightNotes: 'B3 D#4 F#4' },
  { chord: 'Cb', leftNotes: 'Cb3', rightNotes: 'Cb4 Eb4 Gb4' },
  { chord: 'Bdim', left: 'fifth', leftNotes: 'B2 F3', rightNotes: 'B3 D4 F4' },
  // In an inversion the chosen bass goes to the left hand.
  { chord: 'C/E', leftNotes: 'E2', rightNotes: 'C4 E4 G4' },
  { chord: 'C/E', left: 'fifth', leftNotes: 'E2', rightNotes: 'C4 E4 G4' },
  { chord: 'C/E', left: 'octave', leftNotes: 'E2 E3', rightNotes: 'C4 E4 G4' },
  // The right hand takes the voicing style.
  {
    chord: 'G7',
    style: 'drop-2',
    leftNotes: 'G2',
    rightNotes: 'G3 D4 F4 B4',
  },
]
