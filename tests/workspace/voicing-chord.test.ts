import { describe, expect, it } from 'vitest'
import { chordSymbol, parseChordSymbol, parseNote } from '../../src/theory'
import { chordWithBass } from '../../src/workspace/voicing-chord'

const notes = (text: string) =>
  text.split(' ').map((t) => (t === 'x' ? null : parseNote(t)!))

describe('chordWithBass', () => {
  it.each([
    ['C', 'C3 E3 G3', 'C'],
    ['C', 'E3 G3 C4', 'C/E'],
    ['C', 'x G2 C3 E3', 'C/G'],
    ['C', 'x C3 E3 G3 C4 E4', 'C'],
    ['G7', 'F3 G3 B3 D4', 'G7/F'],
    ['Ab', 'C3 Eb3 Ab3', 'A♭/C'],
    ['C/E', 'C3 E3 G3', 'C'],
  ])('%s voiced %s is %s', (chord, voiced, expected) => {
    const result = chordWithBass(parseChordSymbol(chord)!, notes(voiced))
    expect(chordSymbol(result)).toBe(expected)
  })
})
