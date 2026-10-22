// Golden fixture: open-string pitches for each tuning, lowest string first,
// as MIDI numbers (E2 = 40, middle C = 60). Written out by hand; never edit
// this to make a test pass: ask David.
export const tuningPitches: {
  id: string
  sevenString: boolean
  strings: string
  midi: number[]
}[] = [
  {
    id: 'standard',
    sevenString: false,
    strings: 'E2 A2 D3 G3 B3 E4',
    midi: [40, 45, 50, 55, 59, 64],
  },
  {
    id: 'drop-d',
    sevenString: false,
    strings: 'D2 A2 D3 G3 B3 E4',
    midi: [38, 45, 50, 55, 59, 64],
  },
  {
    id: 'dadgad',
    sevenString: false,
    strings: 'D2 A2 D3 G3 A3 D4',
    midi: [38, 45, 50, 55, 57, 62],
  },
  // 7-string B standard
  {
    id: 'standard',
    sevenString: true,
    strings: 'B1 E2 A2 D3 G3 B3 E4',
    midi: [35, 40, 45, 50, 55, 59, 64],
  },
  // A 7th string sits a perfect 4th below the lowest (David's choice to
  // revisit; this replaced a fixed low B, which clashed with Drop B).
  {
    id: 'drop-d',
    sevenString: true,
    strings: 'A1 D2 A2 D3 G3 B3 E4',
    midi: [33, 38, 45, 50, 55, 59, 64],
  },
  {
    id: 'e-flat',
    sevenString: false,
    strings: 'Eb2 Ab2 Db3 Gb3 Bb3 Eb4',
    midi: [39, 44, 49, 54, 58, 63],
  },
  {
    id: 'e-flat',
    sevenString: true,
    strings: 'Bb1 Eb2 Ab2 Db3 Gb3 Bb3 Eb4',
    midi: [34, 39, 44, 49, 54, 58, 63],
  },
  {
    id: 'd-standard',
    sevenString: false,
    strings: 'D2 G2 C3 F3 A3 D4',
    midi: [38, 43, 48, 53, 57, 62],
  },
  {
    id: 'c-standard',
    sevenString: false,
    strings: 'C2 F2 Bb2 Eb3 G3 C4',
    midi: [36, 41, 46, 51, 55, 60],
  },
  {
    id: 'double-drop-d',
    sevenString: false,
    strings: 'D2 A2 D3 G3 B3 D4',
    midi: [38, 45, 50, 55, 59, 62],
  },
  {
    id: 'drop-c-sharp',
    sevenString: false,
    strings: 'C#2 G#2 C#3 F#3 A#3 D#4',
    midi: [37, 44, 49, 54, 58, 63],
  },
  {
    id: 'drop-c',
    sevenString: false,
    strings: 'C2 G2 C3 F3 A3 D4',
    midi: [36, 43, 48, 53, 57, 62],
  },
  {
    id: 'drop-b',
    sevenString: false,
    strings: 'B1 F#2 B2 E3 G#3 C#4',
    midi: [35, 42, 47, 52, 56, 61],
  },
  {
    id: 'drop-b',
    sevenString: true,
    strings: 'F#1 B1 F#2 B2 E3 G#3 C#4',
    midi: [30, 35, 42, 47, 52, 56, 61],
  },
  {
    id: 'open-g',
    sevenString: false,
    strings: 'D2 G2 D3 G3 B3 D4',
    midi: [38, 43, 50, 55, 59, 62],
  },
  {
    id: 'open-d',
    sevenString: false,
    strings: 'D2 A2 D3 F#3 A3 D4',
    midi: [38, 45, 50, 54, 57, 62],
  },
  {
    id: 'open-e',
    sevenString: false,
    strings: 'E2 B2 E3 G#3 B3 E4',
    midi: [40, 47, 52, 56, 59, 64],
  },
  {
    id: 'open-a',
    sevenString: false,
    strings: 'E2 A2 E3 A3 C#4 E4',
    midi: [40, 45, 52, 57, 61, 64],
  },
  {
    id: 'open-c',
    sevenString: false,
    strings: 'C2 G2 C3 G3 C4 E4',
    midi: [36, 43, 48, 55, 60, 64],
  },
]
