import { describe, expect, it } from 'vitest'
import {
  DEFAULT_FILTERS,
  SPANS,
  fingeringOptions,
  inversionChoices,
  stringSet,
} from '../../src/workspace/shape-filters'
import { parseChordSymbol } from '../../src/theory'

describe('shape filters', () => {
  it('picks string sets on 6 and 7 strings', () => {
    expect(stringSet('all', 6)).toEqual([0, 1, 2, 3, 4, 5])
    expect(stringSet('top4', 6)).toEqual([2, 3, 4, 5])
    expect(stringSet('top3', 6)).toEqual([3, 4, 5])
    expect(stringSet('middle4', 6)).toEqual([1, 2, 3, 4])
    expect(stringSet('bottom4', 6)).toEqual([0, 1, 2, 3])
    expect(stringSet('top4', 7)).toEqual([3, 4, 5, 6])
    expect(stringSet('middle4', 7)).toEqual([2, 3, 4, 5])
    expect(stringSet('bottom4', 7)).toEqual([0, 1, 2, 3])
  })

  it('offers each inversion the chord has', () => {
    const triad = inversionChoices(parseChordSymbol('C')!)
    expect(triad.map(([, label]) => label)).toEqual([
      'As chosen',
      'Any inversion',
      'Root position',
      'First inversion',
      'Second inversion',
    ])
    expect(inversionChoices(parseChordSymbol('G7')!)).toHaveLength(6)
  })

  it('spans 3–6 frets, 4 by default (SPEC 11)', () => {
    expect(SPANS).toEqual([3, 4, 5, 6])
    expect(DEFAULT_FILTERS.maxSpan).toBe(4)
  })

  it('turns the controls into search options', () => {
    expect(fingeringOptions(DEFAULT_FILTERS, 6)).toEqual({
      maxSpan: 4,
      inversion: undefined,
      strings: [0, 1, 2, 3, 4, 5],
      openStrings: true,
      omitFifth: false,
    })
    expect(
      fingeringOptions(
        { ...DEFAULT_FILTERS, inversion: 1, strings: 'top3', omitFifth: true },
        7,
      ),
    ).toMatchObject({ inversion: 1, strings: [4, 5, 6], omitFifth: true })
  })
})
