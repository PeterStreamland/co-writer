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
  {
    id: 'drop-d',
    sevenString: true,
    strings: 'B1 D2 A2 D3 G3 B3 E4',
    midi: [35, 38, 45, 50, 55, 59, 64],
  },
]
