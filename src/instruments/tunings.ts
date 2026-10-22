// Guitar tunings as data: open strings from lowest to highest, with octaves,
// spelled as guitarists name them (E♭ standard, not D♯). A 7-string guitar
// adds a string a perfect 4th below the lowest, so Standard becomes 7-string
// B standard and E♭ standard gets a low B♭.
import { parseInterval, parseNote, transposeDown, type Note } from '../theory'

function notes(text: string): Note[] {
  return text.split(' ').map((n) => parseNote(n) as Note)
}

export type Tuning = {
  id: string
  name: string
  group: string
  strings: Note[]
}

export const TUNINGS: Tuning[] = [
  {
    id: 'standard',
    name: 'Standard',
    group: 'Standard and lowered',
    strings: notes('E2 A2 D3 G3 B3 E4'),
  },
  {
    id: 'e-flat',
    name: 'E♭ standard (half step down)',
    group: 'Standard and lowered',
    strings: notes('Eb2 Ab2 Db3 Gb3 Bb3 Eb4'),
  },
  {
    id: 'd-standard',
    name: 'D standard (whole step down)',
    group: 'Standard and lowered',
    strings: notes('D2 G2 C3 F3 A3 D4'),
  },
  {
    id: 'c-standard',
    name: 'C standard',
    group: 'Standard and lowered',
    strings: notes('C2 F2 Bb2 Eb3 G3 C4'),
  },
  {
    id: 'drop-d',
    name: 'Drop D',
    group: 'Drop',
    strings: notes('D2 A2 D3 G3 B3 E4'),
  },
  {
    id: 'double-drop-d',
    name: 'Double drop D',
    group: 'Drop',
    strings: notes('D2 A2 D3 G3 B3 D4'),
  },
  {
    id: 'drop-c-sharp',
    name: 'Drop C♯',
    group: 'Drop',
    strings: notes('C#2 G#2 C#3 F#3 A#3 D#4'),
  },
  {
    id: 'drop-c',
    name: 'Drop C',
    group: 'Drop',
    strings: notes('C2 G2 C3 F3 A3 D4'),
  },
  {
    id: 'drop-b',
    name: 'Drop B',
    group: 'Drop',
    strings: notes('B1 F#2 B2 E3 G#3 C#4'),
  },
  {
    id: 'dadgad',
    name: 'DADGAD',
    group: 'Open and modal',
    strings: notes('D2 A2 D3 G3 A3 D4'),
  },
  {
    id: 'open-g',
    name: 'Open G',
    group: 'Open and modal',
    strings: notes('D2 G2 D3 G3 B3 D4'),
  },
  {
    id: 'open-d',
    name: 'Open D',
    group: 'Open and modal',
    strings: notes('D2 A2 D3 F#3 A3 D4'),
  },
  {
    id: 'open-e',
    name: 'Open E',
    group: 'Open and modal',
    strings: notes('E2 B2 E3 G#3 B3 E4'),
  },
  {
    id: 'open-a',
    name: 'Open A',
    group: 'Open and modal',
    strings: notes('E2 A2 E3 A3 C#4 E4'),
  },
  {
    id: 'open-c',
    name: 'Open C',
    group: 'Open and modal',
    strings: notes('C2 G2 C3 G3 C4 E4'),
  },
]

export const STANDARD_TUNING = TUNINGS[0].strings

const FOURTH = parseInterval('P4')!

// The open strings for a preset, lowest first, with a 7th string a 4th below
// the lowest for a 7-string guitar.
export function tuningStrings(id: string, sevenString: boolean): Note[] {
  const tuning = TUNINGS.find((t) => t.id === id) ?? TUNINGS[0]
  if (!sevenString) return tuning.strings
  return [transposeDown(tuning.strings[0], FOURTH), ...tuning.strings]
}
