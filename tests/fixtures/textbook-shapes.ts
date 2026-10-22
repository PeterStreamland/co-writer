// Golden fixture: the textbook shape for 30 common chords in standard tuning,
// as a chord book prints them (lowest string first, x for muted). The
// playability score must put each in its chord's top five (Phase 3 exit
// criterion). Claude wrote this list in place of one from David (DECISIONS,
// 2026-10-22); never edit it to make a test pass: ask David.
export const textbookShapes: [chord: string, shape: string][] = [
  // Major: open, then barre.
  ['C', 'x32010'],
  ['D', 'xx0232'],
  ['E', '022100'],
  ['F', '133211'],
  ['G', '320003'],
  ['A', 'x02220'],
  ['B', 'x24442'],
  ['Bb', 'x13331'],
  // Minor.
  ['Cm', 'x35543'],
  ['Dm', 'xx0231'],
  ['Em', '022000'],
  ['Fm', '133111'],
  ['Gm', '355333'],
  ['Am', 'x02210'],
  ['Bm', 'x24432'],
  ['F#m', '244222'],
  // Dominant 7th.
  ['C7', 'x32310'],
  ['D7', 'xx0212'],
  ['E7', '020100'],
  ['G7', '320001'],
  ['A7', 'x02020'],
  ['B7', 'x21202'],
  // Major and minor 7th.
  ['Cmaj7', 'x32000'],
  ['Fmaj7', 'xx3210'],
  ['Am7', 'x02010'],
  ['Dm7', 'xx0211'],
  ['Em7', '020000'],
  // Suspended and power chords.
  ['Dsus4', 'xx0233'],
  ['Asus2', 'x02200'],
  ['E5', '022xxx'],
]
