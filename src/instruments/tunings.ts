// Guitar tunings as data: open strings from lowest to highest, with octaves.
// Phase 2 task 5 adds the other presets.
import { parseNote, type Note } from '../theory'

function notes(text: string): Note[] {
  return text.split(' ').map((n) => parseNote(n) as Note)
}

export const STANDARD_TUNING = notes('E2 A2 D3 G3 B3 E4')
