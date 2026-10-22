// The next-chord engine's rules, as data (PLAN Phase 4 task 2, SPEC 6). Each
// rule has an id, the category its suggestions are grouped under, a neutral
// weight on the style editor's 0–5 scale and the template its explanation is
// filled from. Style profiles (task 3) reweight rules by id; these weights are
// the starting point before any style applies.
import type { SuggestionCategory } from './suggestion'

export type NextChordRule = {
  id: string
  // How the style editor names the rule.
  label: string
  category: SuggestionCategory
  weight: number
  template: string
}

export const NEXT_CHORD_RULES = [
  // Diatonic: chords of the key, scored by harmonic function (FUNCTION_FLOW).
  {
    id: 'diatonic.start',
    label: 'Starting chords: the key’s own chords, tonic first',
    category: 'diatonic',
    weight: 0,
    template: '{chord} is {numeral}, {role}: a place to start in {keyName}.',
  },
  {
    id: 'diatonic.function',
    label: 'Diatonic chords, by harmonic function',
    category: 'diatonic',
    weight: 0,
    template: '{chord} is {numeral}, {role}; {flow}.',
  },
  {
    id: 'diatonic.sevenths',
    label: 'Diatonic 7th chords (Imaj7, ii7, vi7)',
    category: 'diatonic',
    weight: 0,
    template:
      '{chord} is {numeral}, {role}; {flow}. The 7th adds colour without changing its job.',
  },
  {
    id: 'diatonic.deceptive',
    label: 'Deceptive cadence: V to vi',
    category: 'diatonic',
    weight: 4,
    template:
      '{chord} is {numeral}: a deceptive cadence, where {previous} heads for {tonicChord} but lands on {chord} instead.',
  },
  {
    id: 'diatonic.minor-dominant',
    label: 'Major V and V7 in a minor key',
    category: 'diatonic',
    weight: 0,
    template:
      '{chord} is {numeral}, the major dominant from {source}; its {leadingNote} is the leading note, pulling home to {tonicChord}.',
  },
  {
    id: 'diatonic.resolve-secondary',
    label: 'Resolving a secondary chord to its target',
    category: 'diatonic',
    weight: 5,
    template:
      '{previous} is {previousNumeral}, so {chord} is where it wants to go: {chord} is {numeral}.',
  },
  // Secondary: dominants and leading-note chords of the key's chords.
  {
    id: 'secondary.dominant',
    label: 'Secondary dominants (V7/vi, V7/V)',
    category: 'secondary',
    weight: 3,
    template:
      '{chord} is {numeral}, the dominant of {target}, pulling towards {resolution}; its {leadingNote} is {target}’s leading note.',
  },
  {
    id: 'secondary.leading-note',
    label: 'Leading-note chords (vii°7/vi)',
    category: 'secondary',
    weight: 2,
    template:
      '{chord} is {numeral}, a leading-note chord: its root {root} is {target}’s leading note, a semitone below {resolution}, and pulls up to it.',
  },
  // Borrowed: chords from a parallel mode on the same tonic, one rule per
  // source so a style can favour some (metal leans on Phrygian's ♭II).
  {
    id: 'borrowed.natural-minor',
    label: 'Borrowed from the parallel Aeolian (natural minor)',
    category: 'borrowed',
    weight: 3,
    template: '{chord} is {description}: it {colour} the key for a moment.',
  },
  {
    id: 'borrowed.major',
    label: 'Borrowed from the parallel major',
    category: 'borrowed',
    weight: 3,
    template: '{chord} is {description}: it {colour} the key for a moment.',
  },
  {
    id: 'borrowed.mixolydian',
    label: 'Borrowed from the parallel Mixolydian',
    category: 'borrowed',
    weight: 3,
    template: '{chord} is {description}: it {colour} the key for a moment.',
  },
  {
    id: 'borrowed.dorian',
    label: 'Borrowed from the parallel Dorian',
    category: 'borrowed',
    weight: 2,
    template: '{chord} is {description}: it {colour} the key for a moment.',
  },
  {
    id: 'borrowed.lydian',
    label: 'Borrowed from the parallel Lydian',
    category: 'borrowed',
    weight: 2,
    template: '{chord} is {description}: it {colour} the key for a moment.',
  },
  {
    id: 'borrowed.phrygian',
    label: 'Borrowed from the parallel Phrygian',
    category: 'borrowed',
    weight: 2,
    template: '{chord} is {description}: it {colour} the key for a moment.',
  },
  {
    id: 'borrowed.harmonic-minor',
    label: 'Borrowed from the parallel harmonic minor',
    category: 'borrowed',
    weight: 2,
    template: '{chord} is {description}: it {colour} the key for a moment.',
  },
  {
    id: 'borrowed.melodic-minor',
    label: 'Borrowed from the parallel melodic minor',
    category: 'borrowed',
    weight: 1,
    template: '{chord} is {description}: it {colour} the key for a moment.',
  },
  // Chromatic: tritone substitutions and chromatic mediants.
  {
    id: 'chromatic.tritone-sub',
    label: 'Tritone substitutes (♭II7 for V7)',
    category: 'chromatic',
    weight: 2,
    template:
      '{chord} is {numeral}, the tritone substitute for {dominant}: it shares {dominant}’s tritone ({tritone}) and slides down a semitone to {resolution}.',
  },
  {
    id: 'chromatic.mediant',
    label: 'Chromatic mediants (C to E, C to A♭)',
    category: 'chromatic',
    weight: 2,
    template:
      '{chord} is {numeral}, a chromatic mediant of {previous}: their roots are a {interval} apart and they share only {common}, for a sudden, cinematic shift.',
  },
  // Modulation: a chord both keys share, to pivot into a closely related key.
  {
    id: 'modulation.pivot',
    label: 'Pivot chords into a closely related key',
    category: 'modulation',
    weight: 2,
    template:
      '{chord} is {numeral} in {keyName} and {newNumeral} in {newKeyName}, so it can pivot into {newKeyName}.',
  },
  // Rock moves.
  {
    id: 'rock.flat-seven',
    label: 'Rock ♭VII',
    category: 'rock',
    weight: 3,
    template:
      '{chord} is {numeral}, the rock ♭VII: a whole tone below {tonicChord}, a lift heard all over classic rock and metal.',
  },
  {
    id: 'rock.flat-six',
    label: 'Rock ♭VI',
    category: 'rock',
    weight: 3,
    template:
      '{chord} is {numeral}, the rock ♭VI: a heavy, dark drop that metal and arena rock lean on.',
  },
  {
    id: 'rock.flat-three',
    label: 'Rock ♭III',
    category: 'rock',
    weight: 2,
    template:
      '{chord} is {numeral}, the rock ♭III: a bluesy, open shift a minor 3rd above {tonicChord}.',
  },
  {
    id: 'rock.power-chord',
    label: 'Power-chord riffs',
    category: 'rock',
    weight: 3,
    template:
      '{chord} is {numeral} as a power chord: root and 5th only, so it sits under a riff in major or minor.',
  },
  {
    id: 'rock.plagal',
    label: 'Falling-4th steps (♭VII to IV, IV to I)',
    category: 'rock',
    weight: 3,
    template:
      '{chord} is {numeral}: its root falls a 4th from {previous}, the step behind rock’s I–♭VII–IV.',
  },
  {
    id: 'rock.return-home',
    label: 'Riff-style return to the tonic',
    category: 'rock',
    weight: 3,
    template:
      '{chord} is {numeral}: straight back home after {previous}, the riff-style return to the tonic.',
  },
  {
    id: 'rock.blues-sevenths',
    label: 'Blues dominant 7ths (I7, IV7, V7)',
    category: 'rock',
    weight: 3,
    template:
      '{chord} is {numeral}: a dominant 7th on {degree}, the blues sound where every chord takes a flat 7th.',
  },
  // Pedal and static harmony.
  {
    id: 'pedal.static',
    label: 'Staying on the same chord',
    category: 'pedal',
    weight: 2,
    template:
      'Stay on {chord}: let the harmony sit still while the melody or riff moves.',
  },
  {
    id: 'pedal.bass',
    label: 'Pedal point: chords over a held bass note',
    category: 'pedal',
    weight: 2,
    template:
      '{chord} keeps {pedal} in the bass under {numeral}: a pedal point, with the harmony moving over a held note.',
  },
  {
    id: 'pedal.sus',
    label: 'Suspensions (sus4, sus2)',
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

// Diatonic 7th chords fit a little less than their triads, so without a
// style the plain triads lead; jazz weights them up.
export const SEVENTH_OFFSET = 0.5

// The blues dominant 7ths: on the tonic, IV and V.
export const BLUES_STEPS = [
  { interval: 'P1', degree: 'the tonic' },
  { interval: 'P4', degree: 'IV' },
  { interval: 'P5', degree: 'V' },
]

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

// How well a secondary dominant fits, by its target's degree number: V7/V
// and V7/vi are the everyday ones, V7/iii the rarest. A leading-note chord
// to the same target fits one less.
export const SECONDARY_TARGET_FITS: Record<number, number> = {
  5: 3.5,
  6: 3.5,
  2: 3,
  4: 3,
  3: 2,
}

// A tritone substitute heading home (D♭7 to C) fits like V7/V; one aimed
// at another chord fits half a point below that chord's secondary dominant.
export const TRITONE_SUB_HOME_FIT = 3.5

// Parallel modes chords are borrowed from, closest first, with each one's
// rule. Locrian is left out: its ♭V and ♭iii are too far from the key to be
// useful.
export const BORROW_SOURCES = [
  { mode: 'natural-minor', rule: 'borrowed.natural-minor' },
  { mode: 'major', rule: 'borrowed.major' },
  { mode: 'mixolydian', rule: 'borrowed.mixolydian' },
  { mode: 'dorian', rule: 'borrowed.dorian' },
  { mode: 'lydian', rule: 'borrowed.lydian' },
  { mode: 'phrygian', rule: 'borrowed.phrygian' },
  { mode: 'harmonic-minor', rule: 'borrowed.harmonic-minor' },
  { mode: 'melodic-minor', rule: 'borrowed.melodic-minor' },
] as const

// The rock moves: a major chord on a lowered degree, as an interval down
// (negative) or up from the tonic.
export const ROCK_MOVES = [
  { rule: 'rock.flat-seven', interval: 'M2', down: true },
  { rule: 'rock.flat-six', interval: 'M3', down: true },
  { rule: 'rock.flat-three', interval: 'm3', down: false },
] as const

// Power-chord roots above the tonic, the riff-friendly degrees, with how
// well each fits: ♭III, ♭VI and ♭VII are the riff staples (E5–G5–A5,
// E5–C5–D5), ♭II the darkest.
export const POWER_CHORD_STEPS = [
  { interval: 'P1', fit: 3 },
  { interval: 'm2', fit: 2.5 },
  { interval: 'm3', fit: 3.5 },
  { interval: 'P4', fit: 3 },
  { interval: 'P5', fit: 3 },
  { interval: 'm6', fit: 3.5 },
  { interval: 'm7', fit: 3.5 },
]

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
