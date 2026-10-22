// The full-neck fretboard view (SPEC 5): every fret on every string, each
// with its mark. Frets 0–15 by default.
import { midiNumber, type Note } from '../theory'
import type { Mark } from './marks'

export type Fret = { string: number; fret: number; midi: number; mark?: Mark }

export const DEFAULT_FRETS = 15

// One row per string, lowest string first; each row runs from the open
// string (fret 0) to the last fret.
export function fretboardGrid(
  tuning: Note[],
  frets: number,
  mark: (midi: number) => Mark | undefined,
): Fret[][] {
  return tuning.map((open, string) => {
    const base = midiNumber(open)
    if (base === undefined) throw new Error('a tuning note needs an octave')
    const row: Fret[] = []
    for (let fret = 0; fret <= frets; fret++) {
      row.push({ string, fret, midi: base + fret, mark: mark(base + fret) })
    }
    return row
  })
}

// Frets with a position-marker dot on the neck; 12 and 24 have two.
export const DOT_FRETS = new Set([3, 5, 7, 9, 12, 15, 17, 19, 21, 24])
export const DOUBLE_DOT_FRETS = new Set([12, 24])
