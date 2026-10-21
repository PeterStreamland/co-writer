// Key spellings for the key picker (SPEC 4): the commonly used spelling of
// each tonic, an enharmonic swap to the other, and all 30 key signatures
// reachable between the two.
import { LETTERS, pitchClass, type Note } from './note'
import { keySignature, scaleNotes, type Key } from './scale'

// The most sharps or flats a key may need before it is only theoretical:
// C♯ and C♭ major have seven; D♯ major would need F𝄪 and C𝄪.
const MOST_ACCIDENTALS = 7

// Sharps and flats written in the key's notes, a double counting as two.
// For a mode of major this is the size of its key signature.
function accidentalCount(key: Key): number {
  return scaleNotes(key.tonic, key.mode).reduce(
    (sum, note) => sum + Math.abs(note.accidental),
    0,
  )
}

// A key people can write in: a key signature of no more than seven sharps or
// flats (D♯ harmonic minor, with its C𝄪 written in, is fine), or for a scale
// with no signature, no more than seven in its notes and no doubles (C♯
// blues, but not B♯ blues with its F𝄪).
function usable(key: Key): boolean {
  if (Math.abs(key.tonic.accidental) > 1) return false
  const signature = keySignature(key)
  if (signature !== undefined) return Math.abs(signature) <= MOST_ACCIDENTALS
  return (
    accidentalCount(key) <= MOST_ACCIDENTALS &&
    scaleNotes(key.tonic, key.mode).every((n) => Math.abs(n.accidental) <= 1)
  )
}

// Every spelling of a pitch class with at most one sharp or flat, natural
// first, then sharp before flat: [C♯, D♭] for 1, [C, B♯] for 0.
function spellings(pitch: number): Note[] {
  const notes: Note[] = []
  for (const accidental of [0, 1, -1]) {
    for (const letter of LETTERS) {
      const note = { letter, accidental }
      if (pitchClass(note) === pitch) notes.push(note)
    }
  }
  return notes
}

// The tonics the picker lists for a scale, one or two per pitch class from C
// to B. A natural tonic is always the one listed; on a black key the spelling
// with fewer sharps or flats wins, and both are listed on a tie (F♯ and G♭
// major, D♯ and E♭ minor). Major lists C D♭ D E♭ E F F♯ G♭ G A♭ A B♭ B.
export function pickerTonics(mode: string): Note[] {
  const tonics: Note[] = []
  for (let pitch = 0; pitch < 12; pitch++) {
    const options = spellings(pitch)
    if (options[0].accidental === 0) {
      tonics.push(options[0])
      continue
    }
    const counts = options.map((tonic) => accidentalCount({ tonic, mode }))
    const fewest = Math.min(...counts)
    tonics.push(...options.filter((_, i) => counts[i] === fewest))
  }
  return tonics
}

// The other spelling of the key, if people can write in it or it is the one
// the picker lists: D♭ major swaps to C♯ major and B major
// to C♭ major, but E♭ major has no swap (D♯ major is theoretical) and neither
// has C major.
export function enharmonicKey(key: Key): Key | undefined {
  const other = spellings(pitchClass(key.tonic)).find(
    (tonic) =>
      tonic.letter !== key.tonic.letter ||
      tonic.accidental !== key.tonic.accidental,
  )
  if (!other) return undefined
  const swapped = { tonic: other, mode: key.mode }
  return usable(swapped) || listed(swapped) ? swapped : undefined
}

function listed(key: Key): boolean {
  return pickerTonics(key.mode).some(
    (t) =>
      t.letter === key.tonic.letter && t.accidental === key.tonic.accidental,
  )
}

// The key on the same tonic in another scale, keeping its spelling where the
// new scale can use it: C♯ major to C♯ Dorian, but D♭ major to C♯ minor, as
// D♭ minor would need B𝄫.
export function keyInMode(key: Key, mode: string): Key {
  const kept = { tonic: key.tonic, mode }
  if (usable(kept)) return kept
  const pitch = pitchClass(key.tonic)
  const tonic = pickerTonics(mode).find((t) => pitchClass(t) === pitch)!
  return { tonic, mode }
}
