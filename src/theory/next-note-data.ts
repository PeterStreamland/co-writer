// Next-note suggestions as data (PLAN Phase 7 task 2, SPEC 7.3): how each
// rule weighs a candidate, how far a note may move, the melody range
// presets, and the wording of each reason.

// A candidate's score is the sum of what applies to it.
export const NEXT_NOTE_SCORING = {
  strongTone: 4, // a chord tone on a strong beat
  tone: 0.75, // a chord tone on a weak beat or off the beat
  strongNonTone: -2.5, // not a chord tone, on a strong beat
  chromatic: -2.5, // outside the key
  step: 1.5,
  repeat: 0,
  repeatAgain: -1.5, // for each repeat already in a row before it
  leap: -0.5, // a 4th or more (a 3rd is a skip, often along the chord)
  wideLeap: -1, // a 6th or more, on top
  leapToNonTone: -1.5, // leaps land on chord tones
  move: -0.2, // per semitone moved
  recoverStep: 2.5, // after a leap of a 4th or more, a step back
  recoverLeap: 0.5, // or a smaller leap back
  sameWayAfterLeap: -2.5, // on in the same direction after a leap
  twoLeaps: -1.5, // a second leap the same way
  longRun: -1, // a fifth note moving the same way
  rocking: -2, // a third swing between the same two notes
  leadingNote: 3, // 7 up to 1
  fourToThree: 2.5, // 4 down to 3
  chromaticResolves: 2.5, // a sharp up or a flat down by a semitone
  beyondUsed: -0.15, // per semitone past the range the melody has used
  // The first note
  fromCentre: -0.1, // per semitone from the middle of the range
  tonic: 0.5,
}

// Semitones: a leap is 3 or more, a big leap (one to turn back from) 5 or
// more, a wide one 8 or more, and nothing beyond an octave.
export const LEAP = 3
export const BIG_LEAP = 5
export const WIDE_LEAP = 8
export const MAX_LEAP = 12
// How many moves the same way make a long run.
export const LONG_RUN = 4

// How many suggestions show.
export const NEXT_NOTE_SHOWN = 8

// The melody's range (SPEC 7.3): voice parts, guitar or keys lead, or a
// range of your own. Tenor is the default. Voice ranges are the usual
// choral ones; lead ranges are as they sound.
export type RangePreset = {
  id: string
  label: string
  low: string
  high: string
}

export const RANGE_PRESETS: RangePreset[] = [
  { id: 'bass', label: 'Bass voice', low: 'E2', high: 'E4' },
  { id: 'baritone', label: 'Baritone voice', low: 'G2', high: 'G4' },
  { id: 'tenor', label: 'Tenor voice', low: 'C3', high: 'A4' },
  { id: 'alto', label: 'Alto voice', low: 'F3', high: 'D5' },
  { id: 'soprano', label: 'Soprano voice', low: 'C4', high: 'A5' },
  { id: 'guitar', label: 'Guitar lead', low: 'E3', high: 'E6' },
  { id: 'keys', label: 'Keys lead', low: 'C4', high: 'C6' },
]

export const DEFAULT_RANGE = 'tenor'

// The words for each part of a reason; {note}, {from}, {chord}, {tone}
// and {tonic} are filled in.
export const NEXT_NOTE_TEXT = {
  strongTone: '{note} is the {tone} of {chord}, on a strong beat.',
  tone: '{note} is the {tone} of {chord}.',
  strongNonTone:
    '{note} isn’t a note of {chord}, on a strong beat, so it rubs until it moves on.',
  passing: '{note} steps on from {from}, passing through to the next note.',
  neighbour: '{note} steps off {from} and wants to step back or on.',
  step: 'It is a step from {from}.',
  leap: 'It leaps from {from}.',
  skip: 'It skips a 3rd from {from}.',
  repeat: 'It repeats {from}.',
  chromatic:
    '{note} is outside the key, a colour note that leans on by a semitone.',
  recover: 'After the leap to {from}, it turns back.',
  sameWay: 'After the leap to {from}, it carries on the same way.',
  leadingNote: '{from} is the leading note, rising to the tonic, {note}.',
  fourToThree: '{from}, the 4th, falls to {note}, the 3rd.',
  chromaticResolves: '{from} resolves by a semitone to {note}.',
  first: '{note}, the {tone} of {chord}, to start on.',
}
