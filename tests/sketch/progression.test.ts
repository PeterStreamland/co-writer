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
  setLengthAt,
  timingOf,
  isShared,
  keyAfter,
  keyAt,
  pathNodes,
  removeAt,
  selectNode,
  switchAt,
  type Progression,
  shiftAt,
  setChordStyle,
  setStyleAt,
  styleAt,
} from '../../src/sketch/progression'
import { record, redo, startHistory, undo } from '../../src/sketch/history'
import {
  chordSymbol,
  parseChordSymbol,
  parseNote,
  type ChordName,
  type Key,
  type Meter,
} from '../../src/theory'

function parse(text: string): ChordName {
  const chord = parseChordSymbol(text)
  if (!chord) throw new Error(`${text} did not parse`)
  return chord
}

const C_MAJOR: Key = { tonic: parseNote('C')!, mode: 'major' }
const G_MAJOR: Key = { tonic: parseNote('G')!, mode: 'major' }
const FOUR: Meter = { num: 4, den: 4 }

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

describe('replacing a chord', () => {
  it('swaps the chord and its shape, keeping length and key change', () => {
    let p = setLengthAt(build('C', 'G', 'Am'), 1, { n: 1, d: 2 })
    p = changeAt(p, 1, parse('G7'), {
      instrument: 'keyboard',
      notes: [parseNote('G3')!, parseNote('B3')!, parseNote('F4')!],
    })
    expect(strip(p)).toBe('C G7 Am')
    expect(pathNodes(p)[1].length).toEqual({ n: 1, d: 2 })
    expect(pathNodes(p)[1].voicing?.notes).toHaveLength(3)
    // Without a shape, the old shape goes.
    expect(pathNodes(changeAt(p, 1, parse('G'))).at(1)?.voicing).toBeUndefined()
  })
})

describe('chord lengths', () => {
  const lengths = (p: Parameters<typeof timingOf>[0], meter = FOUR) =>
    timingOf(p, { meter }).map((t) => t.length)

  it('lasts a bar unless set, and clears back to a bar', () => {
    let p = build('C', 'G')
    expect(lengths(p)).toEqual([
      { n: 1, d: 1 },
      { n: 1, d: 1 },
    ])
    p = setLengthAt(p, 0, { n: 1, d: 2 })
    expect(pathNodes(p)[0].length).toEqual({ n: 1, d: 2 })
    p = setLengthAt(p, 0, undefined)
    expect(pathNodes(p)[0].length).toBeUndefined()
  })

  it("keeps four beats in 3/4, where a bar isn't four beats", () => {
    const p = setLengthAt(build('C', 'G'), 0, { n: 1, d: 1 })
    expect(lengths(p, { num: 3, den: 4 })).toEqual([
      { n: 1, d: 1 },
      { n: 3, d: 4 },
    ])
  })

  it('copies a shared chord before changing its length', () => {
    let p = addAfter(build('C', 'F', 'G'), 0, parse('Am')) // C Am G (shared)
    p = setLengthAt(p, 2, { n: 2, d: 1 })
    expect(lengths(p)[2]).toEqual({ n: 2, d: 1 })
    expect(lengths(switchAt(p, 1, 1))[2]).toEqual({ n: 1, d: 1 })
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

describe('moving chords by octaves (David’s request)', () => {
  const voicing = (text: string) => ({
    instrument: 'keyboard' as const,
    notes: text.split(' ').map((n) => parseNote(n)!),
  })
  let p = EMPTY_PROGRESSION
  for (const c of ['C', 'Am', 'F']) {
    p = addAfter(p, p.activePath.length - 1, parseChordSymbol(c)!)
  }

  it('keeps the moved notes and counts the octaves', () => {
    const up = shiftAt(p, 1, voicing('A4 C5 E5'), 1)
    const n = pathNodes(up)[1]
    expect(n.octave).toBe(1)
    expect(n.voicing?.notes.map((x) => x.octave)).toEqual([4, 5, 5])
    expect(pathNodes(up)[0].octave).toBeUndefined()
    const back = shiftAt(up, 1, voicing('A3 C4 E4'), -1)
    expect(pathNodes(back)[1].octave).toBeUndefined()
    expect(isProgression(JSON.parse(JSON.stringify(up)))).toBe(true)
  })

  it('starts over when the chord itself changes', () => {
    const up = shiftAt(p, 1, voicing('A4 C5 E5'), 1)
    const changed = changeAt(up, 1, parseChordSymbol('Dm')!)
    expect(pathNodes(changed)[1].octave).toBeUndefined()
    expect(pathNodes(changed)[1].voicing).toBeUndefined()
  })

  it('rejects a saved octave that isn’t a whole number', () => {
    const up = shiftAt(p, 1, voicing('A4 C5 E5'), 1)
    const id = up.activePath[1]
    const broken = {
      ...up,
      nodes: { ...up.nodes, [id]: { ...up.nodes[id], octave: 0.5 } },
    }
    expect(isProgression(broken)).toBe(false)
  })
})

describe('removing a chord (David’s request)', () => {
  it('closes up the chords after it', () => {
    const p = build('C', 'Am', 'F', 'G')
    expect(strip(removeAt(p, 1))).toBe('C F G')
    expect(strip(removeAt(p, 0))).toBe('Am F G')
    expect(strip(removeAt(p, 3))).toBe('C Am F')
    expect(strip(removeAt(build('C'), 0))).toBe('')
  })

  it('keeps the tree whole: the next chord hangs off the chord before', () => {
    const p = removeAt(build('C', 'Am', 'F', 'G'), 1)
    const [c, f] = pathNodes(p)
    expect(f.parent).toBe(c.id)
    expect(c.children).toEqual([f.id])
    expect(isProgression(p)).toBe(true)
    // More chords carry on from the new path.
    expect(strip(addAfter(p, 2, parse('C')))).toBe('C F G C')
  })

  it('leaves the alternatives at its slot', () => {
    let p = build('C', 'Am', 'F')
    p = addAfter(p, 0, parse('Em')) // Em is Am's alternative, sharing F
    expect(strip(p)).toBe('C Em F')
    const q = removeAt(p, 1)
    expect(strip(q)).toBe('C F')
    // Am is still there, one ‹ › away from F at that slot.
    expect(
      alternatives(q, 1).map((id) => chordSymbol(q.nodes[id].chord)),
    ).toEqual(['Am', 'F'])
    // The removed chord's own continuation stays under Am.
    expect(strip(switchAt(q, 1, -1))).toBe('C Am F')
  })

  it('passes its key change to the chord after it', () => {
    const p = addAllAfter(
      EMPTY_PROGRESSION,
      -1,
      [parse('C'), parse('D7'), parse('G')],
      [{}, { keyChange: G_MAJOR }],
    )
    const q = removeAt(p, 1)
    expect(strip(q)).toBe('C G')
    expect(keyAt(q, 1, C_MAJOR)).toEqual(C_MAJOR)
    expect(keyAfter(q, 1, C_MAJOR)).toEqual(G_MAJOR)
  })

  it('can be undone', () => {
    const p = build('C', 'Am', 'F')
    const h = record(startHistory(p), removeAt(p, 1))
    expect(strip(undo(h).present)).toBe('C Am F')
  })

  it('ignores a slot that isn’t there', () => {
    const p = build('C')
    expect(removeAt(p, 4)).toBe(p)
    expect(removeAt(p, -1)).toBe(p)
  })
})

describe('chord styles (Phase 7 task 8, David’s request)', () => {
  const p = ['C', 'Am', 'F', 'G'].reduce(
    (q, s) => addAfter(q, q.activePath.length - 1, parse(s)),
    EMPTY_PROGRESSION,
  )
  it('plays block until a style is chosen', () => {
    expect([0, 1, 2, 3].map((i) => styleAt(p, i))).toEqual([
      'block',
      'block',
      'block',
      'block',
    ])
  })
  it('lets a single chord’s own style override the progression’s', () => {
    let q = setChordStyle(p, 'pulse')
    q = setStyleAt(q, 2, 'oom-pah')
    expect([0, 1, 2, 3].map((i) => styleAt(q, i))).toEqual([
      'pulse',
      'pulse',
      'oom-pah',
      'pulse',
    ])
    // Changing the progression's style leaves the chord's own alone.
    q = setChordStyle(q, 'stabs')
    expect(styleAt(q, 2)).toBe('oom-pah')
    expect(styleAt(q, 3)).toBe('stabs')
    // And a chord can go back to the progression's.
    q = setStyleAt(q, 2, undefined)
    expect(styleAt(q, 2)).toBe('stabs')
    expect(pathNodes(q)[2].style).toBeUndefined()
  })
  it('keeps a chord’s style when the chord is changed', () => {
    const q = changeAt(setStyleAt(p, 1, 'broken'), 1, parse('Em'))
    expect(styleAt(q, 1)).toBe('broken')
  })
  it('saves and reads back styles, rejecting broken ones', () => {
    const q = setStyleAt(setChordStyle(p, 'down-up'), 0, 'strum')
    const saved = JSON.parse(JSON.stringify(q))
    expect(isProgression(saved)).toBe(true)
    expect(styleAt(saved, 0)).toBe('strum')
    expect(isProgression({ ...saved, chordStyle: 3 })).toBe(false)
    const id = q.activePath[0]
    expect(
      isProgression({
        ...saved,
        nodes: { ...saved.nodes, [id]: { ...saved.nodes[id], style: 7 } },
      }),
    ).toBe(false)
  })
  it('undoes a change of style', () => {
    let h = startHistory(p)
    h = record(h, setChordStyle(p, 'pulse'))
    expect(styleAt(undo(h).present, 0)).toBe('block')
    expect(styleAt(redo(undo(h)).present, 0)).toBe('pulse')
  })
})
