// Filling a bar of a line with any number of notes, as data (David's
// request, 2026-10-23): how each mode likes to move when it has more notes
// to play than its own, and how much chance a refresh adds.
import type { LineModeId } from './lines-data'

// The kinds of note a bar can add between the notes it keeps: another
// chord tone, the last note again, a scale step or a semitone toward the
// next note, a step away (a neighbour), or a semitone into the next note.
export type FillKind =
  'tone' | 'repeat' | 'passing' | 'chromatic' | 'neighbour' | 'approach'

export type FillWeights = Record<FillKind, number>

const BETWEEN: FillWeights = {
  tone: 2,
  repeat: -1,
  passing: 3,
  chromatic: 0.5,
  neighbour: 1.5,
  approach: 2.5,
}

const INNER: FillWeights = {
  tone: 2,
  repeat: 0.5,
  passing: 2,
  chromatic: 0,
  neighbour: 2,
  approach: 1,
}

// Each mode's liking for each kind: roots and pedals repeat, walking walks,
// lines between chords pass, chromatic lines go by semitone.
export const FILL_WEIGHTS: Record<LineModeId, FillWeights> = {
  roots: {
    tone: 1,
    repeat: 3,
    passing: 0,
    chromatic: -1,
    neighbour: -1,
    approach: 1,
  },
  'root-fifth': {
    tone: 2.5,
    repeat: 1,
    passing: 0.5,
    chromatic: -1,
    neighbour: 0,
    approach: 1.5,
  },
  approach: {
    tone: 1.5,
    repeat: 0.5,
    passing: 0.5,
    chromatic: 0,
    neighbour: 0,
    approach: 3,
  },
  walking: {
    tone: 2.5,
    repeat: -2,
    passing: 2.5,
    chromatic: 1,
    neighbour: 1,
    approach: 3,
  },
  pedal: {
    tone: 0,
    repeat: 4,
    passing: -2,
    chromatic: -3,
    neighbour: -1,
    approach: -2,
  },
  tenor: INNER,
  alto: INNER,
  'guide-3rd': INNER,
  'guide-7th': INNER,
  'scale-steps': BETWEEN,
  chromatic: { ...BETWEEN, chromatic: 3.5, passing: 2 },
  enclosure: { ...BETWEEN, approach: 3, neighbour: 2.5 },
  wildcard: {
    tone: 2,
    repeat: 0,
    passing: 2,
    chromatic: 1.5,
    neighbour: 2,
    approach: 2,
  },
}

// Each semitone a note moves from the last costs this much.
export const FILL_MOVE = 0.2
// Landing on the next kept note's pitch just before it costs this.
export const FILL_INTO_TARGET = 1
// Repeating a note that was itself a repeat costs this, so a held note
// doesn't drum on.
export const REPEAT_AGAIN = 2
// Going straight back to the note before last costs this, so a long bar
// doesn't rock between two notes.
export const BACK_AGAIN = 1.5
// A refresh adds up to this much chance to each kind's score, and to each
// place in the bar's rhythm, so the best still wins most often.
export const FILL_CHANCE = 3
export const RHYTHM_CHANCE = 2.5

// The most notes a bar may have, and the shortest note: a semiquaver.
export const MOST_NOTES = 16
export const GRID: [n: number, d: number] = [1, 16]

// How much each place in a bar counts when choosing where notes fall:
// beats by strength, then the half-beats, then the semiquavers.
export const PLACE_WEIGHTS = {
  downbeat: 4,
  strong: 3,
  weak: 2,
  half: 1,
  quarter: 0,
}
