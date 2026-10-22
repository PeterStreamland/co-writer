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

describe('piano filters', () => {
  const C = parseChordSymbol('C')!

  it('voices the inversion asked for', () => {
    const first = voicingChoices(C, { inversion: 1, left: 'bass' })
    expect(show(first[0].notes)).toBe('E3 G3 C4')
    // The split puts the inverted bass in the left hand.
    expect(show(first.find((v) => v.id === 'split')!.left!)).toBe('E2')
  })

  it('offers every inversion in turn with any', () => {
    const any = voicingChoices(C, { inversion: 'any', left: 'bass' })
    expect(new Set(any.map((v) => v.inversion))).toEqual(new Set([0, 1, 2]))
    expect(any.filter((v) => v.id === 'close')).toHaveLength(3)
  })

  it('falls back to the chord as chosen for an inversion it lacks', () => {
    const third = voicingChoices(C, { inversion: 3, left: 'bass' })
    expect(show(third[0].notes)).toBe('C4 E4 G4')
  })

  it('sets what the left hand plays under a split', () => {
    const split = (left: 'bass' | 'fifth' | 'octave') =>
      show(voicingChoices(C, { inversion: 'chord', left }).at(-1)!.left!)
    expect(split('bass')).toBe('C2')
    expect(split('fifth')).toBe('C2 G2')
    expect(split('octave')).toBe('C2 C3')
  })
})
