// Golden fixture: notes for a note's place in the melody (David's request,
// 2026-10-24). Never edit this to make a test pass: ask David.
// A note's place is offered the notes that could follow the notes before
// it, at its start and for its length, re-ranked by how they lead into the
// note after: stepping into it ranks higher, leaping away from it lower.
// Melodies are typed as the Melody tab reads them, each word a crotchet,
// over C major chords a bar each.

export type InPlaceFixture = {
  name: string
  chords: string[]
  melody: string
  index: number // the note whose place it is, from 0
  top?: string
  above?: [string, string][]
}

export const inPlace: InPlaceFixture[] = [
  {
    // G A G over C: F, the lower neighbour, steps back into G.
    name: 'a neighbour note',
    chords: ['C'],
    melody: 'G4 A4 G4',
    index: 1,
    top: 'F4',
  },
  {
    // E D C over C: C (a skip down from E, then into C) ranks above G,
    // which would leap a 5th down to C.
    name: 'stepping into the note after beats leaping from it',
    chords: ['C'],
    melody: 'E4 D4 C4',
    index: 1,
    above: [['C4', 'G4']],
  },
  {
    // The first note of C D: a tone of C to start on, and E steps down
    // into D.
    name: 'the first note',
    chords: ['C'],
    melody: 'C4 D4',
    index: 0,
    top: 'E4',
  },
]
