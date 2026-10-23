// Moving a chord up or down an octave (David's request, 2026-10-23). On
// keyboard every note moves twelve semitones, keeping its spelling. On
// guitar the same shape twelve frets along where the neck has room, else
// the playable shape nearest the pitch asked for, so a shifted chord can
// always be played; none when the neck has nothing further that way.
import { midiNumber, type ChordName, type Note } from '../theory'
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
