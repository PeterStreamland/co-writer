import { describe, expect, it } from 'vitest'
import {
  DEFAULT_LENSES,
  addLensVoicings,
  lensSteps,
  loadLenses,
  saveLenses,
  toggleLens,
} from '../../src/workspace/lens-columns'
import {
  EMPTY_PROGRESSION,
  addAfter,
  pathNodes,
  setLengthAt,
  switchAt,
} from '../../src/sketch/progression'
import {
  chordSymbol,
  formatNote,
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

  it('lets every lens be turned off', () => {
    expect(toggleLens(['classical', 'rock'], 'rock')).toEqual(['classical'])
    expect(toggleLens(['classical'], 'classical')).toEqual([])
  })

  it('allows no more than four', () => {
    const four = ['classical', 'rock', 'open', 'jazz'] as const
    expect(toggleLens([...four], 'quartal')).toEqual([...four])
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
    store.setItem('co-writer:lenses', JSON.stringify([]))
    expect(loadLenses(store)).toEqual([])
    store.setItem('co-writer:lenses', JSON.stringify(['rock']))
    expect(loadLenses(store)).toEqual(['rock'])
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

describe('putting a lens into the progression', () => {
  const voiced = (symbol: string, notes: string) => ({
    chord: chord(symbol),
    notes: notes.split(' ').map((n) => parseNote(n)!),
    form: 'test',
    label: 'test',
    cost: 0,
  })
  const symbols = (p: Parameters<typeof lensSteps>[0]) =>
    lensSteps(p, C).map((s) => chordSymbol(s.chord, { ascii: true }))

  function start() {
    let p = addAfter(EMPTY_PROGRESSION, -1, chord('C'))
    p = addAfter(p, 0, chord('E7'), { keyChange: A_MINOR })
    p = addAfter(p, 1, chord('Am'))
    return setLengthAt(p, 2, { n: 1, d: 2 })
  }
  const lens = [
    voiced('Cadd9', 'C3 E3 G3 D4'),
    voiced('E7b9', 'E3 G#3 D4 F4'),
    voiced('Amadd9', 'A2 C4 E4 B4'),
  ]

  it('makes a new branch, keeping the old one, lengths and key changes', () => {
    const { progression: p, select } = addLensVoicings(
      start(),
      C,
      lens,
      'keyboard',
      'branch',
    )
    expect(symbols(p)).toEqual(['Cadd9', 'E7b9', 'Amadd9'])
    expect(select).toBe(2)
    const nodes = pathNodes(p)
    expect(nodes[1].keyChange).toEqual(A_MINOR)
    expect(nodes[2].length).toEqual({ n: 1, d: 2 })
    expect(nodes[0].voicing?.notes.map((n) => formatNote(n))).toEqual([
      'C3',
      'E3',
      'G3',
      'D4',
    ])
    expect(symbols(switchAt(p, 0, -1))).toEqual(['C', 'E7', 'Am'])
  })

  it('adds the lens chords after the last, back in the starting key', () => {
    const { progression: p, select } = addLensVoicings(
      start(),
      C,
      lens,
      'keyboard',
      'end',
    )
    expect(symbols(p)).toEqual(['C', 'E7', 'Am', 'Cadd9', 'E7b9', 'Amadd9'])
    expect(select).toBe(5)
    const steps = lensSteps(p, C)
    expect(steps.map((s) => keyName(s.key))).toEqual([
      'C major',
      'C major',
      'A minor',
      'C major',
      'C major',
      'A minor',
    ])
  })

  it('keeps guitar frets', () => {
    const shaped = [
      { ...voiced('C', 'C3 E3 G3 C4 E4'), frets: [null, 3, 2, 0, 1, 0] },
    ]
    const { progression: p } = addLensVoicings(
      addAfter(EMPTY_PROGRESSION, -1, chord('C')),
      C,
      shaped,
      'guitar',
      'end',
    )
    expect(pathNodes(p)[1].voicing).toMatchObject({
      instrument: 'guitar',
      frets: [null, 3, 2, 0, 1, 0],
    })
    expect(pathNodes(p)[1].keyChange).toBeUndefined()
  })
})
