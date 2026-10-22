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
