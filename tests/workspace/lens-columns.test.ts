import { describe, expect, it } from 'vitest'
import {
  DEFAULT_LENSES,
  lensSteps,
  loadLenses,
  saveLenses,
  toggleLens,
} from '../../src/workspace/lens-columns'
import {
  EMPTY_PROGRESSION,
  addAfter,
  setLengthAt,
} from '../../src/sketch/progression'
import {
  keyName,
  parseChordSymbol,
  parseNote,
  type Key,
} from '../../src/theory'

const C: Key = { tonic: parseNote('C')!, mode: 'major' }
const A_MINOR: Key = { tonic: parseNote('A')!, mode: 'natural-minor' }
const chord = (s: string) => parseChordSymbol(s)!

function memory(): Storage {
  const data = new Map<string, string>()
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
  } as Storage
}

describe('choosing lenses', () => {
  it('starts with Classical and Rock', () => {
    expect(DEFAULT_LENSES).toEqual(['classical', 'rock'])
    expect(loadLenses(memory())).toEqual(DEFAULT_LENSES)
  })

  it('turns lenses on and off, keeping their order', () => {
    expect(toggleLens(['rock', 'classical'], 'jazz')).toEqual([
      'classical',
      'rock',
      'jazz',
    ])
    expect(toggleLens(['classical', 'rock', 'jazz'], 'rock')).toEqual([
      'classical',
      'jazz',
    ])
  })

  it('keeps at least two lenses', () => {
    expect(toggleLens(['classical', 'rock'], 'rock')).toEqual([
      'classical',
      'rock',
    ])
  })

  it('allows all four', () => {
    expect(toggleLens(['classical', 'rock', 'open'], 'jazz')).toEqual([
      'classical',
      'rock',
      'open',
      'jazz',
    ])
  })

  it('remembers the choice, ignoring anything unusable', () => {
    const store = memory()
    saveLenses(['open', 'jazz'], store)
    expect(loadLenses(store)).toEqual(['open', 'jazz'])
    store.setItem('co-writer:lenses', JSON.stringify(['rock']))
    expect(loadLenses(store)).toEqual(DEFAULT_LENSES)
    store.setItem('co-writer:lenses', JSON.stringify(['rock', 'polka']))
    expect(loadLenses(store)).toEqual(DEFAULT_LENSES)
  })
})

describe('the progression as lens steps', () => {
  it('reads each chord in its key, with its length', () => {
    let p = addAfter(EMPTY_PROGRESSION, -1, chord('C'))
    p = addAfter(p, 0, chord('E7'), { keyChange: A_MINOR })
    p = addAfter(p, 1, chord('Am'))
    p = setLengthAt(p, 2, { n: 1, d: 2 })
    const steps = lensSteps(p, C)
    expect(steps.map((s) => keyName(s.key))).toEqual([
      'C major',
      'C major',
      'A minor',
    ])
    expect(steps.map((s) => s.length)).toEqual([
      { n: 1, d: 1 },
      { n: 1, d: 1 },
      { n: 1, d: 2 },
    ])
  })
})
