// Golden fixture: the pitches a clicked chord plays, as MIDI numbers
// (middle C = C4 = 60), written out by hand. Never edit this to make a test
// pass: ask David.
// The bass sits between F3 (53) and E4 (64), the rest in close position above.
export const playbackPitches: Record<string, number[]> = {
  C: [60, 64, 67],
  Am: [57, 60, 64],
  F: [53, 57, 60],
  E: [64, 68, 71],
  'F#': [54, 58, 61],
  Cb: [59, 63, 66],
  Bdim: [59, 62, 65],
  G7: [55, 59, 62, 65],
  Cmaj9: [60, 64, 67, 71, 74],
  Dm11: [62, 65, 69, 72, 76, 79],
  'C/E': [64, 67, 72],
  'G/B': [59, 62, 67],
}
