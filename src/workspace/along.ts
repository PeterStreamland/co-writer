// Notes that play along with the progression (Phase 6 task 5): a line from
// the Lines tab, or arpeggios from the Arpeggio tab (David's request). The
// workspace plays the chords and these notes together; `source` lets the
// tab that sent them know they're its own, and `ref` lets it find which of
// its notes is sounding.
import type { Dur, Note } from '../theory'

export type AlongNote = {
  step: number // the chord of the progression it sounds over
  onset: Dur // from the start of the progression
  length: Dur
  note: Note
  ref: number
  // How a row shows it: its interval over the chord (R, ♭3, 9) and the
  // class that colours its box (a line's tag, an arpeggio tone's role).
  label?: string
  look?: string
}

export type Along = { source: object; notes: AlongNote[] }
