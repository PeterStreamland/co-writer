import { describe, expect, it } from 'vitest'
import {
  EMPTY_PROGRESSION,
  addAfter,
  changeAt,
  setKeyChangeAt,
  setLengthAt,
  timingOf,
} from '../../src/sketch/progression'
import {
  dur,
  formatNote,
  lineFor,
  parseChordSymbol,
  parseNote,
  swapNote,
  type Key,
} from '../../src/theory'
import { pathNodes } from '../../src/sketch/progression'
import {
  DEFAULT_LINE_MODE,
  densityStep,
  editKey,
  editedLine,
  labelNumber,
  lineRecipe,
  lineSteps,
  loadLineDensity,
  loadLineMode,
  saveLineDensity,
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

describe('editing a line (David’s request)', () => {
  let p = EMPTY_PROGRESSION
  for (const s of ['C', 'Am', 'F', 'G']) {
    p = addAfter(p, p.activePath.length - 1, parseChordSymbol(s)!)
  }
  const time = { meter: { num: 4, den: 4 } }
  const steps = lineSteps(p, C, timingOf(p, time))
  const nodes = pathNodes(p).map((n) => n.id)
  const inBar = (notes: { step: number }[], s: number) =>
    notes.filter((n) => n.step === s).length

  it('plays as many notes a bar as the line and each bar ask', () => {
    expect(inBar(editedLine(steps, nodes, 'roots', 0, undefined, {}), 0)).toBe(
      1,
    )
    const eighths = editedLine(steps, nodes, 'roots', 0, 'split', {})
    expect(inBar(eighths, 0)).toBe(8)
    const one = editedLine(steps, nodes, 'roots', 0, 'split', {
      [nodes[1]]: { density: 'held' },
    })
    expect(inBar(one, 0)).toBe(8)
    expect(inBar(one, 1)).toBe(1)
  })

  it('steps a bar to fewer or more notes, and stops at the ends', () => {
    expect(densityStep(steps[0], 4, 1)).toBe('split')
    expect(densityStep(steps[0], 4, -1)).toBe('strong')
    expect(densityStep(steps[0], 1, -1)).toBeUndefined()
    expect(densityStep(steps[0], 8, 1)).toBeUndefined()
    // A walking bar of four goes to two, a held root to two.
    expect(densityStep(steps[0], 1, 1)).toBe('strong')
  })

  it('keeps an edited bar’s notes when its chord changes', () => {
    const walk = editedLine(steps, nodes, 'walking', 0, undefined, {})
    const bar = swapNote(walk, 1, steps, parseNote('D3')!)
    const edits = { [nodes[0]]: { notes: bar } }
    const changed = changeAt(p, 0, parseChordSymbol('C7')!)
    const after = editedLine(
      lineSteps(changed, C, timingOf(changed, time)),
      nodes,
      'walking',
      0,
      undefined,
      edits,
    )
    expect(
      after.filter((n) => n.step === 0).map((n) => formatNote(n.note)),
    ).toEqual(bar.map((b) => formatNote(b.note)))
  })

  it('keeps each line’s edits apart, the Wildcard by roll', () => {
    expect(editKey('walking', 3)).toBe('walking 0')
    expect(editKey('wildcard', 3)).toBe('wildcard 3')
  })

  it('makes a row’s recipe, leaving out what isn’t set', () => {
    expect(lineRecipe('walking', 2)).toEqual({
      kind: 'line',
      mode: 'walking',
      roll: 0,
    })
    const bar = [{ note: parseNote('C3')!, at: dur(0, 1) }]
    expect(lineRecipe('wildcard', 2, 'beats', bar)).toEqual({
      kind: 'line',
      mode: 'wildcard',
      roll: 2,
      density: 'beats',
      notes: bar,
    })
  })

  it('remembers how many notes a bar', () => {
    const store = memoryStore()
    expect(loadLineDensity(store)).toBeUndefined()
    saveLineDensity('split', store)
    expect(loadLineDensity(store)).toBe('split')
    saveLineDensity(undefined, store)
    expect(loadLineDensity(store)).toBeUndefined()
    store.setItem('co-writer:line-density', 'lots')
    expect(loadLineDensity(store)).toBeUndefined()
  })
})
