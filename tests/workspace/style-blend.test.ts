import { describe, expect, it } from 'vitest'
import { BUILT_IN_STYLES } from '../../src/theory'
import {
  DEFAULT_BLEND,
  blendLabel,
  loadBlend,
  saveBlend,
} from '../../src/workspace/style-blend'

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

describe('style blend', () => {
  it('saves and loads a blend, snapping the mix', () => {
    const store = memoryStore()
    saveBlend({ a: 'rock', b: 'metal', mix: 0.3 }, store)
    expect(loadBlend(BUILT_IN_STYLES, store)).toEqual({
      a: 'rock',
      b: 'metal',
      mix: 0.25,
    })
  })

  it('starts from pop when nothing usable is saved', () => {
    const store = memoryStore()
    expect(loadBlend(BUILT_IN_STYLES, store)).toEqual(DEFAULT_BLEND)
    store.setItem('co-writer:style-blend', '{"a":"jazz","b":"pop","mix":0}')
    expect(loadBlend(BUILT_IN_STYLES, store)).toEqual(DEFAULT_BLEND)
    expect(loadBlend(BUILT_IN_STYLES, undefined)).toEqual(DEFAULT_BLEND)
  })

  it.each([
    [{ a: 'pop', b: 'rock', mix: 0 }, 'Pop'],
    [{ a: 'pop', b: 'rock', mix: 1 }, 'Rock'],
    [{ a: 'pop', b: 'rock', mix: 0.25 }, '75% Pop, 25% Rock'],
    [{ a: 'rock', b: 'metal', mix: 0.5 }, '50% Rock, 50% Metal'],
    [{ a: 'metal', b: 'metal', mix: 0.5 }, 'Metal'],
  ])('labels %o as %s', (blend, label) => {
    expect(blendLabel(BUILT_IN_STYLES, blend)).toBe(label)
  })
})
