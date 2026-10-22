// The voice-leading rules' settings, as data (PLAN Phase 5 task 3): what
// each rule says when it fires, the lowest note each interval sounds clear
// above, and how heavily each lens penalises each rule. Rules are never
// hard limits (PLAN): a lens that doesn't care about one weights it 0.

export type VoiceRule =
  | 'parallel-fifths'
  | 'parallel-octaves'
  | 'leading-note'
  | 'seventh'
  | 'spacing'
  | 'low-register'
  | 'thirds-under-gain'

export const VOICE_RULES: VoiceRule[] = [
  'parallel-fifths',
  'parallel-octaves',
  'leading-note',
  'seventh',
  'spacing',
  'low-register',
  'thirds-under-gain',
]

// What each rule says, filled in with {voices}, {notes} and {more}.
export const VOICE_RULE_TEMPLATES: Record<VoiceRule, string> = {
  'parallel-fifths': 'Parallel 5ths: the {voices} move {notes}{more}.',
  'parallel-octaves': 'Parallel octaves: the {voices} move {notes}{more}.',
  'leading-note':
    "The leading note, {notes}, in the {voices} doesn't rise to the tonic.",
  seventh: "The 7th, {notes}, in the {voices} doesn't fall by step.",
  spacing: 'More than an octave between the {voices}: {notes}.',
  'low-register': 'Muddy low down: {notes} between the {voices}.',
  'thirds-under-gain': 'A 3rd under distortion: {notes} between the {voices}.',
}

// Upper voices sit within an octave of each other; the bass may be further
// below.
export const MAX_UPPER_GAP = 12

// Low interval limits: the lowest note an interval sounds clear above, by
// its size in semitones (as arrangers' tables give them). Unisons, octaves
// and anything wider than an octave have no limit.
export const LOW_INTERVAL_LIMITS: Record<number, string> = {
  1: 'E3', // minor 2nd
  2: 'Eb3', // major 2nd
  3: 'C3', // minor 3rd
  4: 'Bb2', // major 3rd
  5: 'Bb2', // perfect 4th
  6: 'B2', // tritone
  7: 'Bb1', // perfect 5th
  8: 'G2', // minor 6th
  9: 'F2', // major 6th
  10: 'F2', // minor 7th
  11: 'F2', // major 7th
}

// The voicing lenses (SPEC 8) and how many points each hit costs: the four
// core lenses the Phase 5 exit criteria hold for, then the experimental
// ones (David's request): quartal, clusters, upper structures, a drone, and
// a wildcard that mixes them all at random.
export type CoreLens = 'classical' | 'rock' | 'open' | 'jazz'
export type ExperimentalLens =
  'quartal' | 'cluster' | 'upper' | 'drone' | 'wildcard'
export type Lens = CoreLens | ExperimentalLens

export const LENSES: CoreLens[] = ['classical', 'rock', 'open', 'jazz']
export const EXPERIMENTAL_LENSES: ExperimentalLens[] = [
  'quartal',
  'cluster',
  'upper',
  'drone',
  'wildcard',
]
export const ALL_LENSES: Lens[] = [...LENSES, ...EXPERIMENTAL_LENSES]

export const LENS_RULE_WEIGHTS: Record<Lens, Record<VoiceRule, number>> = {
  // Strict: parallels all but ruled out, tendency notes resolve, voices
  // close.
  classical: {
    'parallel-fifths': 20,
    'parallel-octaves': 20,
    'leading-note': 6,
    seventh: 6,
    spacing: 4,
    'low-register': 3,
    'thirds-under-gain': 0,
  },
  // Power chords move in parallel on purpose; what matters is a clear low
  // end and no 3rds under distortion.
  rock: {
    'parallel-fifths': 0,
    'parallel-octaves': 0,
    'leading-note': 0,
    seventh: 0,
    spacing: 0,
    'low-register': 3,
    'thirds-under-gain': 5,
  },
  // Spread voicings and drones: wide gaps are the point, a muddy bass isn't.
  open: {
    'parallel-fifths': 1,
    'parallel-octaves': 1,
    'leading-note': 0,
    seventh: 0,
    spacing: 0,
    'low-register': 4,
    'thirds-under-gain': 0,
  },
  // Guide tones lead (the 7th falls), octave doublings sound thin, and the
  // leading note often stays put as a major 7th.
  jazz: {
    'parallel-fifths': 1,
    'parallel-octaves': 3,
    'leading-note': 0,
    seventh: 3,
    spacing: 1,
    'low-register': 4,
    'thirds-under-gain': 0,
  },
  // Stacked 4ths float free of tonal pull: parallels are their nature, a
  // muddy low end isn't.
  quartal: {
    'parallel-fifths': 0,
    'parallel-octaves': 1,
    'leading-note': 0,
    seventh: 0,
    spacing: 0,
    'low-register': 4,
    'thirds-under-gain': 0,
  },
  // Clusters are close on purpose; only mud below them counts.
  cluster: {
    'parallel-fifths': 0,
    'parallel-octaves': 1,
    'leading-note': 0,
    seventh: 1,
    spacing: 0,
    'low-register': 4,
    'thirds-under-gain': 0,
  },
  // A triad over a shell: the guide tones still lead.
  upper: {
    'parallel-fifths': 1,
    'parallel-octaves': 2,
    'leading-note': 1,
    seventh: 2,
    spacing: 0,
    'low-register': 4,
    'thirds-under-gain': 0,
  },
  // The chords move over a held note; tendency notes still lean.
  drone: {
    'parallel-fifths': 1,
    'parallel-octaves': 2,
    'leading-note': 2,
    seventh: 2,
    spacing: 1,
    'low-register': 3,
    'thirds-under-gain': 0,
  },
  // Anything goes, but bare parallels and mud still cost a little.
  wildcard: {
    'parallel-fifths': 2,
    'parallel-octaves': 2,
    'leading-note': 1,
    seventh: 1,
    spacing: 0,
    'low-register': 2,
    'thirds-under-gain': 0,
  },
}
