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
  const line = (
    mode: Parameters<typeof editedLine>[2],
    density?: Parameters<typeof editedLine>[4],
    bars: Parameters<typeof editedLine>[5] = {},
    edits: Parameters<typeof editedLine>[6] = {},
  ) => editedLine(steps, nodes, mode, 0, density, bars, edits)

  it('plays as many notes a bar as the line asks', () => {
    expect(inBar(line('roots'), 0)).toBe(1)
    expect(inBar(line('roots', 'split'), 0)).toBe(8)
  })

  it('gives any bar from one to sixteen notes, whatever the line', () => {
    for (const mode of [
      'roots',
      'walking',
      'scale-steps',
      'guide-3rd',
    ] as const) {
      for (let count = 1; count <= 16; count++) {
        const notes = line(mode, undefined, { [nodes[1]]: { count } })
        expect(inBar(notes, 1)).toBe(count)
        expect(inBar(notes, 0)).toBe(inBar(line(mode), 0))
      }
    }
  })

  it('moves rather than repeats when a walk has more notes', () => {
    const notes = line('walking', undefined, { [nodes[0]]: { count: 8 } })
    const bar = notes.filter((n) => n.step === 0)
    const repeats = bar.filter((n, k) => k > 0 && n.midi === bar[k - 1].midi)
    expect(repeats.length).toBeLessThanOrEqual(1)
  })

  it('refreshes a bar into a new take, the same for the same refresh', () => {
    const plain = line('walking').filter((n) => n.step === 0)
    const takes = [1, 2, 3, 4, 5].map((roll) =>
      line('walking', undefined, { [nodes[0]]: { count: 4, roll } })
        .filter((n) => n.step === 0)
        .map((n) => `${n.midi}@${n.onset.n}/${n.onset.d}`)
        .join(' '),
    )
    expect(new Set(takes).size).toBeGreaterThan(2)
    const again = line('walking', undefined, {
      [nodes[0]]: { count: 4, roll: 3 },
    })
      .filter((n) => n.step === 0)
      .map((n) => `${n.midi}@${n.onset.n}/${n.onset.d}`)
      .join(' ')
    expect(again).toBe(takes[2])
    // Still four notes, starting on the chord's first note.
    const take = line('walking', undefined, {
      [nodes[0]]: { count: 4, roll: 2 },
    })
    expect(inBar(take, 0)).toBe(4)
    expect(take[0].midi).toBe(plain[0].midi)
  })

  it('keeps an edited bar’s notes when its chord changes', () => {
    const walk = line('walking')
    const bar = swapNote(walk, 1, steps, parseNote('D3')!)
    const edits = { [nodes[0]]: { notes: bar } }
    const changed = changeAt(p, 0, parseChordSymbol('C7')!)
    const after = editedLine(
      lineSteps(changed, C, timingOf(changed, time)),
      nodes,
      'walking',
      0,
      undefined,
      {},
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
    expect(
      lineRecipe('wildcard', 2, 'beats', { count: 6, roll: 2 }, bar),
    ).toEqual({
      kind: 'line',
      mode: 'wildcard',
      roll: 2,
      density: 'beats',
      count: 6,
      seed: 2,
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
