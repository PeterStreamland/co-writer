// Guitar tunings as data: open strings from lowest to highest, with octaves
// (SPEC 5 presets). A 7-string guitar adds a low B below whichever tuning is
// chosen, so standard becomes 7-string B standard.
import { parseNote, type Note } from '../theory'

function notes(text: string): Note[] {
  return text.split(' ').map((n) => parseNote(n) as Note)
}

export type Tuning = { id: string; name: string; strings: Note[] }

export const TUNINGS: Tuning[] = [
  { id: 'standard', name: 'Standard', strings: notes('E2 A2 D3 G3 B3 E4') },
  { id: 'drop-d', name: 'Drop D', strings: notes('D2 A2 D3 G3 B3 E4') },
  { id: 'dadgad', name: 'DADGAD', strings: notes('D2 A2 D3 G3 A3 D4') },
]

export const SEVENTH_STRING = notes('B1')[0]

export const STANDARD_TUNING = TUNINGS[0].strings

// The open strings for a preset, lowest first, with the low B added for a
// 7-string guitar.
export function tuningStrings(id: string, sevenString: boolean): Note[] {
  const tuning = TUNINGS.find((t) => t.id === id) ?? TUNINGS[0]
  return sevenString ? [SEVENTH_STRING, ...tuning.strings] : tuning.strings
}
