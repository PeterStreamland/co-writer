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
  addPart,
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
