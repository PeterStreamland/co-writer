import { describe, expect, it } from 'vitest'
import { makeGuitar } from '../../src/instruments/guitar'
import { STANDARD_TUNING } from '../../src/instruments/tunings'
import {
  EMPTY_PROGRESSION,
  addAfter,
  changeAt,
  setLengthAt,
  timingOf,
  type Progression,
} from '../../src/sketch/progression'
import {
  addCell,
  addPart,
  clearCell,
  partsShown,
  type PartRecipe,
} from '../../src/sketch/parts'
import {
  addDur,
  compareDur,
  dur,
  lineFor,
  lineSeed,
  midiNumber,
  parseChordSymbol,
  parseNote,
  pitchClass,
  seededRandom,
  sumDurs,
  type Key,
} from '../../src/theory'
import { lineSteps } from '../../src/workspace/lines-view'
import {
  partLabel,
  partNotes,
  recipeLabel,
} from '../../src/workspace/parts-view'

const C: Key = { tonic: parseNote('C')!, mode: 'major' }
const time = { meter: { num: 4, den: 4 } }
const guitar = makeGuitar(STANDARD_TUNING)

function build(...symbols: string[]): Progression {
  let p = EMPTY_PROGRESSION
  for (const s of symbols) {
    p = addAfter(p, p.activePath.length - 1, parseChordSymbol(s)!)
  }
  return p
}

const notesOf = (p: Progression, recipe: PartRecipe, g = guitar) => {
  const withRow = addPart(p, recipe)
  return partNotes(
    partsShown(withRow)[0],
    withRow,
    C,
    timingOf(withRow, time),
    g,
  )
}

describe('what a row plays', () => {
  it('plays the line mode over the chords as they are', () => {
    const p = build('Dm7', 'G7', 'Cmaj7')
    const recipe: PartRecipe = { kind: 'line', mode: 'wildcard', roll: 2 }
    const steps = lineSteps(p, C, timingOf(p, time))
    const line = lineFor('wildcard', steps, seededRandom(lineSeed(steps) + 2))
    expect(notesOf(p, recipe).map((n) => n.note)).toEqual(
      line.notes.map((n) => n.note),
    )
  })

  it('follows a changed chord', () => {
    const recipe: PartRecipe = { kind: 'line', mode: 'roots', roll: 0 }
    const before = notesOf(build('C', 'Am', 'F'), recipe)
    const after = notesOf(
      changeAt(build('C', 'Am', 'F'), 1, parseChordSymbol('Em')!),
      recipe,
    )
    expect(pitchClass(before[1].note)).toBe(pitchClass(parseNote('A')!))
    expect(pitchClass(after[1].note)).toBe(pitchClass(parseNote('E')!))
  })

  it('fills each chord with its arpeggio, even when lengths change', () => {
    const recipe: PartRecipe = {
      kind: 'arpeggio',
      settings: {
        choice: 'triad',
        pattern: 'up',
        rate: '8ths',
        octaves: 1,
        guitar: 'position',
      },
    }
    const p = setLengthAt(build('C', 'G'), 0, dur(1, 2))
    const notes = notesOf(p, recipe)
    // Half a bar of 8ths over C, a bar over G.
    expect(notes.filter((n) => n.step === 0)).toHaveLength(4)
    expect(notes.filter((n) => n.step === 1)).toHaveLength(8)
    expect(sumDurs(notes.map((n) => n.length))).toEqual(dur(3, 2))
    // End to end, from the top.
    let at = dur(0, 1)
    for (const n of notes) {
      expect(compareDur(n.onset, at)).toBe(0)
      at = addDur(at, n.length)
    }
  })

  it('stays near the fret it was added at on guitar', () => {
    const recipe: PartRecipe = {
      kind: 'arpeggio',
      settings: {
        choice: 'triad',
        pattern: 'up',
        rate: '8ths',
        octaves: 2,
        guitar: 'position',
      },
      from: 7,
    }
    const notes = notesOf(build('C', 'F', 'G'), recipe)
    // Around the 7th fret nothing goes down to the open low strings: the
    // lowest note is at least A2, the 5th fret of the low E string.
    const lowest = Math.min(...notes.map((n) => midiNumber(n.note)!))
    expect(lowest).toBeGreaterThanOrEqual(45)
    const open = notesOf(build('C', 'F', 'G'), { ...recipe, from: 0 })
    expect(Math.min(...open.map((n) => midiNumber(n.note)!))).toBeLessThan(45)
    expect(notes.length).toBeGreaterThan(0)
  })

  it('names its recipes and rows', () => {
    expect(recipeLabel({ kind: 'line', mode: 'walking', roll: 0 })).toBe(
      'Walking',
    )
    expect(recipeLabel({ kind: 'line', mode: 'wildcard', roll: 2 })).toBe(
      'Wildcard (roll 3)',
    )
    expect(
      recipeLabel({
        kind: 'arpeggio',
        settings: {
          choice: 'seventh',
          pattern: 'up-down',
          rate: '16ths',
          octaves: 2,
          guitar: 'position',
        },
        from: 5,
      }),
    ).toBe('7th arpeggios, up and down, 16ths, around fret 5')
    const walking = { kind: 'line', mode: 'walking', roll: 0 } as const
    expect(partLabel({ id: 'r1', anchor: 'n1', recipe: walking })).toBe(
      'Walking',
    )
    expect(
      partLabel({
        id: 'r1',
        anchor: 'n1',
        recipe: walking,
        cells: { n2: null },
      }),
    ).toBe('Walking, with one bar of its own')
    expect(
      partLabel({
        id: 'r1',
        anchor: 'n1',
        kind: 'arpeggio',
        cells: { n2: null },
      }),
    ).toBe('Arpeggios, bar by bar')
  })
})

describe('rows built bar by bar', () => {
  const p = build('C', 'Am', 'F', 'G')
  const [n1, n2, n3] = p.activePath
  const time4 = timingOf(p, time)
  const notes = (q: Progression) =>
    partNotes(partsShown(q)[0], q, C, timingOf(q, time), guitar)

  it('plays only the bars added, each its own way', () => {
    let q = addCell(p, n1, { kind: 'line', mode: 'roots', roll: 0 })
    q = addCell(q, n3, { kind: 'line', mode: 'walking', roll: 0 })
    expect(partsShown(q)).toHaveLength(1)
    const played = notes(q)
    expect([...new Set(played.map((n) => n.step))]).toEqual([0, 2])
    expect(played.filter((n) => n.step === 0)).toHaveLength(1) // a held root
    expect(played.filter((n) => n.step === 2)).toHaveLength(4) // a walk
    expect(played[0].onset).toEqual(time4[0].start)
  })

  it('mixes arpeggio settings bar by bar', () => {
    const triad = {
      kind: 'arpeggio',
      settings: {
        choice: 'triad',
        pattern: 'up',
        rate: '8ths',
        octaves: 1,
        guitar: 'position',
      },
    } as const
    let q = addCell(p, n1, triad)
    q = addCell(q, n2, {
      ...triad,
      settings: { ...triad.settings, choice: 'seventh', rate: '16ths' },
    })
    const played = notes(q)
    expect(played.filter((n) => n.step === 0)).toHaveLength(8)
    expect(played.filter((n) => n.step === 1)).toHaveLength(16)
    expect(played.some((n) => n.step === 2)).toBe(false)
  })

  it('lets one bar of a whole row play differently, or not at all', () => {
    let q = addPart(p, { kind: 'line', mode: 'roots', roll: 0 })
    q = addCell(q, n2, { kind: 'line', mode: 'walking', roll: 0 })
    expect(partsShown(q)).toHaveLength(1)
    expect(notes(q).filter((n) => n.step === 1)).toHaveLength(4)
    expect(notes(q).filter((n) => n.step === 0)).toHaveLength(1)
    q = clearCell(q, partsShown(q)[0].id, n2)
    expect(notes(q).some((n) => n.step === 1)).toBe(false)
    expect(notes(q).filter((n) => n.step === 3)).toHaveLength(1)
  })
})

describe('edited rows (David’s request)', () => {
  const p = build('C', 'Am', 'F', 'G')
  const [n1, n2] = p.activePath
  const notes = (q: Progression) =>
    partNotes(partsShown(q)[0], q, C, timingOf(q, time), guitar)
  const bar = [
    { note: parseNote('C3')!, at: dur(0, 1) },
    { note: parseNote('D3')!, at: dur(1, 2) },
  ]

  it('plays as many notes a bar as its recipe sets', () => {
    const q = addPart(p, {
      kind: 'line',
      mode: 'roots',
      roll: 0,
      density: 'split',
    })
    expect(notes(q).filter((n) => n.step === 0)).toHaveLength(8)
    const r = addCell(q, n2, {
      kind: 'line',
      mode: 'roots',
      roll: 0,
      density: 'held',
    })
    expect(notes(r).filter((n) => n.step === 1)).toHaveLength(1)
    expect(notes(r).filter((n) => n.step === 2)).toHaveLength(8)
  })

  it('plays an edited bar as it was edited, tagged afresh', () => {
    const q = addPart(
      p,
      { kind: 'line', mode: 'roots', roll: 0 },
      { [n1]: { kind: 'line', mode: 'roots', roll: 0, notes: bar } },
    )
    const first = notes(q).filter((n) => n.step === 0)
    expect(first.map((n) => n.note)).toEqual(bar.map((b) => b.note))
    expect(first[1].onset).toEqual(dur(1, 2))
    expect(first[1].look).toMatch(/tag-/)
    expect(notes(q).filter((n) => n.step === 1)).toHaveLength(1)
    // Each note's ref is its place in the row.
    expect(notes(q).map((n) => n.ref)).toEqual(notes(q).map((_, i) => i))
  })

  it('plays a bar’s own count and refresh as the tab did', () => {
    const q = addPart(
      p,
      { kind: 'line', mode: 'walking', roll: 0 },
      {
        [n1]: { kind: 'line', mode: 'walking', roll: 0, count: 6, seed: 2 },
      },
    )
    expect(notes(q).filter((n) => n.step === 0)).toHaveLength(6)
    expect(notes(q).filter((n) => n.step === 1)).toHaveLength(4)
    expect(
      recipeLabel({
        kind: 'line',
        mode: 'walking',
        roll: 0,
        count: 6,
        seed: 2,
      }),
    ).toBe('Walking, 6 notes, refreshed')
  })

  it('names densities and edits', () => {
    expect(
      recipeLabel({ kind: 'line', mode: 'walking', roll: 0, density: 'split' }),
    ).toBe('Walking, twice a beat')
    expect(
      recipeLabel({ kind: 'line', mode: 'walking', roll: 0, notes: bar }),
    ).toBe('Walking, edited')
  })
})
