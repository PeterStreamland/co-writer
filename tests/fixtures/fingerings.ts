// Golden fixture: textbook guitar shapes the fingering search must find, and
// shapes it must never return, written as guitarists write them: lowest
// string first, x for a muted string, frets numbered from the nut (capo or
// not). Chords are named by what sounds. Written out by hand; never edit this
// to make a test pass: ask David.
export const fingeringShapes: {
  tuning: string
  sevenString: boolean
  capo?: number
  chord: string
  includes: string[]
  excludes?: string[]
}[] = [
  // Standard tuning: open chords, barre chords and slash chords.
  {
    tuning: 'standard',
    sevenString: false,
    chord: 'C',
    includes: ['x32010', 'x35553'],
    excludes: ['032010'],
  },
  {
    tuning: 'standard',
    sevenString: false,
    chord: 'A',
    includes: ['x02220', '577655'],
  },
  {
    tuning: 'standard',
    sevenString: false,
    chord: 'G',
    includes: ['320003', '320033', '355433'],
  },
  { tuning: 'standard', sevenString: false, chord: 'E', includes: ['022100'] },
  {
    tuning: 'standard',
    sevenString: false,
    chord: 'D',
    includes: ['xx0232', 'x57775'],
  },
  {
    tuning: 'standard',
    sevenString: false,
    chord: 'F',
    includes: ['133211', 'xx3211'],
  },
  {
    tuning: 'standard',
    sevenString: false,
    chord: 'Am',
    includes: ['x02210', '577555'],
  },
  {
    tuning: 'standard',
    sevenString: false,
    chord: 'Em',
    includes: ['022000'],
    excludes: ['022xxx'],
  },
  { tuning: 'standard', sevenString: false, chord: 'Dm', includes: ['xx0231'] },
  { tuning: 'standard', sevenString: false, chord: 'Bm', includes: ['x24432'] },
  { tuning: 'standard', sevenString: false, chord: 'E7', includes: ['020100'] },
  { tuning: 'standard', sevenString: false, chord: 'A7', includes: ['x02020'] },
  { tuning: 'standard', sevenString: false, chord: 'B7', includes: ['x21202'] },
  {
    tuning: 'standard',
    sevenString: false,
    chord: 'Cmaj7',
    includes: ['x32000'],
  },
  {
    tuning: 'standard',
    sevenString: false,
    chord: 'Fmaj7',
    includes: ['xx3210'],
  },
  {
    tuning: 'standard',
    sevenString: false,
    chord: 'Am7',
    includes: ['x02010'],
  },
  {
    tuning: 'standard',
    sevenString: false,
    chord: 'Dsus4',
    includes: ['xx0233'],
  },
  {
    tuning: 'standard',
    sevenString: false,
    chord: 'Dsus2',
    includes: ['xx0230'],
  },
  { tuning: 'standard', sevenString: false, chord: 'E5', includes: ['022xxx'] },
  {
    tuning: 'standard',
    sevenString: false,
    chord: 'C/E',
    includes: ['032010'],
    excludes: ['x32010'],
  },
  {
    tuning: 'standard',
    sevenString: false,
    chord: 'G/B',
    includes: ['x20003'],
  },
  {
    tuning: 'standard',
    sevenString: false,
    chord: 'D/F#',
    includes: ['2x0232'],
  },
  // Drop D (D2 A2 D3 G3 B3 E4).
  { tuning: 'drop-d', sevenString: false, chord: 'D5', includes: ['000xxx'] },
  { tuning: 'drop-d', sevenString: false, chord: 'D', includes: ['000232'] },
  { tuning: 'drop-d', sevenString: false, chord: 'Dm', includes: ['000231'] },
  { tuning: 'drop-d', sevenString: false, chord: 'G5', includes: ['555xxx'] },
  // 7-string B standard (B1 E2 A2 D3 G3 B3 E4).
  { tuning: 'standard', sevenString: true, chord: 'B5', includes: ['022xxxx'] },
  { tuning: 'standard', sevenString: true, chord: 'E', includes: ['x022100'] },
  { tuning: 'standard', sevenString: true, chord: 'C', includes: ['xx32010'] },
  { tuning: 'standard', sevenString: true, chord: 'Bm', includes: ['0x24432'] },
  // 7-string Drop D (A1 D2 A2 D3 G3 B3 E4).
  { tuning: 'drop-d', sevenString: true, chord: 'A5', includes: ['020xxxx'] },
  { tuning: 'drop-d', sevenString: true, chord: 'D', includes: ['x000232'] },
  // Capo 2 on standard: the G shape sounds A, the C shape sounds D.
  {
    tuning: 'standard',
    sevenString: false,
    capo: 2,
    chord: 'A',
    includes: ['542225'],
  },
  {
    tuning: 'standard',
    sevenString: false,
    capo: 2,
    chord: 'D',
    includes: ['x54232'],
  },
  // Capo 5 on Open G sounds G2 C3 G3 C4 E4 G4 open (SPEC 13: capo with an
  // alternate tuning): all six strings are C/G, the top five are C.
  {
    tuning: 'open-g',
    sevenString: false,
    capo: 5,
    chord: 'C/G',
    includes: ['555555'],
    excludes: ['x55555'],
  },
  {
    tuning: 'open-g',
    sevenString: false,
    capo: 5,
    chord: 'C',
    includes: ['x55555'],
    excludes: ['555555'],
  },
]
