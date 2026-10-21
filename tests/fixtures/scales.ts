// Golden fixture: scales spelled out by hand.
// Never edit this to make a test pass: ask David.
// ASCII accidentals: # sharp, b flat, ## double sharp, bb double flat.
// Seven-note scales spell one note per letter, so every mode is a rotation of
// its parent scale (C altered is C Db Eb Fb Gb Ab Bb, mode 7 of Db melodic minor).

// Every core scale on C, by scale id.
export const scalesOnC: Record<string, string[]> = {
  // Major and its modes
  major: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
  dorian: ['C', 'D', 'Eb', 'F', 'G', 'A', 'Bb'],
  phrygian: ['C', 'Db', 'Eb', 'F', 'G', 'Ab', 'Bb'],
  lydian: ['C', 'D', 'E', 'F#', 'G', 'A', 'B'],
  mixolydian: ['C', 'D', 'E', 'F', 'G', 'A', 'Bb'],
  'natural-minor': ['C', 'D', 'Eb', 'F', 'G', 'Ab', 'Bb'],
  locrian: ['C', 'Db', 'Eb', 'F', 'Gb', 'Ab', 'Bb'],
  // Harmonic minor and its modes
  'harmonic-minor': ['C', 'D', 'Eb', 'F', 'G', 'Ab', 'B'],
  'locrian-natural-6': ['C', 'Db', 'Eb', 'F', 'Gb', 'A', 'Bb'],
  'ionian-sharp-5': ['C', 'D', 'E', 'F', 'G#', 'A', 'B'],
  'dorian-sharp-4': ['C', 'D', 'Eb', 'F#', 'G', 'A', 'Bb'],
  'phrygian-dominant': ['C', 'Db', 'E', 'F', 'G', 'Ab', 'Bb'],
  'lydian-sharp-2': ['C', 'D#', 'E', 'F#', 'G', 'A', 'B'],
  ultralocrian: ['C', 'Db', 'Eb', 'Fb', 'Gb', 'Ab', 'Bbb'],
  // Melodic minor (ascending, as in jazz) and its modes
  'melodic-minor': ['C', 'D', 'Eb', 'F', 'G', 'A', 'B'],
  'dorian-flat-2': ['C', 'Db', 'Eb', 'F', 'G', 'A', 'Bb'],
  'lydian-augmented': ['C', 'D', 'E', 'F#', 'G#', 'A', 'B'],
  'lydian-dominant': ['C', 'D', 'E', 'F#', 'G', 'A', 'Bb'],
  'mixolydian-flat-6': ['C', 'D', 'E', 'F', 'G', 'Ab', 'Bb'],
  'locrian-natural-2': ['C', 'D', 'Eb', 'F', 'Gb', 'Ab', 'Bb'],
  altered: ['C', 'Db', 'Eb', 'Fb', 'Gb', 'Ab', 'Bb'],
  // Pentatonics and blues
  'major-pentatonic': ['C', 'D', 'E', 'G', 'A'],
  'minor-pentatonic': ['C', 'Eb', 'F', 'G', 'Bb'],
  'minor-blues': ['C', 'Eb', 'F', 'Gb', 'G', 'Bb'],
  'major-blues': ['C', 'D', 'Eb', 'E', 'G', 'A'],
  // Symmetrical scales
  'whole-tone': ['C', 'D', 'E', 'F#', 'G#', 'A#'],
  'diminished-whole-half': ['C', 'D', 'Eb', 'F', 'Gb', 'Ab', 'A', 'B'],
  'diminished-half-whole': ['C', 'Db', 'Eb', 'E', 'F#', 'G', 'A', 'Bb'],
  // Bebop
  'bebop-dominant': ['C', 'D', 'E', 'F', 'G', 'A', 'Bb', 'B'],
  'bebop-major': ['C', 'D', 'E', 'F', 'G', 'G#', 'A', 'B'],
  'bebop-dorian': ['C', 'D', 'Eb', 'E', 'F', 'G', 'A', 'Bb'],
}

// Functional spelling in awkward keys (SPEC 4 and 13).
export const awkwardScales: {
  tonic: string
  scale: string
  notes: string[]
}[] = [
  {
    tonic: 'D#',
    scale: 'harmonic-minor',
    notes: ['D#', 'E#', 'F#', 'G#', 'A#', 'B', 'C##'],
  },
  {
    tonic: 'Ab',
    scale: 'natural-minor',
    notes: ['Ab', 'Bb', 'Cb', 'Db', 'Eb', 'Fb', 'Gb'],
  },
  {
    tonic: 'G#',
    scale: 'melodic-minor',
    notes: ['G#', 'A#', 'B', 'C#', 'D#', 'E#', 'F##'],
  },
  {
    tonic: 'E',
    scale: 'dorian',
    notes: ['E', 'F#', 'G', 'A', 'B', 'C#', 'D'],
  },
  {
    tonic: 'G#',
    scale: 'phrygian-dominant',
    notes: ['G#', 'A', 'B#', 'C#', 'D#', 'E', 'F#'],
  },
  {
    tonic: 'G#',
    scale: 'ultralocrian',
    notes: ['G#', 'A', 'B', 'C', 'D', 'E', 'F'],
  },
  {
    tonic: 'Gb',
    scale: 'lydian',
    notes: ['Gb', 'Ab', 'Bb', 'C', 'Db', 'Eb', 'F'],
  },
  {
    tonic: 'F#',
    scale: 'minor-blues',
    notes: ['F#', 'A', 'B', 'C', 'C#', 'E'],
  },
]

// A mode's parent scale, whose key signature it shows (SPEC 4: E Dorian shows
// two sharps, from D major).
export const parentScales: {
  tonic: string
  mode: string
  parent: { tonic: string; mode: string }
}[] = [
  { tonic: 'E', mode: 'dorian', parent: { tonic: 'D', mode: 'major' } },
  { tonic: 'A', mode: 'natural-minor', parent: { tonic: 'C', mode: 'major' } },
  { tonic: 'B', mode: 'locrian', parent: { tonic: 'C', mode: 'major' } },
  { tonic: 'F', mode: 'lydian', parent: { tonic: 'C', mode: 'major' } },
  { tonic: 'A', mode: 'mixolydian', parent: { tonic: 'D', mode: 'major' } },
  { tonic: 'C#', mode: 'phrygian', parent: { tonic: 'A', mode: 'major' } },
  { tonic: 'C', mode: 'major', parent: { tonic: 'C', mode: 'major' } },
  {
    tonic: 'E',
    mode: 'phrygian-dominant',
    parent: { tonic: 'A', mode: 'harmonic-minor' },
  },
  {
    tonic: 'D',
    mode: 'lydian-dominant',
    parent: { tonic: 'A', mode: 'melodic-minor' },
  },
  {
    tonic: 'G',
    mode: 'altered',
    parent: { tonic: 'Ab', mode: 'melodic-minor' },
  },
  {
    tonic: 'B#',
    mode: 'ultralocrian',
    parent: { tonic: 'C#', mode: 'harmonic-minor' },
  },
]
