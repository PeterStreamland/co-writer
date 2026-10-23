import { describe, expect, it } from 'vitest'
import { EMPTY_PROGRESSION, addAfter } from '../../src/sketch/progression'
import { loadProgression, saveProgression } from '../../src/sketch/storage'
import { parseChordSymbol, typeMelody, dur } from '../../src/theory'

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

describe('saving the progression', () => {
  it('loads back what was saved', () => {
    const store = memoryStore()
    const p = addAfter(EMPTY_PROGRESSION, -1, parseChordSymbol('Em')!)
    saveProgression(p, store)
    expect(loadProgression(store)).toEqual(p)
  })

  it('starts empty with nothing or junk saved', () => {
    const store = memoryStore()
    expect(loadProgression(store)).toEqual(EMPTY_PROGRESSION)
    store.setItem('co-writer:progression', '{"nodes":5}')
    expect(loadProgression(store)).toEqual(EMPTY_PROGRESSION)
    expect(loadProgression(undefined)).toEqual(EMPTY_PROGRESSION)
  })

  it('keeps the melody, and rejects a broken one', () => {
    const store = memoryStore()
    const p = {
      ...addAfter(EMPTY_PROGRESSION, -1, parseChordSymbol('Em')!),
      melody: typeMelody('E4 F♯ G - B', dur(1, 8)).notes,
    }
    saveProgression(p, store)
    expect(loadProgression(store)).toEqual(p)
    store.setItem(
      'co-writer:progression',
      JSON.stringify({ ...p, melody: [{ note: { letter: 'E' } }] }),
    )
    expect(loadProgression(store)).toEqual(EMPTY_PROGRESSION)
  })
})
