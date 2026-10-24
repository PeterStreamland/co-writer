// Golden fixture: stepping a chord through its inversions (PLAN Phase 7
// task 9, David's request). Never edit this to make a test pass: ask David.
// Each case starts from a chord and its notes, lowest first, and steps
// ▲ (up) or ▼ (down) once per entry. Each step puts the next chord tone in
// the bass, nearest the bass before, and stacks the other tones closely
// above it, so C goes C, C/E, C/G, then C an octave up. The label names
// the inversion and, once a step passes root position, the octaves moved.

export type InversionStepFixture = {
  name: string
  chord: string
  notes: string
  way: 'up' | 'down'
  steps: { chord: string; notes: string; label: string }[]
}

export const inversionSteps: InversionStepFixture[] = [
  {
    name: 'C up through its inversions to the next octave',
    chord: 'C',
    notes: 'C4 E4 G4',
    way: 'up',
    steps: [
      { chord: 'C/E', notes: 'E4 G4 C5', label: '1st inversion' },
      { chord: 'C/G', notes: 'G4 C5 E5', label: '2nd inversion' },
      { chord: 'C', notes: 'C5 E5 G5', label: '+1 octave' },
      { chord: 'C/E', notes: 'E5 G5 C6', label: '1st inversion, +1 octave' },
    ],
  },
  {
    name: 'C down through its inversions to the octave below',
    chord: 'C',
    notes: 'C4 E4 G4',
    way: 'down',
    steps: [
      { chord: 'C/G', notes: 'G3 C4 E4', label: '2nd inversion, −1 octave' },
      { chord: 'C/E', notes: 'E3 G3 C4', label: '1st inversion, −1 octave' },
      { chord: 'C', notes: 'C3 E3 G3', label: '−1 octave' },
    ],
  },
  {
    name: 'a 7th chord has four positions, the 7th in the bass last',
    chord: 'G7',
    notes: 'G3 B3 D4 F4',
    way: 'up',
    steps: [
      { chord: 'G7/B', notes: 'B3 D4 F4 G4', label: '1st inversion' },
      { chord: 'G7/D', notes: 'D4 F4 G4 B4', label: '2nd inversion' },
      { chord: 'G7/F', notes: 'F4 G4 B4 D5', label: '3rd inversion' },
      { chord: 'G7', notes: 'G4 B4 D5 F5', label: '+1 octave' },
    ],
  },
  {
    name: 'flats keep their spelling: A♭ over C, then over E♭',
    chord: 'Ab',
    notes: 'Ab3 C4 Eb4',
    way: 'up',
    steps: [
      { chord: 'Ab/C', notes: 'C4 Eb4 Ab4', label: '1st inversion' },
      { chord: 'Ab/Eb', notes: 'Eb4 Ab4 C5', label: '2nd inversion' },
    ],
  },
  {
    name: 'a chord entered in an inversion steps on from there',
    chord: 'Am/C',
    notes: 'C4 E4 A4',
    way: 'down',
    steps: [
      { chord: 'Am', notes: 'A3 C4 E4', label: 'root position' },
      { chord: 'Am/E', notes: 'E3 A3 C4', label: '2nd inversion, −1 octave' },
    ],
  },
  {
    name: 'a sus4 chord inverts on its 4th',
    chord: 'Dsus4',
    notes: 'D4 G4 A4',
    way: 'up',
    steps: [
      { chord: 'Dsus4/G', notes: 'G4 A4 D5', label: '1st inversion' },
      { chord: 'Dsus4/A', notes: 'A4 D5 G5', label: '2nd inversion' },
      { chord: 'Dsus4', notes: 'D5 G5 A5', label: '+1 octave' },
    ],
  },
  {
    name: 'a power chord has two positions',
    chord: 'E5',
    notes: 'E2 B2',
    way: 'up',
    steps: [
      { chord: 'E5/B', notes: 'B2 E3', label: '1st inversion' },
      { chord: 'E5', notes: 'E3 B3', label: '+1 octave' },
    ],
  },
  {
    name: 'a 9th stays on top of each inversion',
    chord: 'Cadd9',
    notes: 'C4 E4 G4 D5',
    way: 'up',
    steps: [{ chord: 'Cadd9/E', notes: 'E4 G4 C5 D5', label: '1st inversion' }],
  },
]
