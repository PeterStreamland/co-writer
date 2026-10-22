import { describe, expect, it } from 'vitest'
import {
  chordInsight,
  getScale,
  parseChordSymbol,
  parseNote,
  type Key,
} from '../../src/theory'
import { insights } from '../fixtures/insights'

function key(text: string): Key {
  const [tonicText, modeText] = text.split(' ')
  const tonic = parseNote(tonicText)
  const mode = getScale(modeText === 'minor' ? 'natural-minor' : modeText)?.id
  if (!tonic || !mode) throw new Error(`${text} is not a key`)
  return { tonic, mode }
}

describe('chordInsight (golden fixture)', () => {
  it.each(insights)(
    '$chord after $previous in $key',
    ({ key: k, previous, chord, ...expected }) => {
      const insight = chordInsight(
        key(k),
        parseChordSymbol(chord)!,
        previous ? parseChordSymbol(previous)! : undefined,
      )
      expect(insight).toEqual(expected)
    },
  )
})

describe('chordInsight spelling (Phase 4 gate review)', () => {
  it('names a move by its spelled interval', () => {
    const insight = chordInsight(
      key('C major'),
      parseChordSymbol('F#')!,
      parseChordSymbol('C')!,
    )
    expect(insight.moves).toBe(
      'Moves: G down a semitone to F♯, C down a diminished 3rd to A♯, E down a minor 3rd to C♯.',
    )
  })
})
