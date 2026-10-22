// Golden fixture: ten well-known progressions and the chord that really
// comes next, written out by hand (PLAN Phase 4 exit criterion). Never edit
// this to make a test pass: ask David.
// Keys and chords are typed in ASCII (# sharp, b flat). For each row, the
// next chord must be among the suggestions shown for the matching style.

export const knownProgressions: {
  name: string
  style: string
  key: string
  chords: string[]
  next: string
}[] = [
  {
    name: 'I–V–vi–IV',
    style: 'pop',
    key: 'C major',
    chords: ['C', 'G', 'Am'],
    next: 'F',
  },
  {
    name: 'vi–IV–I–V',
    style: 'pop',
    key: 'C major',
    chords: ['Am', 'F', 'C'],
    next: 'G',
  },
  {
    name: '1950s I–vi–IV–V',
    style: 'pop',
    key: 'G major',
    chords: ['G', 'Em', 'C'],
    next: 'D',
  },
  {
    name: 'ii–V–I',
    style: 'pop',
    key: 'C major',
    chords: ['Dm', 'G7'],
    next: 'C',
  },
  {
    name: 'I–V7/vi–vi',
    style: 'pop',
    key: 'C major',
    chords: ['C', 'E7'],
    next: 'Am',
  },
  {
    name: 'I–♭VII–IV',
    style: 'rock',
    key: 'D major',
    chords: ['D', 'C'],
    next: 'G',
  },
  {
    name: 'Mixolydian vamp I–♭VII–IV–I',
    style: 'rock',
    key: 'A major',
    chords: ['A', 'G', 'D'],
    next: 'A',
  },
  {
    name: 'Aeolian i–♭VII–♭VI–♭VII',
    style: 'rock',
    key: 'A minor',
    chords: ['Am', 'G', 'F'],
    next: 'G',
  },
  {
    name: 'Power-chord i–♭VI–♭VII–i',
    style: 'metal',
    key: 'E minor',
    chords: ['E5', 'C5', 'D5'],
    next: 'E5',
  },
  {
    name: 'Phrygian i–♭II–i',
    style: 'metal',
    key: 'E minor',
    chords: ['Em', 'F'],
    next: 'Em',
  },
]
