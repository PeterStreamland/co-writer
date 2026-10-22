// Golden fixture: what the open strings sound with a capo, lowest string
// first, as MIDI numbers (E2 = 40, middle C = 60), including a capo on an
// alternate tuning and on a 7-string (SPEC 13). Written out by hand; never
// edit this to make a test pass: ask David.
export const capoPitches: {
  tuning: string
  sevenString: boolean
  capo: number
  midi: number[]
}[] = [
  // No capo: the open strings themselves, E2 A2 D3 G3 B3 E4.
  {
    tuning: 'standard',
    sevenString: false,
    capo: 0,
    midi: [40, 45, 50, 55, 59, 64],
  },
  // Capo 2 on standard sounds F♯2 B2 E3 A3 C♯4 F♯4.
  {
    tuning: 'standard',
    sevenString: false,
    capo: 2,
    midi: [42, 47, 52, 57, 61, 66],
  },
  // Capo 2 on DADGAD sounds E2 B2 E3 A3 B3 E4.
  {
    tuning: 'dadgad',
    sevenString: false,
    capo: 2,
    midi: [40, 47, 52, 57, 59, 64],
  },
  // Capo 5 on Open G (D G D G B D) sounds G2 C3 G3 C4 E4 G4: open C.
  {
    tuning: 'open-g',
    sevenString: false,
    capo: 5,
    midi: [43, 48, 55, 60, 64, 67],
  },
  // Capo 3 on 7-string Drop D (A D A D G B E) sounds C2 F2 C3 F3 B♭3 D4 G4.
  {
    tuning: 'drop-d',
    sevenString: true,
    capo: 3,
    midi: [36, 41, 48, 53, 58, 62, 67],
  },
]
