import { describe, expect, it } from 'vitest'
import {
  EMPTY_PROGRESSION,
  addAfter,
  setKeyChangeAt,
  setLengthAt,
  timingOf,
} from '../../src/sketch/progression'
import {
  formatNote,
  lineFor,
  parseChordSymbol,
  parseNote,
  type Key,
} from '../../src/theory'
import {
  DEFAULT_LINE_MODE,
  labelNumber,
  lineSteps,
  loadLineMode,
  saveLineMode,
} from '../../src/workspace/lines-view'

const C: Key = { tonic: parseNote('C')!, mode: 'major' }
const A_MINOR: Key = { tonic: parseNote('A')!, mode: 'natural-minor' }

function memoryStore(): Storage {
  const items = new Map<string, string>()
  return {
    get length() {
      return items.size
    },
    clear: () => items.clear(),
    getItem: (k) => items.get(k) ?? null,
    key: (i) => [...items.keys()][i] ?? null,
    removeItem: (k) => void items.delete(k),
    setItem: (k, v) => void items.set(k, v),
  }
}

describe('the Lines tab', () => {
  it('reads each chord in its key, where it falls in the bars', () => {
    let p = EMPTY_PROGRESSION
    for (const s of ['C', 'E7', 'Am']) {
      p = addAfter(p, p.activePath.length - 1, parseChordSymbol(s)!)
    }
    p = setKeyChangeAt(p, 1, A_MINOR) // from E7 on: Am is in A minor
    p = setLengthAt(p, 0, { n: 1, d: 2 })
    const time = { meter: { num: 4, den: 4 } }
    const steps = lineSteps(p, C, timingOf(p, time))
    expect(steps.map((s) => s.key.mode)).toEqual([
      'major',
      'major',
      'natural-minor',
    ])
    expect(steps.map((s) => s.placed.bar)).toEqual([1, 1, 2])
    // The walking bass reaches the E7 on beat 3 of bar 1.
    const walk = lineFor('walking', steps).notes.filter((n) => n.step === 1)
    expect(formatNote({ ...walk[0].note, octave: undefined })).toBe('E')
  })

  it('numbers tones for colouring', () => {
    expect(labelNumber('R', true)).toBe(1)
    expect(labelNumber('♭7', true)).toBe(7)
    expect(labelNumber('3', true)).toBe(3)
    expect(labelNumber('♯4', false)).toBe(99)
  })

  it('remembers the mode, and ignores unknown ones', () => {
    const store = memoryStore()
    expect(loadLineMode(store)).toBe(DEFAULT_LINE_MODE)
    saveLineMode('enclosure', store)
    expect(loadLineMode(store)).toBe('enclosure')
    store.setItem('co-writer:line-mode', 'sideways')
    expect(loadLineMode(store)).toBe(DEFAULT_LINE_MODE)
  })
})
