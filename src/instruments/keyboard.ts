// The keyboard view's keys (SPEC 5): four octaves, C2–C6, on a laptop and
// two on a phone, each key with its mark.
import type { Mark } from './marks'

export type PianoKey = { midi: number; black: boolean; mark?: Mark }

const BLACK = new Set([1, 3, 6, 8, 10])

export const KEYBOARD_LOW = 36 // C2
export const KEYBOARD_HIGH = 84 // C6

// Every key from low to high inclusive.
export function pianoKeys(
  low: number,
  high: number,
  mark: (midi: number) => Mark | undefined,
): PianoKey[] {
  const keys: PianoKey[] = []
  for (let midi = low; midi <= high; midi++) {
    keys.push({ midi, black: BLACK.has(midi % 12), mark: mark(midi) })
  }
  return keys
}

// The lowest key of a view `span` semitones wide, starting on a C, moved
// so the held notes are in it (SPEC 5: the view scrolls when MIDI notes are
// played outside it). Unchanged when they already fit or nothing is held.
// When they can't all fit, the lowest held note wins.
export function scrollToHeld(
  low: number,
  span: number,
  held: number[],
): number {
  if (held.length === 0) return low
  const lowest = Math.min(...held)
  const highest = Math.max(...held)
  if (lowest >= low && highest <= low + span) return low
  let start = 12 * Math.floor(lowest / 12)
  if (highest > start + span) {
    start = Math.min(12 * Math.ceil((highest - span) / 12), start)
  }
  return Math.max(12, Math.min(start, 108 - span))
}
