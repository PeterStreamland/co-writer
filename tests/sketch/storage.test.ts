import { describe, expect, it } from 'vitest'
import { EMPTY_PROGRESSION, addAfter } from '../../src/sketch/progression'
import { loadProgression, saveProgression } from '../../src/sketch/storage'
import { parseChordSymbol, parseNote, typeMelody, dur } from '../../src/theory'

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
      melodyRange: {
        preset: 'custom',
        low: parseNote('D3')!,
        high: parseNote('E5')!,
      },
    }
    saveProgression(p, store)
    expect(loadProgression(store)).toEqual(p)
    store.setItem(
      'co-writer:progression',
      JSON.stringify({ ...p, melody: [{ note: { letter: 'E' } }] }),
    )
    expect(loadProgression(store)).toEqual(EMPTY_PROGRESSION)
  })

  it('keeps the harmonies playing with the melody', () => {
    const store = memoryStore()
    const p = {
      ...addAfter(EMPTY_PROGRESSION, -1, parseChordSymbol('Em')!),
      melody: typeMelody('E4 F♯ G', dur(1, 4)).notes,
      harmonies: ['3rd-above', 'counter'],
    }
    saveProgression(p, store)
    expect(loadProgression(store)).toEqual(p)
    store.setItem(
      'co-writer:progression',
      JSON.stringify({ ...p, harmonies: [3] }),
    )
    expect(loadProgression(store)).toEqual(EMPTY_PROGRESSION)
  })

  it('keeps your own notes in the harmonies', () => {
    const store = memoryStore()
    const melody = typeMelody('E4 F♯ G', dur(1, 4)).notes
    const p = {
      ...addAfter(EMPTY_PROGRESSION, -1, parseChordSymbol('Em')!),
      melody,
      harmonies: ['3rd-above'],
      harmonyEdits: {
        '3rd-above': [
          {
            at: melody[1].onset,
            under: melody[1].note,
            note: parseNote('D5')!,
          },
          { at: melody[2].onset, under: melody[2].note },
        ],
      },
    }
    saveProgression(p, store)
    expect(loadProgression(store)).toEqual(p)
    store.setItem(
      'co-writer:progression',
      JSON.stringify({ ...p, harmonyEdits: { '3rd-above': [{ at: 1 }] } }),
    )
    expect(loadProgression(store)).toEqual(EMPTY_PROGRESSION)
  })

  it('keeps the counterpoint lines and your notes in them', () => {
    const store = memoryStore()
    const melody = typeMelody('E4 F♯ G', dur(1, 4)).notes
    const p = {
      ...addAfter(EMPTY_PROGRESSION, -1, parseChordSymbol('Em')!),
      melody,
      counterpoints: ['2-below-strict', '5-above-freer'],
      counterpointEdits: {
        '2-below-strict': [
          {
            at: melody[1].onset,
            under: melody[1].note,
            note: parseNote('D3')!,
          },
        ],
      },
    }
    saveProgression(p, store)
    expect(loadProgression(store)).toEqual(p)
    store.setItem(
      'co-writer:progression',
      JSON.stringify({ ...p, counterpoints: [2] }),
    )
    expect(loadProgression(store)).toEqual(EMPTY_PROGRESSION)
  })
})
