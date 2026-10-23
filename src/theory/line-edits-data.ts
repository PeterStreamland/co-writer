// Editing a line, as data (David's request, 2026-10-23): how a note in
// another note's place is ranked, and the ways to add notes after one.

// A swap's score: what kind of note it would be, what it costs to leave
// the chord's notes at a change, and how far it moves from the notes
// either side (per semitone).
export const SWAP_SCORING = {
  strongTone: 4, // a chord tone on a strong beat or at the change
  tone: 2.5, // a chord tone on a weak beat
  approach: 1.5, // a semitone into the next note
  step: 1, // passing or neighbour
  free: -1, // none of these
  outside: -1.5, // outside the key
  offChange: -3, // not a chord tone where the chord changes
  move: -0.15,
}

// How far a swap may move from the note, in semitones, and how many show.
export const SWAP_REACH = 7
export const SWAP_SHOWN = 8

export type AddMoveId =
  | 'passing'
  | 'approach'
  | 'chord-tone'
  | 'scale-run'
  | 'chromatic-run'
  | 'repeat'

// Ways to add notes after a note, each sharing its time: best first. The
// templates fill {note}, {added}, {next} and {chord}.
export const ADD_MOVES: {
  id: AddMoveId
  label: string
  explanation: string
}[] = [
  {
    id: 'passing',
    label: 'Passing note',
    explanation:
      'Splits {note} in two, passing by step through {added} to {next}.',
  },
  {
    id: 'approach',
    label: 'Approach note',
    explanation:
      'Splits {note} in two, leading by a semitone through {added} into {next}.',
  },
  {
    id: 'chord-tone',
    label: 'Another chord tone',
    explanation:
      'Splits {note} in two, adding {added}, another note of {chord}.',
  },
  {
    id: 'scale-run',
    label: 'Scale run',
    explanation:
      'Shares {note}’s time with {added}, a run up or down the scale into {next}.',
  },
  {
    id: 'chromatic-run',
    label: 'Chromatic run',
    explanation:
      'Shares {note}’s time with {added}, a run of semitones into {next}.',
  },
  {
    id: 'repeat',
    label: 'Strike it again',
    explanation: 'Splits {note} in two, striking it again halfway.',
  },
]

// The shortest note an addition may make: a semiquaver.
export const SHORTEST: [n: number, d: number] = [1, 16]

// The most notes a run may add.
export const LONGEST_RUN = 3
