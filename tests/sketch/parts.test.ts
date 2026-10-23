import { describe, expect, it } from 'vitest'
import {
  EMPTY_PROGRESSION,
  addAfter,
  changeAt,
  isProgression,
  pathNodes,
  switchAt,
  type Progression,
} from '../../src/sketch/progression'
import {
  addCell,
  addPart,
  clearCell,
  recipeAt,
  partsShown,
  removePart,
  setPartMuted,
  type PartRecipe,
} from '../../src/sketch/parts'
import { record, redo, startHistory, undo } from '../../src/sketch/history'
import { parseChordSymbol } from '../../src/theory'

function build(...symbols: string[]): Progression {
  let p = EMPTY_PROGRESSION
  for (const s of symbols) {
    p = addAfter(p, p.activePath.length - 1, parseChordSymbol(s)!)
  }
  return p
}

const WALKING: PartRecipe = { kind: 'line', mode: 'walking', roll: 0 }
const ARPEGGIOS: PartRecipe = {
  kind: 'arpeggio',
  settings: {
    choice: 'seventh',
    pattern: 'up',
    rate: '8ths',
    octaves: 2,
    guitar: 'position',
  },
}

describe('rows under the progression', () => {
  it('adds, mutes and removes rows, anchored to the last chord', () => {
    let p = addPart(build('C', 'Am', 'F', 'G'), WALKING)
    p = addPart(p, ARPEGGIOS)
    expect(partsShown(p).map((r) => r.id)).toEqual(['r1', 'r2'])
    expect(partsShown(p)[0].anchor).toBe(p.activePath.at(-1))
    p = setPartMuted(p, 'r1', true)
    expect(partsShown(p)[0].muted).toBe(true)
    p = setPartMuted(p, 'r1', false)
    expect(partsShown(p)[0].muted).toBeUndefined()
    p = removePart(p, 'r1')
    expect(partsShown(p).map((r) => r.id)).toEqual(['r2'])
  })

  it('adds nothing without chords', () => {
    expect(addPart(EMPTY_PROGRESSION, WALKING)).toBe(EMPTY_PROGRESSION)
  })

  it('keeps rows through changes to the chords', () => {
    let p = addPart(build('C', 'Am', 'F'), WALKING)
    p = changeAt(p, 1, parseChordSymbol('Em')!)
    p = addAfter(p, 2, parseChordSymbol('G')!)
    expect(partsShown(p)).toHaveLength(1)
  })

  it('goes with the branch it was made on', () => {
    // C Am F, with Dm as an alternative to Am that has its own continuation.
    let p = build('C', 'Am', 'F')
    p = addAfter(p, 0, parseChordSymbol('Dm')!) // C Dm (Am F on the other branch)
    p = addAfter(p, 1, parseChordSymbol('G')!) // C Dm G
    p = addPart(p, WALKING)
    expect(partsShown(p)).toHaveLength(1)
    const other = switchAt(p, 1, 1)
    expect(pathNodes(other).map((n) => n.chord.root.letter)).not.toEqual(
      pathNodes(p).map((n) => n.chord.root.letter),
    )
    expect(partsShown(other)).toHaveLength(0)
    expect(partsShown(switchAt(other, 1, -1))).toHaveLength(1)
  })

  it('undoes and redoes adding a row', () => {
    const p = build('C', 'G')
    let h = record(startHistory(p), addPart(p, WALKING))
    expect(partsShown(h.present)).toHaveLength(1)
    h = undo(h)
    expect(partsShown(h.present)).toHaveLength(0)
    h = redo(h)
    expect(partsShown(h.present)).toHaveLength(1)
  })

  it('saves and reads back rows, rejecting broken ones', () => {
    const p = addPart(addPart(build('C', 'G'), WALKING), ARPEGGIOS)
    const saved = JSON.parse(JSON.stringify(p))
    expect(isProgression(saved)).toBe(true)
    expect(
      isProgression({
        ...saved,
        parts: [{ id: 'r9', anchor: 'n99', recipe: WALKING }],
      }),
    ).toBe(false)
    expect(
      isProgression({
        ...saved,
        parts: [{ id: 'r9', anchor: 'n1', recipe: { kind: 'drums' } }],
      }),
    ).toBe(false)
  })
})

describe('bars added one at a time', () => {
  it('go into the latest row of their kind, or start one', () => {
    const p = build('C', 'Am', 'F')
    const [n1, n2] = p.activePath
    let q = addCell(p, n1, WALKING)
    expect(partsShown(q)).toHaveLength(1)
    expect(partsShown(q)[0].kind).toBe('line')
    q = addCell(q, n2, { kind: 'line', mode: 'chromatic', roll: 0 })
    expect(partsShown(q)).toHaveLength(1)
    q = addCell(q, n2, ARPEGGIOS)
    expect(partsShown(q).map((r) => r.kind)).toEqual(['line', 'arpeggio'])
    const [lines] = partsShown(q)
    expect(recipeAt(lines, n1)).toEqual(WALKING)
    expect(recipeAt(lines, n2)).toMatchObject({ mode: 'chromatic' })
    expect(recipeAt(lines, p.activePath[2])).toBeUndefined()
  })

  it('override a whole row, and can be left silent', () => {
    const p = addPart(build('C', 'Am'), WALKING)
    const [n1, n2] = p.activePath
    let q = addCell(p, n2, { kind: 'line', mode: 'roots', roll: 0 })
    const id = partsShown(q)[0].id
    expect(recipeAt(partsShown(q)[0], n1)).toEqual(WALKING)
    expect(recipeAt(partsShown(q)[0], n2)).toMatchObject({ mode: 'roots' })
    q = clearCell(q, id, n2)
    expect(recipeAt(partsShown(q)[0], n2)).toBeUndefined()
  })

  it('save and read back, and rows saved before bars still load', () => {
    const p = build('C', 'Am')
    const q = addCell(p, p.activePath[0], ARPEGGIOS)
    expect(isProgression(JSON.parse(JSON.stringify(q)))).toBe(true)
    const old = {
      ...p,
      parts: [{ id: 'r1', anchor: p.activePath[1], recipe: WALKING }],
    }
    expect(isProgression(old)).toBe(true)
    expect(partsShown(old)[0].kind).toBeUndefined()
    expect(
      isProgression({ ...p, parts: [{ id: 'r1', anchor: p.activePath[1] }] }),
    ).toBe(false)
  })
})

describe('edited bars in rows (David’s request)', () => {
  const bar = [
    { note: { letter: 'C', accidental: 0, octave: 3 }, at: { n: 0, d: 1 } },
    { note: { letter: 'D', accidental: 0, octave: 3 }, at: { n: 1, d: 2 } },
  ] as const
  const edited: PartRecipe = {
    kind: 'line',
    mode: 'walking',
    roll: 0,
    density: 'split',
    notes: bar.map((b) => ({ note: { ...b.note }, at: { ...b.at } })),
  }

  it('adds a row with bars of its own', () => {
    const p = build('C', 'Am')
    const q = addPart(
      p,
      { ...WALKING, density: 'beats' },
      {
        [p.activePath[1]]: edited,
      },
    )
    const [row] = partsShown(q)
    expect(recipeAt(row, p.activePath[0])).toMatchObject({ density: 'beats' })
    expect(recipeAt(row, p.activePath[1])).toEqual(edited)
    expect(addPart(p, WALKING, {}).parts![0].cells).toBeUndefined()
  })

  it('saves and reads back densities and notes, rejecting broken ones', () => {
    const p = build('C', 'Am')
    const q = addCell(p, p.activePath[0], edited)
    expect(isProgression(JSON.parse(JSON.stringify(q)))).toBe(true)
    const broken = (recipe: unknown) =>
      isProgression({
        ...p,
        parts: [{ id: 'r1', anchor: p.activePath[1], recipe }],
      })
    expect(broken({ ...WALKING, density: 'lots' })).toBe(false)
    expect(broken({ ...WALKING, count: 17 })).toBe(false)
    expect(broken({ ...WALKING, count: 0 })).toBe(false)
    expect(broken({ ...WALKING, seed: 1.5 })).toBe(false)
    expect(broken({ ...WALKING, count: 16, seed: 3 })).toBe(true)
    expect(broken({ ...WALKING, notes: [] })).toBe(false)
    expect(
      broken({
        ...WALKING,
        notes: [{ note: { letter: 'H' }, at: { n: 0, d: 1 } }],
      }),
    ).toBe(false)
    expect(
      broken({
        ...WALKING,
        notes: [{ note: { letter: 'C', accidental: 0 }, at: { n: 0, d: 1 } }],
      }),
    ).toBe(false)
    expect(
      broken({
        ...WALKING,
        notes: [{ ...edited.notes![0], at: { n: -1, d: 4 } }],
      }),
    ).toBe(false)
  })
})
