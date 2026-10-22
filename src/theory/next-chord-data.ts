// The next-chord engine's rules, as data (PLAN Phase 4 task 2, SPEC 6). Each
// rule has an id, the category its suggestions are grouped under, a neutral
// weight on the style editor's 0–5 scale and the template its explanation is
// filled from. Style profiles (task 3) reweight rules by id; these weights are
// the starting point before any style applies.
import type { SuggestionCategory } from './suggestion'

export type NextChordRule = {
  id: string
  category: SuggestionCategory
  weight: number
  template: string
}

export const NEXT_CHORD_RULES = [
  // Diatonic: chords of the key, scored by harmonic function (FUNCTION_FLOW).
  {
    id: 'diatonic.start',
    category: 'diatonic',
    weight: 0,
    template: '{chord} is {numeral}, {role}: a place to start in {keyName}.',
  },
  {
    id: 'diatonic.function',
    category: 'diatonic',
    weight: 0,
    template: '{chord} is {numeral}, {role}; {flow}.',
  },
  {
    id: 'diatonic.deceptive',
    category: 'diatonic',
    weight: 4,
    template:
      '{chord} is {numeral}: a deceptive cadence, where {previous} heads for {tonicChord} but lands on {chord} instead.',
  },
  {
    id: 'diatonic.minor-dominant',
    category: 'diatonic',
    weight: 0,
    template:
      '{chord} is {numeral}, the major dominant from {source}; its {leadingNote} is the leading note, pulling home to {tonicChord}.',
  },
  {
    id: 'diatonic.resolve-secondary',
    category: 'diatonic',
    weight: 5,
    template:
      '{previous} is {previousNumeral}, so {chord} is where it wants to go: {chord} is {numeral}.',
  },
  // Secondary: dominants and leading-note chords of the key's chords.
  {
    id: 'secondary.dominant',
    category: 'secondary',
    weight: 3,
    template:
      '{chord} is {numeral}, the dominant of {target}, pulling towards {resolution}; its {leadingNote} is {target}’s leading note.',
  },
  {
    id: 'secondary.leading-note',
    category: 'secondary',
    weight: 2,
    template:
      '{chord} is {numeral}, a leading-note chord: its root {root} is {target}’s leading note, a semitone below {resolution}, and pulls up to it.',
  },
  // Borrowed: chords from a parallel mode on the same tonic.
  {
    id: 'borrowed.parallel',
    category: 'borrowed',
    weight: 0,
    template: '{chord} is {description}: it {colour} the key for a moment.',
  },
  // Chromatic: tritone substitutions and chromatic mediants.
  {
    id: 'chromatic.tritone-sub',
    category: 'chromatic',
    weight: 2,
    template:
      '{chord} is {numeral}, the tritone substitute for {dominant}: it shares {dominant}’s tritone ({tritone}) and slides down a semitone to {resolution}.',
  },
  {
    id: 'chromatic.mediant',
    category: 'chromatic',
    weight: 2,
    template:
      '{chord} is {numeral}, a chromatic mediant of {previous}: their roots are a {interval} apart and they share only {common}, for a sudden, cinematic shift.',
  },
  // Modulation: a chord both keys share, to pivot into a closely related key.
  {
    id: 'modulation.pivot',
    category: 'modulation',
    weight: 2,
    template:
      '{chord} is {numeral} in {keyName} and {newNumeral} in {newKeyName}, so it can pivot into {newKeyName}.',
  },
  // Rock moves.
  {
    id: 'rock.flat-seven',
    category: 'rock',
    weight: 3,
    template:
      '{chord} is {numeral}, the rock ♭VII: a Mixolydian lift a tone below {tonicChord}, heard all over classic rock.',
  },
  {
    id: 'rock.flat-six',
    category: 'rock',
    weight: 3,
    template:
      '{chord} is {numeral}, the rock ♭VI: a heavy, dark drop that metal and arena rock lean on.',
  },
  {
    id: 'rock.flat-three',
    category: 'rock',
    weight: 2,
    template:
      '{chord} is {numeral}, the rock ♭III: a bluesy, open shift a minor 3rd above {tonicChord}.',
  },
  {
    id: 'rock.power-chord',
    category: 'rock',
    weight: 3,
    template:
      '{chord} is {numeral} as a power chord: root and 5th only, so it sits under a riff in major or minor.',
  },
  // Pedal and static harmony.
  {
    id: 'pedal.static',
    category: 'pedal',
    weight: 2,
    template:
      'Stay on {chord}: let the harmony sit still while the melody or riff moves.',
  },
  {
    id: 'pedal.bass',
    category: 'pedal',
    weight: 2,
    template:
      '{chord} keeps {pedal} in the bass under {numeral}: a pedal point, with the harmony moving over a held note.',
  },
  {
    id: 'pedal.sus',
    category: 'pedal',
    weight: 2,
    template:
      '{chord} keeps {previous}’s root and 5th and swaps the 3rd for the {replacement}: a suspension that lets the harmony breathe without moving.',
  },
] as const satisfies NextChordRule[]

export type NextChordRuleId = (typeof NEXT_CHORD_RULES)[number]['id']

// Harmonic function by degree label (measured from the major scale on the
// tonic, as numerals are). ♭VI is predominant (it usually heads for V or
// ♭VII); ♭VII and vii° are dominant; iii and ♭III are weak tonics.
export type HarmonicFunction = 'tonic' | 'predominant' | 'dominant'

export const DEGREE_FUNCTIONS: Record<string, HarmonicFunction> = {
  '1': 'tonic',
  '♭2': 'predominant',
  '2': 'predominant',
  '♭3': 'tonic',
  '3': 'tonic',
  '4': 'predominant',
  '♯4': 'predominant',
  '5': 'dominant',
  '♭6': 'predominant',
  '6': 'tonic',
  '♭7': 'dominant',
  '7': 'dominant',
}

export const FUNCTION_ROLES: Record<HarmonicFunction, string> = {
  tonic: 'a tonic chord, at rest',
  predominant: 'a predominant chord, moving away from home',
  dominant: 'a dominant chord, building tension towards home',
}

// How well one function leads to the next, on the 0–5 scale, and the phrase
// the ⓘ panel uses for it. Predominant to dominant to tonic is the strongest
// path; going backwards scores lowest.
export const FUNCTION_FLOW: Record<
  HarmonicFunction,
  Record<HarmonicFunction, { score: number; text: string }>
> = {
  tonic: {
    tonic: { score: 3, text: 'it stays at rest after {previous}' },
    predominant: {
      score: 4,
      text: 'a natural first step away from {previous}',
    },
    dominant: {
      score: 3,
      text: 'a direct move on from {previous}',
    },
  },
  predominant: {
    tonic: { score: 3, text: 'a soft, plagal return home from {previous}' },
    predominant: { score: 2, text: 'it keeps moving after {previous}' },
    dominant: {
      score: 5,
      text: 'the classic next step: {previous} sets up the dominant',
    },
  },
  dominant: {
    tonic: { score: 5, text: '{previous} resolves home to it' },
    predominant: {
      score: 1,
      text: '{previous} steps back, holding off the resolution',
    },
    dominant: { score: 2, text: 'it keeps the tension of {previous}' },
  },
}

// Weaker members of a function, marked down from the flow score: iii is a
// pale tonic next to I and vi, and vii° a weaker dominant than V.
export const DEGREE_ADJUSTMENTS: Record<string, number> = {
  '3': -2,
  '7': -1,
}

// Where a song tends to start, by degree label, when nothing is picked yet.
export const START_SCORES: Record<string, number> = {
  '1': 5,
  '4': 3,
  '6': 3,
  '♭6': 3,
  '2': 2,
  '5': 2,
  '♭7': 2,
  '3': 1,
  '♭3': 2,
}

// Parallel modes chords are borrowed from, with each source's weight. The
// closest sources (one note changed) score highest. Locrian is left out: its
// ♭V and ♭iii are too far from the key to be useful.
export const BORROW_SOURCES: { mode: string; weight: number }[] = [
  { mode: 'natural-minor', weight: 3 },
  { mode: 'major', weight: 3 },
  { mode: 'mixolydian', weight: 3 },
  { mode: 'dorian', weight: 2 },
  { mode: 'lydian', weight: 2 },
  { mode: 'phrygian', weight: 2 },
  { mode: 'harmonic-minor', weight: 2 },
  { mode: 'melodic-minor', weight: 1 },
]

// The rock moves: a major chord on a lowered degree, as an interval down
// (negative) or up from the tonic.
export const ROCK_MOVES = [
  { rule: 'rock.flat-seven', interval: 'M2', down: true },
  { rule: 'rock.flat-six', interval: 'M3', down: true },
  { rule: 'rock.flat-three', interval: 'm3', down: false },
] as const

// Power-chord roots above the tonic, the riff-friendly degrees: 1, ♭2, ♭3,
// 4, 5, ♭6 and ♭7.
export const POWER_CHORD_INTERVALS = ['P1', 'm2', 'm3', 'P4', 'P5', 'm6', 'm7']

// Chromatic mediants: a root a major or minor 3rd up or down.
export const MEDIANT_INTERVALS = [
  { interval: 'M3', down: false, name: 'major 3rd' },
  { interval: 'M3', down: true, name: 'major 3rd' },
  { interval: 'm3', down: false, name: 'minor 3rd' },
  { interval: 'm3', down: true, name: 'minor 3rd' },
] as const

// Roots above a held bass note for pedal chords: a 4th, a 5th and a tone up.
export const PEDAL_INTERVALS = ['P4', 'P5', 'M2']

// A pivot's degree in the new key (major and minor triads only), best first: a predominant (ii, IV) leads
// on most naturally, then a tonic substitute.
export const PIVOT_DEGREES = [2, 4, 6, 3, 1, 5, 7]
