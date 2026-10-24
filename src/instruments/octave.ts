// Moving a chord up or down an octave (David's request, 2026-10-23). On
// keyboard every note moves twelve semitones, keeping its spelling. On
// guitar the same shape twelve frets along where the neck has room, else
// the playable shape nearest the pitch asked for, so a shifted chord can
// always be played; none when the neck has nothing further that way.
import {
  chordNotes,
  midiNumber,
  pitchClass,
  type ChordName,
  type Note,
} from '../theory'
import { findFingerings } from './fingering'
import { MAX_FRET, type Guitar } from './guitar'

// How many octaves a chord may move each way, and the notes it must stay
// between: a piano's lowest A and highest C.
export const OCTAVE_LIMIT = 3
const LOWEST = 21
const HIGHEST = 108

const pitch = (n: Note) => midiNumber(n) as number
const mean = (notes: Note[]) =>
  notes.reduce((sum, n) => sum + pitch(n), 0) / Math.max(1, notes.length)

// The notes `by` octaves up (or down), or none if any leaves the piano.
export function shiftNotes(notes: Note[], by: number): Note[] | undefined {
  const moved = notes.map((n) => ({ ...n, octave: (n.octave ?? 4) + by }))
  return moved.every((n) => pitch(n) >= LOWEST && pitch(n) <= HIGHEST)
    ? moved
    : undefined
}

export type Shape = { frets: (number | null)[]; notes: Note[] }

// A guitar shape `by` octaves up (or down): the same shape 12 frets along
// where it fits on the neck, else the chord's shape whose notes sit
// nearest the pitch asked for, on that side of where it is now.
export function shiftShape(
  guitar: Guitar,
  chord: ChordName,
  shape: Shape,
  by: number,
): Shape | undefined {
  if (by === 0) return shape
  const along = shape.frets.map((f) => (f === null ? null : f + 12 * by))
  const fits = along.every(
    (f) => f === null || (f >= guitar.capo && f <= MAX_FRET),
  )
  const notes = fits && shiftNotes(shape.notes, by)
  if (notes) return { frets: along, notes }
  const now = mean(shape.notes)
  const target = now + 12 * by
  const neck = { ...guitar, frets: { low: 0, high: MAX_FRET } }
  let best: Shape | undefined
  let gap = Infinity
  for (const f of findFingerings(neck, chord)) {
    const sounding = f.notes.filter((n): n is Note => n !== null)
    const m = mean(sounding)
    if (Math.sign(m - now) !== Math.sign(by)) continue
    if (Math.abs(m - target) < gap) {
      gap = Math.abs(m - target)
      best = { frets: f.frets, notes: sounding }
    }
  }
  return best
}

// What counts against a shape for the next inversion: each semitone its
// bass is off the one asked for, each chord tone missing, each string not
// played, each point less easy to play, and each fret the hand moves.
const INVERT_COSTS = { bass: 10, missing: 8, string: 1.5, hard: 0.3, move: 1 }

// A guitar shape for the next inversion (PLAN Phase 7 task 9, David's
// request): of the playable shapes of the inverted chord, the one with the
// bass asked for (the next chord tone above the bass now, or below), else
// the nearest bass on that side; then a full shape (every chord tone, most
// strings), easy to play and near where the hand is on the neck. None when
// the neck has nothing that way.
export function invertShape(
  guitar: Guitar,
  chord: ChordName,
  shape: Shape,
  bass: number,
  by: number,
): Shape | undefined {
  const now = Math.min(...shape.notes.map(pitch))
  const frets = (fs: (number | null)[]) => {
    const pressed = fs.filter((f): f is number => f !== null && f > 0)
    return pressed.length
      ? pressed.reduce((a, b) => a + b, 0) / pressed.length
      : 0
  }
  const here = frets(shape.frets)
  const neck = { ...guitar, frets: { low: 0, high: MAX_FRET } }
  const tones = [...new Set(chordNotes(chord).map(pitchClass))]
  let best: Shape | undefined
  let cost = Infinity
  for (const f of findFingerings(neck, chord)) {
    const sounding = f.notes.filter((n): n is Note => n !== null)
    const low = Math.min(...sounding.map(pitch))
    if (Math.sign(low - now) !== Math.sign(by)) continue
    const missing = tones.filter(
      (t) => !sounding.some((n) => pitchClass(n) === t),
    ).length
    const c =
      Math.abs(low - bass) * INVERT_COSTS.bass +
      missing * INVERT_COSTS.missing +
      (guitar.strings.length - sounding.length) * INVERT_COSTS.string +
      (100 - f.score) * INVERT_COSTS.hard +
      Math.abs(frets(f.frets) - here) * INVERT_COSTS.move
    if (c < cost) {
      cost = c
      best = { frets: f.frets, notes: sounding }
    }
  }
  return best
}
