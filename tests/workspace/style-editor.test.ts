import { describe, expect, it } from 'vitest'
import {
  BUILT_IN_STYLES,
  NEXT_CHORD_RULES,
  readStyleSet,
} from '../../src/theory'
import {
  editCount,
  editorGroups,
  exportText,
  isEdited,
  loadStyles,
  saveStyles,
  setWeight,
  tapDot,
} from '../../src/workspace/style-editor'

// A stand-in for localStorage.
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

describe('editorGroups', () => {
  it('lists every rule once, grouped in category order', () => {
    const groups = editorGroups()
    expect(groups.map((g) => g.label)).toEqual([
      'Diatonic',
      'Secondary',
      'Borrowed',
      'Chromatic',
      'Modulation',
      'Rock moves',
      'Pedal/static',
    ])
    const ids = groups.flatMap((g) => g.rules.map((r) => r.id))
    expect(ids.sort()).toEqual(NEXT_CHORD_RULES.map((r) => r.id).sort())
  })
})

describe('editing weights', () => {
  it('changes one weight and marks it edited', () => {
    const set = setWeight(BUILT_IN_STYLES, 'metal', 'rock.flat-six', 1)
    expect(set.styles[2].weights['rock.flat-six']).toBe(1)
    expect(isEdited(set, 'metal', 'rock.flat-six')).toBe(true)
    expect(isEdited(set, 'pop', 'rock.flat-six')).toBe(false)
    expect(editCount(set)).toBe(1)
    expect(BUILT_IN_STYLES.styles[2].weights['rock.flat-six']).toBe(5)
  })

  it('clamps to a whole number from 0 to 5', () => {
    const at = (w: number) =>
      setWeight(BUILT_IN_STYLES, 'pop', 'pedal.sus', w).styles[0].weights[
        'pedal.sus'
      ]
    expect(at(9)).toBe(5)
    expect(at(-2)).toBe(0)
    expect(at(2.6)).toBe(3)
  })

  it.each([
    [3, 5, 5],
    [3, 1, 1],
    [3, 3, 2],
    [1, 1, 0],
  ])('weight %s, tapping dot %s, gives %s', (current, dot, result) => {
    expect(tapDot(current, dot)).toBe(result)
  })
})

describe('saving', () => {
  it('saves edits and loads them back', () => {
    const store = memoryStore()
    const set = setWeight(BUILT_IN_STYLES, 'rock', 'pedal.static', 0)
    saveStyles(set, store)
    expect(loadStyles(store)).toEqual(set)
  })

  it('forgets the save once everything is back to built-in', () => {
    const store = memoryStore()
    saveStyles(setWeight(BUILT_IN_STYLES, 'rock', 'pedal.static', 0), store)
    saveStyles(BUILT_IN_STYLES, store)
    expect(store.length).toBe(0)
  })

  it('uses the built-in weights when nothing or junk is saved', () => {
    const store = memoryStore()
    expect(loadStyles(store)).toEqual(BUILT_IN_STYLES)
    store.setItem('co-writer:styles', '{not json')
    expect(loadStyles(store)).toEqual(BUILT_IN_STYLES)
    expect(loadStyles(undefined)).toEqual(BUILT_IN_STYLES)
  })

  it('exports a file that reads back as the same weights', () => {
    const set = setWeight(BUILT_IN_STYLES, 'metal', 'borrowed.phrygian', 3)
    expect(readStyleSet(JSON.parse(exportText(set)))).toEqual(set)
  })
})
