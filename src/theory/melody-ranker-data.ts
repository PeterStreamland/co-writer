// The melody ranker's settings and wording, as data (PLAN Phase 7 task 4,
// SPEC 6.2, 7.3): the groups next notes are shown in, how many show, and
// the line each rule adds to the ⓘ panel when it moved a note's ranking.

export const MELODY_CATEGORIES = [
  'chord-tones',
  'steps',
  'leaps',
  'colour',
] as const

export type MelodyCategory = (typeof MELODY_CATEGORIES)[number]

export const MELODY_CATEGORY_LABELS: Record<MelodyCategory, string> = {
  'chord-tones': 'Chord tones',
  steps: 'Steps and neighbours',
  leaps: 'Leaps',
  colour: 'Colour notes',
}

// Six to eight next notes (as for chords, SPEC 6.2), no more than three
// from one group; the wildcard comes from the lower-scoring half of the
// notes not shown.
export const MELODY_RANKING = {
  min: 6,
  max: 8,
  perCategory: 3,
  wildcardShare: 0.5,
}

// Context notes (SPEC 6.2): one line for each rule that moved a note's
// ranking, keyed by rule id. Rules the explanation already states (a
// non-chord tone on a strong beat, a note outside the key) have none.
export const MELODY_CONTEXT: Record<string, string> = {
  'melody-recover': 'Ranked higher: it turns back after the leap.',
  'melody-same-way': 'Ranked lower: it carries on the same way after a leap.',
  'melody-two-leaps': 'Ranked lower: a second leap the same way.',
  'melody-long-run':
    'Ranked lower: the melody has run the same way for a while.',
  'melody-repeat-again': 'Ranked lower: the note has already been repeated.',
  'melody-rocking': 'Ranked lower: it would rock between the same two notes.',
  'melody-beyond-used':
    'Ranked lower: it goes past the range the melody has used so far.',
  'melody-leap-to-non-tone':
    'Ranked lower: leaps usually land on a chord tone.',
  'melody-wide-leap': 'Ranked lower: a leap of a 6th or more is hard to sing.',
  'melody-leading-note':
    'Ranked higher: the leading note wants to rise to the tonic.',
  'melody-four-to-three': 'Ranked higher: the 4th wants to fall to the 3rd.',
  'melody-step-into': 'Ranked higher: it steps into the note after.',
  'melody-leap-into': 'Ranked lower: it leaps to the note after.',
  'melody-chromatic-resolves':
    'Ranked higher: the note before resolves to it by a semitone.',
}

// Notes for a note's place in the melody (David's request, 2026-10-24):
// ranked as next notes after the notes before it, then by how they lead
// into the note after: a step or a semitone into it is liked, a leap of a
// 4th or more away from it costs. Eight show.
export const IN_PLACE = {
  stepInto: 1,
  leapInto: -1,
  shown: 8,
}

export const IN_PLACE_TEXT = {
  stepInto: 'It steps into {next}.',
  leapInto: 'It leaps to {next}.',
}
