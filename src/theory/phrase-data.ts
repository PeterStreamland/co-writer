// Generating a phrase as data (PLAN Phase 7 task 7): how long a phrase is,
// the rhythms a beat can take, and how much chance goes into choosing
// each note from the next-note suggestions.

// How much a phrase writes: the next few notes at the note value chosen,
// or to the end of the bar, or of the bar after.
export const PHRASE_SIZES = [
  { id: 'notes', label: 'A few notes', notes: 4 },
  { id: 'bar', label: 'To the bar’s end', bars: 1 },
  { id: 'two-bars', label: 'Two bars', bars: 2 },
] as const

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
