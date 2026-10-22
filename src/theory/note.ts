// Spelled notes. A note keeps its letter, accidental and optional octave;
// pitch numbers are derived from those, never stored on their own (SPEC 4, 12).

export const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const
export type Letter = (typeof LETTERS)[number]

export type Note = {
  letter: Letter
  accidental: number // semitones: -2 is 𝄫, -1 ♭, 0 natural, 1 ♯, 2 𝄪
  octave?: number // scientific pitch: middle C is C4
}

export type FormatOptions = { ascii?: boolean }

// Semitones of each natural letter above C.
const NATURAL_SEMITONES: Record<Letter, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
}

const ACCIDENTAL_VALUES: Record<string, number> = {
  '#': 1,
  '♯': 1,
  x: 2,
  '𝄪': 2,
  b: -1,
  '♭': -1,
  '𝄫': -2,
}

const NOTE_PATTERN = /^([A-Ga-g])(♮|[#♯x𝄪]*|[b♭𝄫]*)(-?\d+)?$/u

// Reads a typed or displayed note name: C4, Bb3, F#, Fx, E𝄫, bb (B♭).
export function parseNote(text: string): Note | undefined {
  const match = NOTE_PATTERN.exec(text.trim())
  if (!match) return undefined
  const [, letter, accidentals, octave] = match
  let accidental = 0
  for (const symbol of accidentals) accidental += ACCIDENTAL_VALUES[symbol] ?? 0
  const note: Note = { letter: letter.toUpperCase() as Letter, accidental }
  if (octave !== undefined) note.octave = Number(octave)
  return note
}

// Accidental as display symbols (♯, 𝄪, ♭𝄫) or typed characters (#, ##, bbb).
export function formatAccidental(
  accidental: number,
  options: FormatOptions = {},
): string {
  const size = Math.abs(accidental)
  if (options.ascii) return (accidental > 0 ? '#' : 'b').repeat(size)
  const single = accidental > 0 ? '♯' : '♭'
  const double = accidental > 0 ? '𝄪' : '𝄫'
  return (size % 2 ? single : '') + double.repeat(Math.floor(size / 2))
}

export function formatNote(note: Note, options: FormatOptions = {}): string {
  return (
    note.letter +
    formatAccidental(note.accidental, options) +
    (note.octave ?? '')
  )
}

export function letterIndex(letter: Letter): number {
  return LETTERS.indexOf(letter)
}

export function naturalSemitones(letter: Letter): number {
  return NATURAL_SEMITONES[letter]
}

// 0–11, with C = 0. B♯ is 0 and C♭ is 11.
export function pitchClass(note: Note): number {
  return mod(NATURAL_SEMITONES[note.letter] + note.accidental, 12)
}

// MIDI note number, middle C = C4 = 60. Undefined for a note with no octave.
export function midiNumber(note: Note): number | undefined {
  if (note.octave === undefined) return undefined
  return (
    (note.octave + 1) * 12 + NATURAL_SEMITONES[note.letter] + note.accidental
  )
}

// Same sounding pitch (G♯ and A♭); with octaves, the same key on the piano.
export function enharmonic(a: Note, b: Note): boolean {
  const midiA = midiNumber(a)
  const midiB = midiNumber(b)
  if (midiA !== undefined && midiB !== undefined) return midiA === midiB
  return pitchClass(a) === pitchClass(b)
}

// Same letter, accidental and octave.
export function sameSpelling(a: Note, b: Note): boolean {
  return (
    a.letter === b.letter &&
    a.accidental === b.accidental &&
    a.octave === b.octave
  )
}

export function mod(n: number, m: number): number {
  return ((n % m) + m) % m
}

// The note spelled as given, in the octave that sounds this MIDI number: B♯
// at 60 is B♯3, C♭ at 59 is C♭4. Undefined if the spelling isn't that pitch.
export function noteAtMidi(spelling: Note, midi: number): Note | undefined {
  const offset = NATURAL_SEMITONES[spelling.letter] + spelling.accidental
  const octave = (midi - offset) / 12 - 1
  if (!Number.isInteger(octave)) return undefined
  return { letter: spelling.letter, accidental: spelling.accidental, octave }
}
