// Harmonies of a melody as data (PLAN Phase 7 task 5, SPEC 7.4): the
// intervals a harmony can move in, in the order they are offered, how a
// countermelody weighs its notes, and the wording of each reason.

export type HarmonyKind = {
  id: string
  label: string
  // Letters (scale steps) from the melody: 2 is a 3rd, 5 a 6th, 7 an octave.
  steps?: number
  direction?: 1 | -1
  // An exact interval instead, as a power chord has: 'P5', 'P4'.
  exact?: string
  counter?: boolean // a countermelody, not a parallel harmony
  common?: boolean // shown before "More harmonies"
}

// 3rds above first, 6ths below next (SPEC 7.4); every interval above and
// below; the power-chord parallels for riffs.
export const HARMONY_KINDS: HarmonyKind[] = [
  {
    id: '3rd-above',
    label: '3rds above',
    steps: 2,
    direction: 1,
    common: true,
  },
  {
    id: '6th-below',
    label: '6ths below',
    steps: 5,
    direction: -1,
    common: true,
  },
  { id: 'counter', label: 'Countermelody', counter: true, common: true },
  {
    id: '3rd-below',
    label: '3rds below',
    steps: 2,
    direction: -1,
    common: true,
  },
  { id: '6th-above', label: '6ths above', steps: 5, direction: 1 },
  { id: '4th-above', label: '4ths above', steps: 3, direction: 1 },
  { id: '4th-below', label: '4ths below', steps: 3, direction: -1 },
  { id: '5th-above', label: '5ths above', steps: 4, direction: 1 },
  { id: '5th-below', label: '5ths below', steps: 4, direction: -1 },
  { id: 'octave-above', label: 'Octaves above', exact: 'P8', direction: 1 },
  { id: 'octave-below', label: 'Octaves below', exact: 'P8', direction: -1 },
  {
    id: 'power-5th-below',
    label: 'Power 5ths below',
    exact: 'P5',
    direction: -1,
  },
  {
    id: 'power-4th-below',
    label: 'Power 4ths below',
    exact: 'P4',
    direction: -1,
  },
]

export const DEFAULT_HARMONY = '3rd-above'

// Semitones (within an octave) that sound well together: unisons and
// octaves, 3rds, 4ths, 5ths and 6ths. A bend never lands on a 2nd, a 7th
// or a tritone from the melody.
export const BEND_CONSONANT = [0, 3, 4, 5, 7, 8, 9]

// A countermelody's candidates, scored by what applies to each.
export const COUNTER_SCORING = {
  contrary: 3, // moves against the melody
  obliqueHold: 0.5, // holds while the melody moves
  obliqueMove: 1, // moves while the melody holds
  similar: -2, // moves the same way as the melody
  strongTone: 3, // a chord tone on a strong beat
  tone: 1, // a chord tone on a weak beat
  strongNonTone: -3, // not a chord tone, on a strong beat
  leapToNonTone: -2, // a weak non-chord tone reached by a leap
  step: 1.5, // a tone or semitone
  wideLeap: -1, // more than a 3rd
  imperfect: 1.5, // a 3rd or 6th (10th, 13th) from the melody
  strongDissonant: -2, // a 2nd, 4th, tritone or 7th from it, strong beat
  weakDissonant: -0.5, // on a weak beat
  parallel: -6, // a 5th or octave to a 5th or octave, both moving
  farBelow: -0.25, // per semitone more than a 12th below the melody
  // The first note: a chord tone, about a 6th below the melody.
  fromSixth: -0.1, // per semitone from a 6th below
}

// How far below the melody a countermelody sits (semitones), and how far
// it moves from one note to the next.
// The first note sits a 6th or more below, leaving room to move against
// the melody either way.
export const COUNTER_GAP = { min: 3, max: 24, far: 19, first: 8 }
export const COUNTER_MAX_MOVE = 5

// The words for each reason; {note}, {interval}, {chord},
// {tone}, {strict} and {way} are filled in.
export const HARMONY_TEXT = {
  tone: '{note}, {interval}: the {tone} of {chord}.',
  passing: '{note}, {interval}, moving with the melody.',
  plain: '{note}, {interval}.',
  bent: 'On the strong beat {strict} isn’t in {chord}, so it moves a step to {note}, the {tone} of {chord}, {interval}.',
  missing: 'The key has no {strict}, so it moves a step to {note}, {interval}.',
  borrowed:
    '{note}, the {tone} of {chord}, takes the chord’s note rather than the key’s {strict}, {interval}.',
  chromatic: '{note} is outside the key.',
  counterFirst: '{note}, the {tone} of {chord}, {interval}, to start the line.',
  counterTone: '{note}, the {tone} of {chord}, {interval}.',
  counterPassing: '{note} steps on from the note before, {interval}.',
  counterNeighbour: '{note} steps off the note before and back, {interval}.',
  counterOther: '{note}, {interval}.',
  contrary: 'It moves {way} as the melody moves the other way.',
  obliqueHold: 'It holds while the melody moves.',
  obliqueMove: 'It moves {way} while the melody holds.',
  similar: 'It moves {way} with the melody.',
}

// How each tag reads.
export const HARMONY_TAG_TEXT: Record<string, string> = {
  'chord-tone': 'chord tone',
  passing: 'passing',
  neighbour: 'neighbour',
  bent: 'bent',
  chromatic: 'chromatic',
  contrary: 'contrary',
  oblique: 'oblique',
  similar: 'similar',
}
