// The full-neck fretboard view (SPEC 5): every fret on every string, each
// with its mark. Frets 0–15 by default.
import { midiNumber } from '../theory'
import { fretMidi, type Guitar } from './guitar'
import type { Mark } from './marks'

export type Fret = {
  string: number
  fret: number
  midi: number
  mark?: Mark
  behindCapo?: boolean
}

// One row per string, lowest string first; each row runs from the nut
// (fret 0) to the guitar's last fret. Frets behind the capo carry no mark.
export function fretboardGrid(
  guitar: Guitar,
  mark: (midi: number) => Mark | undefined,
): Fret[][] {
  return guitar.strings.map((open, string) => {
    const base = midiNumber(open) as number
    const row: Fret[] = []
    for (let fret = 0; fret <= guitar.frets.high; fret++) {
      const midi = fretMidi(guitar, string, fret)
      row.push(
        midi === undefined
          ? { string, fret, midi: base + fret, behindCapo: true }
          : { string, fret, midi, mark: mark(midi) },
      )
    }
    return row
  })
}

// Frets with a position-marker dot on the neck; 12 and 24 have two.
export const DOT_FRETS = new Set([3, 5, 7, 9, 12, 15, 17, 19, 21, 24])
export const DOUBLE_DOT_FRETS = new Set([12, 24])
