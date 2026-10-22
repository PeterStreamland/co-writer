// Golden fixture: how styles move the next-chord ranking, written out by hand
// (PLAN Phase 4 task 3 and exit criterion, SPEC 6.6). Never edit this to make
// a test pass: ask David.
// Keys and chords are typed in ASCII (# sharp, b flat). In each row, the
// chord must rank higher (nearer the top) in the first style than in the
// second.

export const styleRankings: {
  key: string
  previous: string
  chord: string
  higherIn: string
  lowerIn: string
}[] = [
  // Metal leans on ♭VI and ♭VII far more than pop.
  {
    key: 'C major',
    previous: 'C',
    chord: 'Ab',
    higherIn: 'metal',
    lowerIn: 'pop',
  },
  {
    key: 'C major',
    previous: 'C',
    chord: 'Bb',
    higherIn: 'metal',
    lowerIn: 'pop',
  },
  {
    key: 'E minor',
    previous: 'Em',
    chord: 'C',
    higherIn: 'metal',
    lowerIn: 'pop',
  },
  {
    key: 'E minor',
    previous: 'Em',
    chord: 'D',
    higherIn: 'metal',
    lowerIn: 'pop',
  },
  // Phrygian's ♭II is a metal sound.
  {
    key: 'E minor',
    previous: 'Em',
    chord: 'F',
    higherIn: 'metal',
    lowerIn: 'pop',
  },
  // Rock loves the Mixolydian ♭VII.
  {
    key: 'C major',
    previous: 'C',
    chord: 'Bb',
    higherIn: 'rock',
    lowerIn: 'pop',
  },
  // Power-chord riffs belong to rock and metal.
  {
    key: 'E minor',
    previous: 'E5',
    chord: 'G5',
    higherIn: 'rock',
    lowerIn: 'pop',
  },
  {
    key: 'E minor',
    previous: 'E5',
    chord: 'C5',
    higherIn: 'metal',
    lowerIn: 'pop',
  },
  // Pop keeps secondary dominants and the deceptive cadence near the top.
  {
    key: 'C major',
    previous: 'C',
    chord: 'E7',
    higherIn: 'pop',
    lowerIn: 'metal',
  },
  {
    key: 'C major',
    previous: 'G7',
    chord: 'Am',
    higherIn: 'pop',
    lowerIn: 'metal',
  },
]
