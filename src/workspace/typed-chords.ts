// Typing a progression (Phase 5 task 1): chord symbols separated by spaces,
// commas or bar lines, in either symbol style, with typed or displayed
// accidentals: "Em C G D", "| Am7 | D7 | Gmaj7 |", "F#m7b5, B7, Em". A dash
// on its own ("C - G") is a separator too, and a lower-case root is read as
// a capital, so "em" is Em. The parsing itself is the
// theory core's.
import { parseChordSymbol, type ChordName } from '../theory'

export type TypedChords = {
  chords: ChordName[]
  unread: string[] // the words that aren't chord symbols, in order
}

const SEPARATORS = /[\s,|]+/
const DASHES = /^[-–—]+$/

export function readTypedChords(text: string): TypedChords {
  const chords: ChordName[] = []
  const unread: string[] = []
  for (const word of text.split(SEPARATORS)) {
    if (!word || DASHES.test(word)) continue
    const chord = parseChordSymbol(
      word.replace(/^[a-g]/, (l) => l.toUpperCase()),
    )
    if (chord) chords.push(chord)
    else unread.push(word)
  }
  return { chords, unread }
}
