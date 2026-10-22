import { describe, expect, it } from 'vitest'
import {
  EMPTY_PROGRESSION,
  addAfter,
  addAllAfter,
  alternatives,
  changeAt,
  chordsUpTo,
  isProgression,
  insertAllBetween,
  insertBetween,
  lengthOf,
  setLengthAt,
  isShared,
  keyAfter,
  keyAt,
  pathNodes,
  selectNode,
  switchAt,
  type Progression,
} from '../../src/sketch/progression'
import { record, redo, startHistory, undo } from '../../src/sketch/history'
import {
  chordSymbol,
  parseChordSymbol,
  parseNote,
  type ChordName,
  type Key,
} from '../../src/theory'

function parse(text: string): ChordName {
  const chord = parseChordSymbol(text)
  if (!chord) throw new Error(`${text} did not parse`)
  return chord
}

const C_MAJOR: Key = { tonic: parseNote('C')!, mode: 'major' }
const G_MAJOR: Key = { tonic: parseNote('G')!, mode: 'major' }

// The strip as text: "C F G".
function strip(p: Progression): string {
  return pathNodes(p)
    .map((n) => chordSymbol(n.chord, { ascii: true }))
    .join(' ')
}

function build(...chords: string[]): Progression {
  return chords.reduce(
    (p, c) => addAfter(p, p.activePath.length - 1, parse(c)),
    EMPTY_PROGRESSION,
  )
}

describe('adding chords', () => {
  it('extends the path after the last chord', () => {
    const p = build('C', 'F', 'G')
    expect(strip(p)).toBe('C F G')
    expect(p.roots).toHaveLength(1)
    expect(chordsUpTo(p, 1).map((c) => chordSymbol(c))).toEqual(['C', 'F'])
  })

  it('adds an alternative mid-strip that shares what follows', () => {
    const p = addAfter(build('C', 'F', 'G'), 0, parse('Am'))
    expect(strip(p)).toBe('C Am G')
    expect(alternatives(p, 1)).toHaveLength(2)
    expect(isShared(p, 2)).toBe(true)
  })

  it('adds an alternative first chord', () => {
    const p = addAfter(build('C', 'F'), -1, parse('Am'))
    expect(strip(p)).toBe('Am F')
    expect(p.roots).toHaveLength(2)
  })

  it('leaves the old progression alone', () => {
    const before = build('C', 'F')
    addAfter(before, 1, parse('G'))
    expect(strip(before)).toBe('C F')
  })
})

describe('adding typed chords', () => {
  const chords = (...symbols: string[]) => symbols.map(parse)

  it('fills an empty strip in order', () => {
    const p = addAllAfter(EMPTY_PROGRESSION, -1, chords('Em', 'C', 'G', 'D'))
    expect(strip(p)).toBe('Em C G D')
  })

  it('extends the progression after the last chord', () => {
    const p = addAllAfter(build('C', 'Am'), 1, chords('F', 'G'))
    expect(strip(p)).toBe('C Am F G')
  })

  it('branches mid-strip, keeping the old chords as alternatives', () => {
    const p = addAllAfter(build('C', 'G', 'Em', 'D'), 1, chords('Am', 'F'))
    expect(strip(p)).toBe('C G Am F')
    expect(strip(switchAt(p, 2, -1))).toBe('C G Em D')
  })

  it('makes a whole new branch from the start, keeping the old one', () => {
    const p = addAllAfter(
      build('C', 'Am', 'F'),
      -1,
      chords('Cadd9', 'Am7', 'Fmaj7'),
      [
        {},
        { length: { n: 1, d: 2 } },
        { voicing: { instrument: 'keyboard', notes: [parseNote('F3')!] } },
      ],
    )
    expect(strip(p)).toBe('Cadd9 Am7 Fmaj7')
    expect(pathNodes(p)[1].length).toEqual({ n: 1, d: 2 })
    expect(pathNodes(p)[2].voicing?.notes).toHaveLength(1)
    expect(strip(switchAt(p, 0, -1))).toBe('C Am F')
  })

  it('inserts several chords between two others', () => {
    const p = insertAllBetween(build('C', 'G'), 0, chords('Am', 'Dm'))
    expect(strip(p)).toBe('C Am Dm G')
  })
})

describe('switching alternatives (SPEC 13)', () => {
  it('keeps the chords that follow when the alternative has none of its own', () => {
    let p = addAfter(build('C', 'F', 'G', 'C'), 0, parse('Am'))
    expect(strip(p)).toBe('C Am G C')
    p = switchAt(p, 1, 1)
    expect(strip(p)).toBe('C F G C')
    p = switchAt(p, 1, -1)
    expect(strip(p)).toBe('C Am G C')
  })

  it('shows the alternative’s own continuation when it has one', () => {
    let p = addAfter(build('C', 'F', 'G'), 0, parse('Am'))
    // Adding after the shared G gives Am its own G and Em.
    p = addAfter(p, 2, parse('Em'))
    expect(strip(p)).toBe('C Am G Em')
    expect(isShared(p, 2)).toBe(false)
    p = switchAt(p, 1, 1)
    expect(strip(p)).toBe('C F G')
    p = switchAt(p, 1, 1)
    expect(strip(p)).toBe('C Am G Em')
  })

  it('changing a shared chord gives the alternative its own copy', () => {
    let p = addAfter(build('C', 'F', 'G'), 0, parse('Am'))
    p = changeAt(p, 2, parse('E7'))
    expect(strip(p)).toBe('C Am E7')
    expect(strip(switchAt(p, 1, 1))).toBe('C F G')
  })

  it('returns to the branch that was showing', () => {
    // F has two continuations, G and E7; E7 was showing when Dm was tried.
    let p = addAfter(build('C', 'F', 'G'), 1, parse('E7'))
    expect(strip(p)).toBe('C F E7')
    p = addAfter(p, 0, parse('Dm'))
    expect(strip(p)).toBe('C Dm E7')
    expect(strip(switchAt(p, 1, -1))).toBe('C F E7')
  })
})

describe('the tree view', () => {
  it('makes the path through a node active', () => {
    let p = addAfter(build('C', 'F', 'G'), 0, parse('Am'))
    p = addAfter(p, 2, parse('Em'))
    const g = Object.values(p.nodes).find(
      (n) => chordSymbol(n.chord) === 'G' && n.children.length === 0,
    )!
    expect(strip(selectNode(p, g.id))).toBe('C F G')
  })
})

describe('key changes (SPEC 6.4)', () => {
  it('reads chords after a pivot in the new key', () => {
    let p = build('C', 'F')
    p = addAfter(p, 1, parse('Am'), { keyChange: G_MAJOR })
    p = addAfter(p, 2, parse('D'))
    expect(keyAt(p, 2, C_MAJOR)).toEqual(C_MAJOR)
    expect(keyAt(p, 3, C_MAJOR)).toEqual(G_MAJOR)
    expect(keyAfter(p, 1, C_MAJOR)).toEqual(C_MAJOR)
    expect(keyAfter(p, 2, C_MAJOR)).toEqual(G_MAJOR)
  })
})

describe('answering No to a key change (SPEC 13)', () => {
  it('keeps later chords in the old key', () => {
    let p = build('C', 'F')
    p = addAfter(p, 1, parse('Am')) // the pivot, without a key change
    p = addAfter(p, 2, parse('D'))
    expect(keyAt(p, 3, C_MAJOR)).toEqual(C_MAJOR)
    expect(keyAfter(p, 3, C_MAJOR)).toEqual(C_MAJOR)
  })
})

describe('undo and redo (SPEC 13)', () => {
  it('undoes across a branch switch', () => {
    let h = startHistory(addAfter(build('C', 'F', 'G'), 0, parse('Am')))
    h = record(h, switchAt(h.present, 1, 1))
    expect(strip(h.present)).toBe('C F G')
    h = record(h, addAfter(h.present, 2, parse('C')))
    h = undo(h)
    expect(strip(h.present)).toBe('C F G')
    h = undo(h)
    expect(strip(h.present)).toBe('C Am G')
    h = redo(redo(h))
    expect(strip(h.present)).toBe('C F G C')
  })

  it('clears redo on a new change and ignores no-ops', () => {
    let h = startHistory(build('C'))
    h = record(h, build('C', 'G'))
    h = undo(h)
    h = record(h, build('C', 'F'))
    expect(h.future).toEqual([])
    expect(record(h, h.present)).toBe(h)
    expect(undo(startHistory(EMPTY_PROGRESSION)).past).toEqual([])
  })
})

describe('passing chords', () => {
  it('inserts a chord between two others', () => {
    const p = insertBetween(build('C', 'G', 'Am'), 0, parse('D7'))
    expect(strip(p)).toBe('C D7 G Am')
    expect(isShared(p, 2)).toBe(false)
    expect(isShared(p, 3)).toBe(false)
  })

  it('keeps the other alternatives at the next slot', () => {
    let p = addAfter(build('C', 'G'), 0, parse('F')) // C F, G an alternative
    p = insertBetween(p, 0, parse('Dm'))
    expect(strip(p)).toBe('C Dm F')
    // G, with no chords of its own after it, shares Dm's F.
    expect(strip(switchAt(p, 1, -1))).toBe('C G F')
  })

  it('gives a shared chord its own copy before inserting', () => {
    let p = addAfter(build('C', 'F', 'G'), 0, parse('Am')) // C Am G (shared)
    p = insertBetween(p, 1, parse('D7'))
    expect(strip(p)).toBe('C Am D7 G')
    expect(strip(switchAt(p, 1, 1))).toBe('C F G')
  })

  it('keeps every following chord through passing chords within passing chords', () => {
    let p = insertBetween(build('C', 'G', 'Am'), 0, parse('Dm')) // C Dm G Am
    p = insertBetween(p, 1, parse('D7')) // between Dm and G
    expect(strip(p)).toBe('C Dm D7 G Am')
    p = insertBetween(p, 0, parse('Em')) // between C and Dm
    expect(strip(p)).toBe('C Em Dm D7 G Am')
    p = insertBetween(p, 3, parse('Ab7')) // between D7 and G
    expect(strip(p)).toBe('C Em Dm D7 Ab7 G Am')
  })

  it('needs a chord after the slot', () => {
    expect(() => insertBetween(build('C'), 0, parse('G'))).toThrow()
  })
})

describe('chord lengths', () => {
  it('lasts a bar unless set, and drops the default', () => {
    let p = build('C', 'G')
    expect(lengthOf(pathNodes(p)[0])).toEqual({ n: 1, d: 1 })
    p = setLengthAt(p, 0, { n: 1, d: 2 })
    expect(pathNodes(p)[0].length).toEqual({ n: 1, d: 2 })
    p = setLengthAt(p, 0, { n: 1, d: 1 })
    expect(pathNodes(p)[0].length).toBeUndefined()
  })

  it('copies a shared chord before changing its length', () => {
    let p = addAfter(build('C', 'F', 'G'), 0, parse('Am')) // C Am G (shared)
    p = setLengthAt(p, 2, { n: 2, d: 1 })
    expect(lengthOf(pathNodes(p)[2])).toEqual({ n: 2, d: 1 })
    expect(lengthOf(pathNodes(switchAt(p, 1, 1))[2])).toEqual({ n: 1, d: 1 })
  })
})

describe('chosen shapes', () => {
  const voicing = {
    instrument: 'keyboard' as const,
    notes: ['E3', 'G3', 'C4'].map((n) => parseNote(n)!),
  }

  it('keeps the shape a chord was added in', () => {
    const p = addAfter(build('F'), 0, parse('C/E'), { voicing })
    expect(pathNodes(p)[1].voicing).toEqual(voicing)
  })

  it('copies the shape with a shared chord, and drops it on a change', () => {
    let p = addAfter(build('F', 'G'), 1, parse('C/E'), { voicing })
    p = addAfter(p, 0, parse('Dm')) // F Dm C/E, sharing G's C/E
    p = addAfter(p, 2, parse('Am')) // F Dm C/E Am: Dm gets its own C/E
    expect(pathNodes(p)[2].voicing).toEqual(voicing)
    expect(isShared(p, 2)).toBe(false)
    expect(pathNodes(changeAt(p, 2, parse('C'))).at(2)?.voicing).toBe(undefined)
  })
})

describe('reading a saved progression', () => {
  it('accepts a real one and rejects junk', () => {
    const p = addAfter(build('C', 'F', 'G'), 0, parse('Am'))
    expect(isProgression(JSON.parse(JSON.stringify(p)))).toBe(true)
    expect(isProgression(null)).toBe(false)
    expect(isProgression({ nodes: {}, roots: ['x'], activePath: [] })).toBe(
      false,
    )
  })
})
