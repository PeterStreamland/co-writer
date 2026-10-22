// Shared by the lens tests: the test progressions as lens steps.
import {
  getScale,
  parseChordSymbol,
  parseNote,
  type ChordName,
  type Key,
  type LensStep,
} from '../src/theory'
import { lensProgressions } from './fixtures/lens-progressions'

export function key(text: string): Key {
  const [tonicText, modeText] = text.split(' ')
  const tonic = parseNote(tonicText)
  const mode = getScale(modeText === 'minor' ? 'natural-minor' : modeText)?.id
  if (!tonic || !mode) throw new Error(`${text} is not a key`)
  return { tonic, mode }
}

export function chord(text: string): ChordName {
  const parsed = parseChordSymbol(text)
  if (!parsed) throw new Error(`${text} did not parse`)
  return parsed
}

export function steps(keyText: string, chords: string): LensStep[] {
  const k = key(keyText)
  return chords.split(' ').map((c) => ({ key: k, chord: chord(c) }))
}

export const progressions = lensProgressions.map((p) => ({
  name: `${p.key}: ${p.chords}`,
  steps: steps(p.key, p.chords),
}))
