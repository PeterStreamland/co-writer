// Golden fixture: how notes played on a MIDI keyboard are spelled and named
// in a key. MIDI sends only pitch numbers (middle C = 60), so spelling comes
// from the key: scale notes as the scale spells them, other notes as the
// chord they make reads best in the key (SPEC 4: chromatic chords spelled by
// function). Written out by hand; never edit this to make a test pass: ask
// David.
export const playedNotes: {
  key: string // tonic and scale id
  midi: number[]
  spelled: string // lowest first, ASCII accidentals
  name?: string // the primary chord name, if two or more pitch classes
}[] = [
  { key: 'C major', midi: [60, 64, 67], spelled: 'C4 E4 G4', name: 'C' },
  { key: 'C major', midi: [58, 62, 65], spelled: 'Bb3 D4 F4', name: 'Bb' },
  { key: 'C major', midi: [56, 60, 63], spelled: 'Ab3 C4 Eb4', name: 'Ab' },
  {
    key: 'C major',
    midi: [52, 56, 59, 62],
    spelled: 'E3 G#3 B3 D4',
    name: 'E7',
  },
  {
    key: 'C major',
    midi: [56, 59, 62, 65],
    spelled: 'G#3 B3 D4 F4',
    name: 'G#dim7',
  },
  { key: 'C major', midi: [64, 67, 72], spelled: 'E4 G4 C5', name: 'C/E' },
  {
    key: 'C major',
    midi: [48, 55, 64, 69],
    spelled: 'C3 G3 E4 A4',
    name: 'C6',
  },
  {
    key: 'E natural-minor',
    midi: [50, 54, 57],
    spelled: 'D3 F#3 A3',
    name: 'D',
  },
  {
    key: 'E natural-minor',
    midi: [47, 51, 54],
    spelled: 'B2 D#3 F#3',
    name: 'B',
  },
  { key: 'Eb major', midi: [55, 59, 62], spelled: 'G3 B3 D4', name: 'G' },
  { key: 'C major', midi: [60], spelled: 'C4' },
  { key: 'C major', midi: [61], spelled: 'C#4' },
  { key: 'F major', midi: [66], spelled: 'Gb4' },
  { key: 'E natural-minor', midi: [40, 47], spelled: 'E2 B2', name: 'E5' },
]
