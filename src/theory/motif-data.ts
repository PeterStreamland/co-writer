// Motif options as data (PLAN Phase 7 task 3): how each option is scored
// and worded.

export type MotifKind = 'repeat' | 'sequence' | 'changed-ending' | 'upside-down'

// An option's score: a base for its kind, then how its notes sit on the
// chords where it lands, and how far it starts from the melody's last note.
export const MOTIF_SCORING = {
  base: {
    repeat: 1,
    sequence: 0.5,
    'changed-ending': 0.3,
    'upside-down': 0,
  } as Record<MotifKind, number>,
  strongTone: 2, // a chord tone on a strong beat
  strongNonTone: -1.5, // not a chord tone, on a strong beat
  tone: 0.5, // a chord tone elsewhere
  distance: -0.1, // per semitone from the last note to the first
  octave: -0.5, // moved by an octave to fit the range
}

// The sequences tried, in scale steps, nearest first; the best few show.
export const SEQUENCE_STEPS = [1, -1, 2, -2, 3, -3]
export const SEQUENCES_SHOWN = 2

// The fewest notes a motif has.
export const MOTIF_MIN_NOTES = 2

export const MOTIF_LABELS: Record<MotifKind, string> = {
  repeat: 'Repeat',
  sequence: 'Sequence',
  'changed-ending': 'Changed ending',
  'upside-down': 'Upside down',
}

// {bar} is the motif's bar, {to} the bar it lands in, {move} the
// sequence's step ("up a 3rd"), {from} and {note} the changed ending.
export const MOTIF_TEXT: Record<MotifKind, string> = {
  repeat:
    'Bar {bar}’s motif again in bar {to}, so the listener hears it come back.',
  sequence:
    'Bar {bar}’s motif moved {move} in the key, in bar {to}: the same shape at a new height.',
  'changed-ending':
    'Bar {bar}’s motif in bar {to}, ending on {note} instead of {from}, so it answers rather than repeats.',
  'upside-down':
    'Bar {bar}’s motif upside down in bar {to}: each step up goes down by the same scale step.',
}
