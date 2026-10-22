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
