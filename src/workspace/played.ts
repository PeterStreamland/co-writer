// What the MIDI panel shows for the notes being held: each note spelled for
// the key, and every name the chord could have, the best fit first (SPEC 5).
// No theory lives here.
import {
  chordNames,
  chordSymbol,
  describeNumeral,
  formatNote,
  romanNumeral,
  spellPitches,
  type Key,
  type Note,
} from '../theory'

export type PlayedName = { symbol: string; numeral: string; reading: string }

export type Played = { notes: Note[]; labels: string[]; names: PlayedName[] }

const TONE_NAMES: Record<number, string> = { 5: '5th', 9: '9th', 11: '11th' }

export function played(key: Key, midis: number[]): Played {
  const notes = spellPitches(midis, key)
  const names = chordNames(notes, { key }).map((name) => {
    const numeral = romanNumeral(key, name)
    const omitted = (name.omitted ?? []).map((n) => TONE_NAMES[n] ?? `${n}th`)
    return {
      symbol: chordSymbol(name),
      numeral: numeral.numeral,
      reading:
        describeNumeral(key, numeral) +
        (omitted.length ? ` (no ${omitted.join(' or ')})` : ''),
    }
  })
  return { notes, labels: notes.map((n) => formatNote(n)), names }
}
