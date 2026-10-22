// Golden fixture: suggestion explanations, written out by hand (PLAN Phase 4
// task 6, SPEC 6.2). Never edit this to make a test pass: ask David.
// Keys and chords are typed in ASCII (# sharp, b flat); the explanation is
// written as displayed, with ♯ and ♭.

export const explanations = [
  {
    key: 'C major',
    chord: 'E7',
    template:
      '{chord} is {numeral}, the dominant of {target}, pulling towards {resolution}; its {leadingNote} is {target}’s leading note.',
    values: {
      target: 'A minor',
      resolution: 'Am',
      leadingNote: 'G♯',
    },
    explanation:
      'E7 is V7/vi, the dominant of A minor, pulling towards Am; its G♯ is A minor’s leading note.',
  },
]
