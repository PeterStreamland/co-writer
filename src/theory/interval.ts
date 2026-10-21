// Spelled intervals. An interval keeps its number (letter distance) and
// quality, so C–D♯ is an augmented 2nd and C–E♭ a minor 3rd (SPEC 4).
import {
  LETTERS,
  formatAccidental,
  letterIndex,
  midiNumber,
  mod,
  naturalSemitones,
  pitchClass,
  type FormatOptions,
  type Note,
} from './note'

// P perfect, M major, m minor, A augmented, d diminished; AA, dd and beyond
// for doubly augmented or diminished.
export type Interval = { quality: string; number: number }

// Semitones of the major-scale interval for each simple number (1–7).
const MAJOR_SEMITONES = [0, 2, 4, 5, 7, 9, 11]

const INTERVAL_PATTERN = /^(P|M|m|A+|d+)([1-9]\d*)$/

function isPerfectType(number: number): boolean {
  return [0, 3, 4].includes((number - 1) % 7)
}

// Semitones of the perfect or major interval with this number.
function baseSemitones(number: number): number {
  const steps = number - 1
  return 12 * Math.floor(steps / 7) + MAJOR_SEMITONES[steps % 7]
}

// Quality as semitones above the perfect or major interval.
function qualityOffset({ quality, number }: Interval): number {
  if (quality === 'P' || quality === 'M') return 0
  if (quality === 'm') return -1
  if (quality[0] === 'A') return quality.length
  return isPerfectType(number) ? -quality.length : -quality.length - 1
}

function qualityFor(number: number, offset: number): string {
  if (isPerfectType(number)) {
    if (offset === 0) return 'P'
    return offset > 0 ? 'A'.repeat(offset) : 'd'.repeat(-offset)
  }
  if (offset === 0) return 'M'
  if (offset === -1) return 'm'
  return offset > 0 ? 'A'.repeat(offset) : 'd'.repeat(-offset - 1)
}

// Reads M3, P5, A4, d7, m9, dd7.
export function parseInterval(text: string): Interval | undefined {
  const match = INTERVAL_PATTERN.exec(text.trim())
  if (!match) return undefined
  const [, quality, digits] = match
  const number = Number(digits)
  const perfect = isPerfectType(number)
  if (perfect && (quality === 'M' || quality === 'm')) return undefined
  if (!perfect && quality === 'P') return undefined
  return { quality, number }
}

export function formatInterval(interval: Interval): string {
  return `${interval.quality}${interval.number}`
}

export function semitones(interval: Interval): number {
  return baseSemitones(interval.number) + qualityOffset(interval)
}

// The interval between two notes. With octaves on both, it is measured up
// from the lower note and can be compound (C4–D5 is a M9); otherwise it is the
// interval up from `from` to `to` within an octave (E–C is a m6), unless the
// spelling pushes it past one (E♯–F♭ is a dd9).
export function intervalBetween(from: Note, to: Note): Interval {
  const fromMidi = midiNumber(from)
  const toMidi = midiNumber(to)
  if (
    fromMidi === undefined ||
    toMidi === undefined ||
    from.octave === undefined ||
    to.octave === undefined
  ) {
    const simple = simpleDegree(from, to)
    // An interval that would fall in pitch rises an octave instead:
    // C up to C♭ is a d8, E♯ up to F♭ a dd9.
    const below = baseSemitones(simple.number) + simple.offset < 0
    const number = below ? simple.number + 7 : simple.number
    return { quality: qualityFor(number, simple.offset), number }
  }
  let steps =
    to.octave * 7 +
    letterIndex(to.letter) -
    (from.octave * 7 + letterIndex(from.letter))
  let size = toMidi - fromMidi
  if (steps < 0 || (steps === 0 && size < 0)) {
    steps = -steps
    size = -size
  }
  const number = steps + 1
  return { quality: qualityFor(number, size - baseSemitones(number)), number }
}

function moveBy(note: Note, interval: Interval, direction: 1 | -1): Note {
  const position = letterIndex(note.letter) + direction * (interval.number - 1)
  const letter = LETTERS[mod(position, 7)]
  const octaveShift = Math.floor(position / 7)
  const target =
    naturalSemitones(note.letter) +
    note.accidental +
    direction * semitones(interval)
  const accidental = target - naturalSemitones(letter) - 12 * octaveShift
  const result: Note = { letter, accidental }
  if (note.octave !== undefined) result.octave = note.octave + octaveShift
  return result
}

// Moves a note up by an interval, keeping spelling: A♭ up a m6 is F♭.
export function transpose(note: Note, interval: Interval): Note {
  return moveBy(note, interval, 1)
}

export function transposeDown(note: Note, interval: Interval): Note {
  return moveBy(note, interval, -1)
}

// Scale-degree label measured from the major scale on the tonic, following
// spelling: in C, E♭ is ♭3 and D♯ is ♯2; in A, C is ♭3.
export function degreeLabel(
  tonic: Note,
  note: Note,
  options: FormatOptions = {},
): string {
  const { number, offset } = simpleDegree(tonic, note)
  return formatAccidental(offset, options) + number
}

// Letter distance (1–7) from one note up to another, and the semitones by
// which it differs from the major-scale interval of that number.
function simpleDegree(from: Note, to: Note) {
  const number = mod(letterIndex(to.letter) - letterIndex(from.letter), 7) + 1
  const difference = pitchClass(to) - pitchClass(from)
  const offset = mod(difference - baseSemitones(number) + 6, 12) - 6
  return { number, offset }
}
