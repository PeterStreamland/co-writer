// The core scale dictionary, as data. Intervals are spelled from the tonic;
// seven-note scales use one letter per degree, so each mode is an exact
// rotation of its parent and stacks thirds cleanly (SPEC 4). Ids are what
// Key.mode stores (SPEC 12).

export type ScaleFamily =
  | 'major-modes'
  | 'harmonic-minor-modes'
  | 'melodic-minor-modes'
  | 'pentatonic'
  | 'blues'
  | 'symmetrical'
  | 'bebop'
  | 'other'

export type ScaleData = {
  id: string
  name: string
  aliases: string[]
  family: ScaleFamily
  intervals: string[]
  // A mode of another scale: which degree of the parent it starts on.
  modeOf?: { scale: string; degree: number }
}

// The scales a picker shows first; the rest sit behind "More…" (SPEC 2).
export const COMMON_SCALE_IDS = [
  'major',
  'natural-minor',
  'harmonic-minor',
  'melodic-minor',
  'dorian',
  'phrygian',
  'lydian',
  'mixolydian',
  'locrian',
  'major-pentatonic',
  'minor-pentatonic',
  'minor-blues',
]

export const CORE_SCALES: ScaleData[] = [
  // Major and its modes
  {
    id: 'major',
    name: 'Major (Ionian)',
    aliases: ['ionian'],
    family: 'major-modes',
    intervals: ['P1', 'M2', 'M3', 'P4', 'P5', 'M6', 'M7'],
    modeOf: { scale: 'major', degree: 1 },
  },
  {
    id: 'dorian',
    name: 'Dorian',
    aliases: [],
    family: 'major-modes',
    intervals: ['P1', 'M2', 'm3', 'P4', 'P5', 'M6', 'm7'],
    modeOf: { scale: 'major', degree: 2 },
  },
  {
    id: 'phrygian',
    name: 'Phrygian',
    aliases: [],
    family: 'major-modes',
    intervals: ['P1', 'm2', 'm3', 'P4', 'P5', 'm6', 'm7'],
    modeOf: { scale: 'major', degree: 3 },
  },
  {
    id: 'lydian',
    name: 'Lydian',
    aliases: [],
    family: 'major-modes',
    intervals: ['P1', 'M2', 'M3', 'A4', 'P5', 'M6', 'M7'],
    modeOf: { scale: 'major', degree: 4 },
  },
  {
    id: 'mixolydian',
    name: 'Mixolydian',
    aliases: ['dominant'],
    family: 'major-modes',
    intervals: ['P1', 'M2', 'M3', 'P4', 'P5', 'M6', 'm7'],
    modeOf: { scale: 'major', degree: 5 },
  },
  {
    id: 'natural-minor',
    name: 'Natural minor (Aeolian)',
    aliases: ['minor', 'aeolian'],
    family: 'major-modes',
    intervals: ['P1', 'M2', 'm3', 'P4', 'P5', 'm6', 'm7'],
    modeOf: { scale: 'major', degree: 6 },
  },
  {
    id: 'locrian',
    name: 'Locrian',
    aliases: [],
    family: 'major-modes',
    intervals: ['P1', 'm2', 'm3', 'P4', 'd5', 'm6', 'm7'],
    modeOf: { scale: 'major', degree: 7 },
  },

  // Harmonic minor and its modes
  {
    id: 'harmonic-minor',
    name: 'Harmonic minor',
    aliases: [],
    family: 'harmonic-minor-modes',
    intervals: ['P1', 'M2', 'm3', 'P4', 'P5', 'm6', 'M7'],
    modeOf: { scale: 'harmonic-minor', degree: 1 },
  },
  {
    id: 'locrian-natural-6',
    name: 'Locrian ♮6',
    aliases: ['locrian 6', 'locrian sharp 6'],
    family: 'harmonic-minor-modes',
    intervals: ['P1', 'm2', 'm3', 'P4', 'd5', 'M6', 'm7'],
    modeOf: { scale: 'harmonic-minor', degree: 2 },
  },
  {
    id: 'ionian-sharp-5',
    name: 'Ionian ♯5',
    aliases: ['ionian augmented', 'major augmented'],
    family: 'harmonic-minor-modes',
    intervals: ['P1', 'M2', 'M3', 'P4', 'A5', 'M6', 'M7'],
    modeOf: { scale: 'harmonic-minor', degree: 3 },
  },
  {
    id: 'dorian-sharp-4',
    name: 'Dorian ♯4',
    aliases: ['ukrainian dorian', 'romanian minor'],
    family: 'harmonic-minor-modes',
    intervals: ['P1', 'M2', 'm3', 'A4', 'P5', 'M6', 'm7'],
    modeOf: { scale: 'harmonic-minor', degree: 4 },
  },
  {
    id: 'phrygian-dominant',
    name: 'Phrygian dominant',
    aliases: ['spanish', 'phrygian major'],
    family: 'harmonic-minor-modes',
    intervals: ['P1', 'm2', 'M3', 'P4', 'P5', 'm6', 'm7'],
    modeOf: { scale: 'harmonic-minor', degree: 5 },
  },
  {
    id: 'lydian-sharp-2',
    name: 'Lydian ♯2',
    aliases: ['lydian sharp 9'],
    family: 'harmonic-minor-modes',
    intervals: ['P1', 'A2', 'M3', 'A4', 'P5', 'M6', 'M7'],
    modeOf: { scale: 'harmonic-minor', degree: 6 },
  },
  {
    id: 'ultralocrian',
    name: 'Ultralocrian',
    aliases: ['super locrian double flat 7', 'altered diminished'],
    family: 'harmonic-minor-modes',
    intervals: ['P1', 'm2', 'm3', 'd4', 'd5', 'm6', 'd7'],
    modeOf: { scale: 'harmonic-minor', degree: 7 },
  },

  // Melodic minor (ascending, as in jazz) and its modes
  {
    id: 'melodic-minor',
    name: 'Melodic minor',
    aliases: ['jazz minor'],
    family: 'melodic-minor-modes',
    intervals: ['P1', 'M2', 'm3', 'P4', 'P5', 'M6', 'M7'],
    modeOf: { scale: 'melodic-minor', degree: 1 },
  },
  {
    id: 'dorian-flat-2',
    name: 'Dorian ♭2',
    aliases: ['phrygian natural 6', 'phrygian sharp 6'],
    family: 'melodic-minor-modes',
    intervals: ['P1', 'm2', 'm3', 'P4', 'P5', 'M6', 'm7'],
    modeOf: { scale: 'melodic-minor', degree: 2 },
  },
  {
    id: 'lydian-augmented',
    name: 'Lydian augmented',
    aliases: ['lydian sharp 5'],
    family: 'melodic-minor-modes',
    intervals: ['P1', 'M2', 'M3', 'A4', 'A5', 'M6', 'M7'],
    modeOf: { scale: 'melodic-minor', degree: 3 },
  },
  {
    id: 'lydian-dominant',
    name: 'Lydian dominant',
    aliases: ['lydian flat 7', 'overtone', 'acoustic'],
    family: 'melodic-minor-modes',
    intervals: ['P1', 'M2', 'M3', 'A4', 'P5', 'M6', 'm7'],
    modeOf: { scale: 'melodic-minor', degree: 4 },
  },
  {
    id: 'mixolydian-flat-6',
    name: 'Mixolydian ♭6',
    aliases: ['aeolian dominant', 'hindu'],
    family: 'melodic-minor-modes',
    intervals: ['P1', 'M2', 'M3', 'P4', 'P5', 'm6', 'm7'],
    modeOf: { scale: 'melodic-minor', degree: 5 },
  },
  {
    id: 'locrian-natural-2',
    name: 'Locrian ♮2',
    aliases: ['half-diminished', 'locrian sharp 2', 'aeolian flat 5'],
    family: 'melodic-minor-modes',
    intervals: ['P1', 'M2', 'm3', 'P4', 'd5', 'm6', 'm7'],
    modeOf: { scale: 'melodic-minor', degree: 6 },
  },
  {
    id: 'altered',
    name: 'Altered (super Locrian)',
    aliases: ['super locrian', 'diminished whole tone'],
    family: 'melodic-minor-modes',
    intervals: ['P1', 'm2', 'm3', 'd4', 'd5', 'm6', 'm7'],
    modeOf: { scale: 'melodic-minor', degree: 7 },
  },

  // Pentatonics and blues
  {
    id: 'major-pentatonic',
    name: 'Major pentatonic',
    aliases: ['pentatonic'],
    family: 'pentatonic',
    intervals: ['P1', 'M2', 'M3', 'P5', 'M6'],
  },
  {
    id: 'minor-pentatonic',
    name: 'Minor pentatonic',
    aliases: [],
    family: 'pentatonic',
    intervals: ['P1', 'm3', 'P4', 'P5', 'm7'],
  },
  {
    id: 'minor-blues',
    name: 'Blues',
    aliases: ['blues', 'minor blues'],
    family: 'blues',
    intervals: ['P1', 'm3', 'P4', 'd5', 'P5', 'm7'],
  },
  {
    id: 'major-blues',
    name: 'Major blues',
    aliases: [],
    family: 'blues',
    intervals: ['P1', 'M2', 'm3', 'M3', 'P5', 'M6'],
  },

  // Symmetrical scales
  {
    id: 'whole-tone',
    name: 'Whole-tone',
    aliases: [],
    family: 'symmetrical',
    intervals: ['P1', 'M2', 'M3', 'A4', 'A5', 'A6'],
  },
  {
    id: 'diminished-whole-half',
    name: 'Diminished (whole-half)',
    aliases: ['diminished', 'whole-half diminished'],
    family: 'symmetrical',
    intervals: ['P1', 'M2', 'm3', 'P4', 'd5', 'm6', 'M6', 'M7'],
  },
  {
    id: 'diminished-half-whole',
    name: 'Diminished (half-whole)',
    aliases: ['half-whole diminished', 'dominant diminished'],
    family: 'symmetrical',
    intervals: ['P1', 'm2', 'm3', 'M3', 'A4', 'P5', 'M6', 'm7'],
  },

  // Bebop
  {
    id: 'bebop-dominant',
    name: 'Bebop dominant',
    aliases: ['bebop'],
    family: 'bebop',
    intervals: ['P1', 'M2', 'M3', 'P4', 'P5', 'M6', 'm7', 'M7'],
  },
  {
    id: 'bebop-major',
    name: 'Bebop major',
    aliases: [],
    family: 'bebop',
    intervals: ['P1', 'M2', 'M3', 'P4', 'P5', 'A5', 'M6', 'M7'],
  },
  {
    id: 'bebop-dorian',
    name: 'Bebop Dorian',
    aliases: ['bebop minor'],
    family: 'bebop',
    intervals: ['P1', 'M2', 'm3', 'M3', 'P4', 'P5', 'M6', 'm7'],
  },
]
