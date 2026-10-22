// Golden fixture: textbook passing chords between two chords, written out by
// hand (PLAN Phase 4 task 7 and exit criterion, SPEC 6.7). Never edit this to
// make a test pass: ask David.
// Keys and chords are typed in ASCII (# sharp, b flat). Each chord listed in
// `shown` must be among the passing chords shown for that style ('none' is
// no style), and `first` must rank first.

export const passingChords: {
  key: string
  style: string
  from: string
  to: string
  shown: string[]
  first?: string
}[] = [
  // The plan's three: V7/V and ii between I and V, V7 between ii and I.
  {
    key: 'C major',
    style: 'none',
    from: 'C',
    to: 'G',
    shown: ['D7', 'Dm'],
    first: 'Dm',
  },
  {
    key: 'C major',
    style: 'pop',
    from: 'C',
    to: 'G',
    shown: ['D7', 'Dm'],
    first: 'Dm',
  },
  { key: 'C major', style: 'pop', from: 'Dm', to: 'C', shown: ['G7', 'G'] },
  // A secondary dominant into the chord it points at.
  {
    key: 'C major',
    style: 'pop',
    from: 'C',
    to: 'Am',
    shown: ['E7'],
    first: 'E7',
  },
  {
    key: 'C major',
    style: 'pop',
    from: 'C',
    to: 'F',
    shown: ['C7'],
    first: 'C7',
  },
  // A leading-note diminished 7th into V.
  { key: 'C major', style: 'classical', from: 'C', to: 'G', shown: ['F#dim7'] },
  // Jazz: ii7 and V7/V (comment corrected 2026-10-22 with David's go-ahead).
  { key: 'C major', style: 'jazz', from: 'C', to: 'G', shown: ['Dm7', 'D7'] },
  // Minor key: the dominant of iv.
  { key: 'E minor', style: 'metal', from: 'Em', to: 'Am', shown: ['E7'] },
]
