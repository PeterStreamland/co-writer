// Spelling notes that arrive as bare pitches, such as from a MIDI keyboard.
// The key decides: a scale note takes the scale's spelling, and the other
// notes take whichever sharp or flat spelling makes the chord read best in
// the key, so B♭ D F in C is ♭VII and E G♯ B is V/vi (SPEC 4).
import { chordNames, chordNotes, type NamedChord } from './chord-symbol'
import { LETTERS, noteAtMidi, pitchClass, type Note } from './note'
import { romanNumeral, type NumeralKind } from './numeral'
import { keySignature, scaleNotes, type Key } from './scale'

const KIND_RANK: Record<NumeralKind, number> = {
  diatonic: 0,
  secondary: 1,
  borrowed: 1,
  chromatic: 2,
}

// Every spelling of a pitch class with at most one sharp or flat, natural
// first: [B, C♭] for 11, [C♯, D♭] for 1, [D] for 2.
function spellings(pitch: number, flatsFirst: boolean): Note[] {
  const notes: Note[] = []
  for (const accidental of flatsFirst ? [0, -1, 1] : [0, 1, -1]) {
    for (const letter of LETTERS) {
      const note = { letter, accidental }
      if (pitchClass(note) === pitch) notes.push(note)
    }
  }
  return notes
}

// How well a spelling reads: the primary name's fit with the key, then how
// many notes it spells differently, then how many sharps and flats in all.
function score(notes: Note[], key: Key): number[] {
  const accidentals = notes.reduce((sum, n) => sum + Math.abs(n.accidental), 0)
  const names = chordNames(notes, { key })
  if (names.length === 0) return [0, 0, accidentals]
  const top: NamedChord = names[0]
  const own = [...chordNotes(top), ...(top.bass ? [top.bass] : [])]
  const respelled = notes.filter(
    (n) =>
      !own.some((o) => o.letter === n.letter && o.accidental === n.accidental),
  ).length
  return [KIND_RANK[romanNumeral(key, top).kind], respelled, accidentals]
}

function better(a: number[], b: number[]): boolean {
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] < b[i]
  return false
}

// The notes for these MIDI numbers, spelled for the key, in the order given.
// A lone note outside the scale follows the key signature: C♯ in C major,
// G♭ in F major.
export function spellPitches(midis: number[], key: Key): Note[] {
  const scale = scaleNotes(key.tonic, key.mode)
  const pitches = [...new Set(midis.map((m) => ((m % 12) + 12) % 12))]
  const fixed = new Map<number, Note>()
  const open: number[] = []
  for (const pitch of pitches) {
    const inScale = scale.find((n) => pitchClass(n) === pitch)
    if (inScale) fixed.set(pitch, inScale)
    else open.push(pitch)
  }
  const flatsFirst = (keySignature(key) ?? 0) < 0
  const choices = open.map((pitch) => spellings(pitch, flatsFirst))
  const pitchOf = (m: number) => ((m % 12) + 12) % 12
  // Try every mix of spellings for the notes outside the scale (rarely more
  // than a few dozen) and keep the one that reads best, earliest on a tie.
  const total = choices.reduce((n, c) => n * c.length, 1)
  let best = fixed
  let bestScore: number[] | undefined
  for (let index = 0; index < total; index++) {
    const spelling = new Map(fixed)
    let rest = index
    open.forEach((pitch, i) => {
      spelling.set(pitch, choices[i][rest % choices[i].length])
      rest = Math.floor(rest / choices[i].length)
    })
    const notes = midis.map((m) => noteAtMidi(spelling.get(pitchOf(m))!, m)!)
    const s = score(notes, key)
    if (!bestScore || better(s, bestScore)) {
      best = spelling
      bestScore = s
    }
  }
  return midis.map((m) => noteAtMidi(best.get(pitchOf(m))!, m)!)
}
