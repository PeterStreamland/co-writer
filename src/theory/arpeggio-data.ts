// The Arpeggio tab's choices, as data (PLAN Phase 6 task 2): how far up the
// chord an arpeggio stacks, the patterns it can follow and the rates it can
// move at. Each pattern walks the arpeggio's notes, lowest first, in a
// direction, taking a group of them at each step: [0, 2] plays 1–3, 2–4,
// 3–5…; [0, 1, 2] plays 1–2–3, 2–3–4…
import type { Dur } from './duration'

export type ArpeggioLevel =
  'triad' | 'seventh' | 'ninth' | 'eleventh' | 'thirteenth'

// Each level and the interval numbers it reaches: a 9th chord has its 7th.
export const ARPEGGIO_LEVELS: {
  id: ArpeggioLevel
  label: string
  numbers: number[]
}[] = [
  { id: 'triad', label: 'Triad', numbers: [1, 3, 5] },
  { id: 'seventh', label: '7th', numbers: [1, 3, 5, 7] },
  { id: 'ninth', label: '9th', numbers: [1, 3, 5, 7, 9] },
  { id: 'eleventh', label: '11th', numbers: [1, 3, 5, 7, 9, 11] },
  { id: 'thirteenth', label: '13th', numbers: [1, 3, 5, 7, 9, 11, 13] },
]

// Where an added tone falls, by letters above the root (the 7th is six
// letters up), and the interval it takes when the key has no note on that
// letter (pentatonic and other short scales).
export const ADDED_TONES: Record<
  number,
  { letters: number; fallback: string }
> = {
  7: { letters: 6, fallback: 'm7' },
  9: { letters: 1, fallback: 'M9' },
  11: { letters: 3, fallback: 'P11' },
  13: { letters: 5, fallback: 'M13' },
}

// Where a borrowed chord's added tones come from (David's choice, Phase 6
// gate): the first mode on the key's tonic that holds all the chord's own
// notes, tried in this order. A major key borrows from its minors first (Fm
// in C is iv of C minor, so Fm7), a minor key from harmonic and melodic
// minor first (E in A minor is V of A harmonic minor, so E7♭9). A chord no
// mode on the tonic holds (a secondary dominant: E7 in C) takes the key's.
export const BORROW_ORDER: { major: string[]; minor: string[] } = {
  major: [
    'natural-minor',
    'dorian',
    'mixolydian',
    'phrygian',
    'lydian',
    'harmonic-minor',
    'melodic-minor',
    'locrian',
  ],
  minor: [
    'harmonic-minor',
    'melodic-minor',
    'dorian',
    'major',
    'mixolydian',
    'phrygian',
    'lydian',
    'natural-minor',
    'locrian',
  ],
}

export type PatternDirection = 'up' | 'down' | 'up-down' | 'down-up'

// Most patterns walk the notes in a direction, playing `group` from each
// step (broken 3rds are [0, 2]). A few have their own shape: Alberti stays
// on the lowest three notes, a pedal returns to the lowest note between
// each of the others, and outside-in alternates the ends working inwards.
export type ArpeggioPattern = {
  id: string
  label: string
  direction: PatternDirection
  group: number[]
  shape?: 'alberti' | 'pedal' | 'outside-in'
}

export const ARPEGGIO_PATTERNS: ArpeggioPattern[] = [
  { id: 'up', label: 'Up', direction: 'up', group: [0] },
  { id: 'down', label: 'Down', direction: 'down', group: [0] },
  { id: 'up-down', label: 'Up and down', direction: 'up-down', group: [0] },
  { id: 'down-up', label: 'Down and up', direction: 'down-up', group: [0] },
  {
    id: 'broken-up',
    label: 'Broken, up (1–3, 2–4…)',
    direction: 'up',
    group: [0, 2],
  },
  {
    id: 'broken-down',
    label: 'Broken, down',
    direction: 'down',
    group: [0, 2],
  },
  {
    id: 'threes-up',
    label: 'In threes, up (1–2–3, 2–3–4…)',
    direction: 'up',
    group: [0, 1, 2],
  },
  {
    id: 'threes-down',
    label: 'In threes, down',
    direction: 'down',
    group: [0, 1, 2],
  },
  // More patterns (David's request, 2026-10-24).
  {
    id: 'fours-up',
    label: 'In fours, up (1–2–3–4, 2–3–4–5…)',
    direction: 'up',
    group: [0, 1, 2, 3],
  },
  {
    id: 'fours-down',
    label: 'In fours, down',
    direction: 'down',
    group: [0, 1, 2, 3],
  },
  {
    id: 'turns-up',
    label: 'Turns, up (1–2–3–2, 2–3–4–3…)',
    direction: 'up',
    group: [0, 1, 2, 1],
  },
  {
    id: 'turns-down',
    label: 'Turns, down',
    direction: 'down',
    group: [0, 1, 2, 1],
  },
  {
    id: 'alberti',
    label: 'Alberti (low–high–middle–high)',
    direction: 'up',
    group: [0, 2, 1, 2],
    shape: 'alberti',
  },
  {
    id: 'pedal',
    label: 'Pedal on the lowest note (1–2–1–3…)',
    direction: 'up',
    group: [0],
    shape: 'pedal',
  },
  {
    id: 'outside-in',
    label: 'Outside in (lowest, highest, inwards)',
    direction: 'up',
    group: [0],
    shape: 'outside-in',
  },
]

export const ARPEGGIO_RATES: { id: string; label: string; note: Dur }[] = [
  { id: '8ths', label: '8ths', note: { n: 1, d: 8 } },
  { id: 'triplets', label: '8th triplets', note: { n: 1, d: 12 } },
  { id: '16ths', label: '16ths', note: { n: 1, d: 16 } },
]
