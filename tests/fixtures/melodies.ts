// Golden fixture: entering a melody (SPEC 7.2). Never edit this to make a
// test pass: ask David.
// Lengths and onsets are fractions of a whole note: a crotchet is 1/4 and
// a quaver triplet 1/12. Notes are written with their octave (middle C is
// C4) and keep the spelling they were typed in.

type F = { n: number; d: number }
export type MelodyFixtureNote = { note: string; onset: F; length: F }

// Typing note names: each takes the note value chosen, r is a rest and -
// holds the note before for one more. A note typed without an octave goes
// to the nearer one, within a 4th of the note before by letter, as a
// singer reads it (C up to F, C down to G); the first is in octave 4.
export type TypedFixture = {
  text: string
  value: F
  notes: MelodyFixtureNote[]
  unknown?: string[]
}

const q = { n: 1, d: 4 }
const e = { n: 1, d: 8 }

export const typed: TypedFixture[] = [
  {
    text: 'E4 F G A B C',
    value: q,
    notes: [
      { note: 'E4', onset: { n: 0, d: 1 }, length: q },
      { note: 'F4', onset: { n: 1, d: 4 }, length: q },
      { note: 'G4', onset: { n: 1, d: 2 }, length: q },
      { note: 'A4', onset: { n: 3, d: 4 }, length: q },
      { note: 'B4', onset: { n: 1, d: 1 }, length: q },
      // B up a step to C crosses into octave 5.
      { note: 'C5', onset: { n: 5, d: 4 }, length: q },
    ],
  },
  {
    // No octave on the first note: octave 4.
    text: 'B A G',
    value: e,
    notes: [
      { note: 'B4', onset: { n: 0, d: 1 }, length: e },
      { note: 'A4', onset: { n: 1, d: 8 }, length: e },
      { note: 'G4', onset: { n: 1, d: 4 }, length: e },
    ],
  },
  {
    // C to G is nearer down a 4th than up a 5th; C to F is up a 4th.
    text: 'C4 G C F',
    value: q,
    notes: [
      { note: 'C4', onset: { n: 0, d: 1 }, length: q },
      { note: 'G3', onset: { n: 1, d: 4 }, length: q },
      { note: 'C4', onset: { n: 1, d: 2 }, length: q },
      { note: 'F4', onset: { n: 3, d: 4 }, length: q },
    ],
  },
  {
    // Spelling is kept as typed, ASCII or symbols: F♯ then G♭, not F♯ F♯.
    text: 'F#4 Gb E♭5 D Fx',
    value: q,
    notes: [
      { note: 'F♯4', onset: { n: 0, d: 1 }, length: q },
      { note: 'G♭4', onset: { n: 1, d: 4 }, length: q },
      { note: 'E♭5', onset: { n: 1, d: 2 }, length: q },
      { note: 'D5', onset: { n: 3, d: 4 }, length: q },
      // D up to F𝄪 is a 3rd by letter, so it stays above.
      { note: 'F𝄪5', onset: { n: 1, d: 1 }, length: q },
    ],
  },
  {
    // Down a step across the octave line: C4 to B3.
    text: 'C4 B A',
    value: q,
    notes: [
      { note: 'C4', onset: { n: 0, d: 1 }, length: q },
      { note: 'B3', onset: { n: 1, d: 4 }, length: q },
      { note: 'A3', onset: { n: 1, d: 2 }, length: q },
    ],
  },
  {
    // - holds E for a minim; r rests a crotchet before G.
    text: 'E4 - F r G',
    value: q,
    notes: [
      { note: 'E4', onset: { n: 0, d: 1 }, length: { n: 1, d: 2 } },
      { note: 'F4', onset: { n: 1, d: 2 }, length: q },
      { note: 'G4', onset: { n: 1, d: 1 }, length: q },
    ],
  },
  {
    // Commas work as spaces; words it can't read are listed, not guessed.
    text: 'E4, H5, F',
    value: q,
    notes: [
      { note: 'E4', onset: { n: 0, d: 1 }, length: q },
      { note: 'F4', onset: { n: 1, d: 4 }, length: q },
    ],
    unknown: ['H5'],
  },
  {
    // Quaver triplets: three to a crotchet.
    text: 'C5 D E F',
    value: { n: 1, d: 12 },
    notes: [
      { note: 'C5', onset: { n: 0, d: 1 }, length: { n: 1, d: 12 } },
      { note: 'D5', onset: { n: 1, d: 12 }, length: { n: 1, d: 12 } },
      { note: 'E5', onset: { n: 1, d: 6 }, length: { n: 1, d: 12 } },
      { note: 'F5', onset: { n: 1, d: 4 }, length: { n: 1, d: 12 } },
    ],
  },
]

// Recording on MIDI: key presses in seconds from the end of the count-in,
// snapped to the grid. One note sounds at a time: notes struck together
// keep the highest, and a note still held when the next starts ends there.
// A note is never shorter than one grid step, and a note let go a grid
// step or less before the next one lasts until it, as notation writes
// detached playing. A longer gap is a rest. Notes outside the key are
// spelled as the lines spell them: raised going up, lowered coming down.
export type RecordedFixture = {
  name: string
  key: string // tonic and mode, as 'C major'
  meter: string
  bpm: number
  grid: '1/16' | '1/8' | 'triplets' | 'off'
  played: { midi: number; on: number; off: number }[]
  end?: F // the section's end: recording stops there
  notes: MelodyFixtureNote[]
}

export const recorded: RecordedFixture[] = [
  {
    // At ♩ = 120 a crotchet is half a second.
    name: 'slightly early and late presses snap to semiquavers',
    key: 'C major',
    meter: '4/4',
    bpm: 120,
    grid: '1/16',
    played: [
      { midi: 60, on: 0.02, off: 0.48 },
      { midi: 62, on: 0.51, off: 0.74 },
      { midi: 64, on: 0.76, off: 1.02 },
    ],
    notes: [
      { note: 'C4', onset: { n: 0, d: 1 }, length: q },
      { note: 'D4', onset: { n: 1, d: 4 }, length: e },
      { note: 'E4', onset: { n: 3, d: 8 }, length: e },
    ],
  },
  {
    name: 'quavers snap to quavers',
    key: 'C major',
    meter: '4/4',
    bpm: 120,
    grid: '1/8',
    played: [
      { midi: 67, on: 0.1, off: 0.3 },
      { midi: 65, on: 0.3, off: 0.45 },
    ],
    notes: [
      { note: 'G4', onset: { n: 0, d: 1 }, length: e },
      { note: 'F4', onset: { n: 1, d: 8 }, length: e },
    ],
  },
  {
    // Triplet quavers at ♩ = 60 are a third of a second each.
    name: 'quaver triplets',
    key: 'C major',
    meter: '4/4',
    bpm: 60,
    grid: 'triplets',
    played: [
      { midi: 72, on: 0.01, off: 0.3 },
      { midi: 74, on: 0.35, off: 0.62 },
      { midi: 76, on: 0.66, off: 0.98 },
    ],
    notes: [
      { note: 'C5', onset: { n: 0, d: 1 }, length: { n: 1, d: 12 } },
      { note: 'D5', onset: { n: 1, d: 12 }, length: { n: 1, d: 12 } },
      { note: 'E5', onset: { n: 1, d: 6 }, length: { n: 1, d: 12 } },
    ],
  },
  {
    name: 'legato: a note held into the next ends there',
    key: 'C major',
    meter: '4/4',
    bpm: 120,
    grid: '1/16',
    played: [
      { midi: 60, on: 0, off: 0.6 },
      { midi: 62, on: 0.5, off: 1.0 },
    ],
    notes: [
      { note: 'C4', onset: { n: 0, d: 1 }, length: q },
      { note: 'D4', onset: { n: 1, d: 4 }, length: q },
    ],
  },
  {
    // Crotchets let go a little early still read as crotchets; the gap
    // after G is a quaver, longer than a semiquaver step, so it is a rest.
    name: 'detached notes close up; a real gap is a rest',
    key: 'C major',
    meter: '4/4',
    bpm: 120,
    grid: '1/16',
    played: [
      { midi: 64, on: 0, off: 0.4 },
      { midi: 65, on: 0.5, off: 0.9 },
      { midi: 67, on: 1.0, off: 1.25 },
      { midi: 69, on: 1.5, off: 1.9 },
    ],
    notes: [
      { note: 'E4', onset: { n: 0, d: 1 }, length: q },
      { note: 'F4', onset: { n: 1, d: 4 }, length: q },
      { note: 'G4', onset: { n: 1, d: 2 }, length: e },
      { note: 'A4', onset: { n: 3, d: 4 }, length: { n: 3, d: 16 } },
    ],
  },
  {
    name: 'two notes struck together keep the higher',
    key: 'C major',
    meter: '4/4',
    bpm: 120,
    grid: '1/16',
    played: [
      { midi: 60, on: 0, off: 0.5 },
      { midi: 67, on: 0.01, off: 0.5 },
    ],
    notes: [{ note: 'G4', onset: { n: 0, d: 1 }, length: q }],
  },
  {
    name: 'a quick tap lasts one grid step',
    key: 'C major',
    meter: '4/4',
    bpm: 120,
    grid: '1/16',
    played: [{ midi: 69, on: 0.5, off: 0.51 }],
    notes: [{ note: 'A4', onset: { n: 1, d: 4 }, length: { n: 1, d: 16 } }],
  },
  {
    // The section is two beats long: a note running past its end is cut
    // there, and one starting after it is dropped.
    name: 'recording stops at the end of the section',
    key: 'C major',
    meter: '4/4',
    bpm: 120,
    grid: '1/16',
    end: { n: 1, d: 2 },
    played: [
      { midi: 64, on: 0.9, off: 1.4 },
      { midi: 65, on: 1.1, off: 1.3 },
    ],
    notes: [{ note: 'E4', onset: { n: 7, d: 16 }, length: { n: 1, d: 16 } }],
  },
  {
    // In 6/8 the tempo counts dotted crotchets: at 60 one lasts a second,
    // so a quaver is a third of a second.
    name: '6/8 counts in dotted crotchets',
    key: 'G major',
    meter: '6/8',
    bpm: 60,
    grid: '1/8',
    played: [
      { midi: 67, on: 0, off: 0.3 },
      { midi: 71, on: 0.34, off: 0.95 },
      { midi: 74, on: 1.0, off: 1.3 },
    ],
    notes: [
      { note: 'G4', onset: { n: 0, d: 1 }, length: e },
      { note: 'B4', onset: { n: 1, d: 8 }, length: { n: 1, d: 4 } },
      { note: 'D5', onset: { n: 3, d: 8 }, length: e },
    ],
  },
  {
    name: 'chromatic notes: sharps going up, flats coming down',
    key: 'C major',
    meter: '4/4',
    bpm: 120,
    grid: '1/8',
    played: [
      { midi: 60, on: 0, off: 0.25 },
      { midi: 61, on: 0.25, off: 0.5 },
      { midi: 62, on: 0.5, off: 0.75 },
      { midi: 63, on: 0.75, off: 1.0 },
      { midi: 62, on: 1.0, off: 1.25 },
      { midi: 61, on: 1.25, off: 1.5 },
      { midi: 60, on: 1.5, off: 1.75 },
    ],
    notes: [
      { note: 'C4', onset: { n: 0, d: 1 }, length: e },
      { note: 'C♯4', onset: { n: 1, d: 8 }, length: e },
      { note: 'D4', onset: { n: 1, d: 4 }, length: e },
      // E♭ is the turning point: it comes down to D, so it is lowered.
      { note: 'E♭4', onset: { n: 3, d: 8 }, length: e },
      { note: 'D4', onset: { n: 1, d: 2 }, length: e },
      { note: 'D♭4', onset: { n: 5, d: 8 }, length: e },
      { note: 'C4', onset: { n: 3, d: 4 }, length: e },
    ],
  },
  {
    // Scale notes take the key's spelling: B♭ in F major, E♯ in F♯ major.
    name: 'scale notes are spelled by the key',
    key: 'F♯ major',
    meter: '4/4',
    bpm: 120,
    grid: '1/8',
    played: [
      { midi: 66, on: 0, off: 0.25 },
      { midi: 65, on: 0.25, off: 0.5 },
      { midi: 66, on: 0.5, off: 0.75 },
    ],
    notes: [
      { note: 'F♯4', onset: { n: 0, d: 1 }, length: e },
      { note: 'E♯4', onset: { n: 1, d: 8 }, length: e },
      { note: 'F♯4', onset: { n: 1, d: 4 }, length: e },
    ],
  },
]

// Which bar each note starts in, in 3/4 with bar 2 in 2/4: bars start at
// 0, 3/4 and 5/4.
export const bars = {
  meter: '3/4',
  barMeters: { 2: '2/4' },
  onsets: [
    { n: 0, d: 1 },
    { n: 1, d: 2 },
    { n: 3, d: 4 },
    { n: 1, d: 1 },
    { n: 5, d: 4 },
    { n: 2, d: 1 },
  ],
  // bar, and where in it, for each onset
  placed: [
    { bar: 1, offset: { n: 0, d: 1 } },
    { bar: 1, offset: { n: 1, d: 2 } },
    { bar: 2, offset: { n: 0, d: 1 } },
    { bar: 2, offset: { n: 1, d: 4 } },
    { bar: 3, offset: { n: 0, d: 1 } },
    { bar: 4, offset: { n: 0, d: 1 } },
  ],
}
