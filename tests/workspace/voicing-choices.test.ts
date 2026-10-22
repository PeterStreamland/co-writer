import { describe, expect, it } from 'vitest'
import { voicingChoices } from '../../src/workspace/voicing-choices'
import { formatNote, parseChordSymbol } from '../../src/theory'

const show = (notes: Parameters<typeof formatNote>[0][]) =>
  notes.map((n) => formatNote(n, { ascii: true })).join(' ')

describe('voicing choices', () => {
  it('offers every style and the split for a 7th chord', () => {
    const choices = voicingChoices(parseChordSymbol('Cmaj7')!)
    expect(choices.map((c) => c.id)).toEqual([
      'close',
      'open',
      'drop-2',
      'drop-3',
      'spread',
      'split',
    ])
    expect(show(choices[2].notes)).toBe('C3 G3 B3 E4')
    const split = choices[5]
    expect(show(split.left!)).toBe('C2')
    expect(show(split.notes)).toBe('C2 C4 E4 G4 B4')
  })

  it('leaves out drops a chord can’t take', () => {
    const ids = voicingChoices(parseChordSymbol('C9')!).map((c) => c.id)
    expect(ids).toEqual(['close', 'open', 'spread', 'split'])
  })
})
