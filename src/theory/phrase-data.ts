// Generating a phrase as data (PLAN Phase 7 task 7): how long a phrase is,
// the rhythms a beat can take, and how much chance goes into choosing
// each note from the next-note suggestions.

// How much a phrase writes: a set number of notes (four unless chosen,
// Phase 7 task 16), or to the end of the bar, the bar after, or four bars
// on (David's choice).
export const PHRASE_SIZES = [
  { id: 'notes', label: 'A set number of notes', notes: 4 },
  { id: 'bar', label: 'To the bar’s end', bars: 1 },
  { id: 'two-bars', label: 'Two bars', bars: 2 },
  { id: 'four-bars', label: 'Four bars', bars: 4 },
] as const

// How many notes "a set number of notes" can be (David's choice: 1 to 16).
export const PHRASE_NOTES = { fewest: 1, most: 16 }

// How long a phrase's notes are (Phase 7 task 16, David's choice): all the
// note value chosen; varied beat by beat by the rhythms below; or mostly
// the note value with the odd note twice as long. Unset, a set number of
// notes is even and bars are varied, as before.
export const PHRASE_RHYTHMS = [
  { id: 'even', label: 'Even' },
  { id: 'varied', label: 'Varied' },
  { id: 'mixed', label: 'Mixed' },
] as const

export type PhraseRhythm = (typeof PHRASE_RHYTHMS)[number]['id']

// In a mixed rhythm, how likely each note after the first is to last
// twice the note value.
export const MIXED_LONG = 0.25

export type PhraseSize = (typeof PHRASE_SIZES)[number]['id']

// The rhythms a beat can take, as parts of the beat, and how likely each
// is. A held beat strikes no note: the note before rings on through it.
// A beat of two pulses (in 7/8) or three (a dotted beat) has its own.
export type RhythmCell =
  { parts: number[]; weight: number } | { hold: true; weight: number }

export const RHYTHM_CELLS: Record<number, RhythmCell[]> = {
  1: [
    { parts: [1], weight: 3 },
    { parts: [1 / 2, 1 / 2], weight: 3 },
    { parts: [3 / 4, 1 / 4], weight: 1 },
    { hold: true, weight: 1 },
  ],
  2: [
    { parts: [1], weight: 2 },
    { parts: [1 / 2, 1 / 2], weight: 3 },
    { hold: true, weight: 1 },
  ],
  3: [
    { parts: [1], weight: 2 },
    { parts: [2 / 3, 1 / 3], weight: 3 },
    { parts: [1 / 3, 1 / 3, 1 / 3], weight: 2 },
    { hold: true, weight: 1 },
  ],
}

// Each note is drawn from the best few notes that keep every rule, the
// better the likelier: a note's chance falls by e for every `spread`
// points it scores below the best.
export const PHRASE_CHOICE = {
  pool: 4,
  spread: 1.5,
  // A note repeated counts for this much less.
  repeat: -1.5,
  // Times a phrase that runs out of notes keeping the rules is tried again.
  tries: 12,
}
