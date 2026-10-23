// Chord-tone colours (Phase 3 task 9): each note of the current chord by its
// interval above the root, as a label (R, ♭3, 5, ♭7, 9) and a colour role.
// The root, 3rd, 5th and 7th have a colour each, whatever their quality (a
// ♭5 is still the 5th); 9ths, 11ths, 13ths, the 2nd and 4th of a sus chord,
// a 6th, and a bass outside the chord share one. Pure: no UI, audio or DOM.
import {
  chordIntervals,
  degreeLabel,
  intervalBetween,
  pitchClass,
  transpose,
  type ChordName,
  type Note,
} from '../theory'

export type ToneRole = 'root' | 'third' | 'fifth' | 'seventh' | 'extension'

export type ChordTone = { label: string; role: ToneRole; note: Note }

const ROLES: Record<number, ToneRole> = {
  1: 'root',
  3: 'third',
  5: 'fifth',
  7: 'seventh',
}

// The colour role of a tone by its interval number above the root.
export function roleOf(number: number): ToneRole {
  return ROLES[number] ?? 'extension'
}

// A label from the root to a note, numbered as given: ♭9, not ♭2.
function label(root: Note, note: Note, number: number): string {
  if (number === 1) return 'R'
  return degreeLabel(root, note).replace(/\d+$/, String(number))
}

// Each pitch class the chord sounds, with its tone. A bass outside the chord
// (F/G) is named as the extension it would be: G over F is the 9th.
export function chordTones(chord: ChordName): Map<number, ChordTone> {
  const intervals = chordIntervals(chord.quality)
  if (!intervals) throw new Error(`unknown chord quality ${chord.quality}`)
  const tones = new Map<number, ChordTone>()
  for (const interval of intervals) {
    const note = transpose(chord.root, interval)
    tones.set(pitchClass(note), {
      label: label(chord.root, note, interval.number),
      role: ROLES[interval.number] ?? 'extension',
      note,
    })
  }
  const bass = chord.bass
  if (bass && !tones.has(pitchClass(bass))) {
    const simple = ((intervalBetween(chord.root, bass).number - 1) % 7) + 1
    const number = [2, 4, 6].includes(simple) ? simple + 7 : simple
    tones.set(pitchClass(bass), {
      label: label(chord.root, bass, number),
      role: ROLES[number] ?? 'extension',
      note: bass,
    })
  }
  return tones
}
