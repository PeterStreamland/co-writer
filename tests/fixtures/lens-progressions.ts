// The test progressions for the voicing lenses (PLAN Phase 5 exit
// criteria): every lens runs through each. Chord symbols in ASCII.

export const lensProgressions: { key: string; chords: string }[] = [
  { key: 'C major', chords: 'C Am F G C' },
  { key: 'C major', chords: 'C F G7 C' },
  { key: 'C major', chords: 'Dm7 G7 Cmaj7' },
  { key: 'C major', chords: 'C G/B Am F C/G G7 C' },
  { key: 'G major', chords: 'G Em C D G' },
  { key: 'D major', chords: 'D A Bm G D' },
  { key: 'F major', chords: 'F Bb C7 F' },
  { key: 'A minor', chords: 'Am Dm E7 Am' },
  { key: 'E minor', chords: 'Em C G D Em' },
  { key: 'E minor', chords: 'Em F#dim B7 Em' },
  { key: 'B minor', chords: 'Bm G D A Bm' },
  { key: 'C major', chords: 'C E7 Am F Fm C' },
  { key: 'Eb major', chords: 'Eb Cm Ab Bb7 Eb' },
  // Added at the Phase 5 gate: leading-note chords, a sus move and V–VI,
  // where a lens may move more than plain root position on its own; the
  // movement criterion counts the average over the whole set (David's
  // choice).
  { key: 'C major', chords: 'C Bdim/D C/E' },
  { key: 'A minor', chords: 'Am G#dim7 Am' },
  { key: 'C major', chords: 'C Csus4 C' },
  { key: 'A minor', chords: 'Am E F' },
  { key: 'C major', chords: 'C F#dim7 G' },
  { key: 'G major', chords: 'G D/F# Em C' },
]
