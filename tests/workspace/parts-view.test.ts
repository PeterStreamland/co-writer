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
  shiftPart,
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
  freezeRow,
  frozenLine,
  partLabel,
  partNotes,
  recipeLabel,
} from '../../src/workspace/parts-view'
import { setFrozenBar, shiftArpeggioNote } from '../../src/sketch/parts'
import { melodyStrips } from '../../src/workspace/melody-strips'
import { swapNote } from '../../src/theory'

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
    ).toBe('Walking, one bar silent')
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

describe('moving rows by octaves (David’s request)', () => {
  const p = addPart(build('C', 'Am', 'F', 'G'), {
    kind: 'line',
    mode: 'roots',
    roll: 0,
  })
  const id = partsShown(p)[0].id
  const notes = (q: Progression) =>
    partNotes(partsShown(q)[0], q, C, timingOf(q, time), guitar)
  const pitches = (q: Progression) => notes(q).map((n) => midiNumber(n.note))

  it('moves a whole row, or one bar of it', () => {
    const before = pitches(p)
    const up = shiftPart(p, id, 1)
    expect(pitches(up)).toEqual(before.map((m) => m! + 12))
    const bar = shiftPart(p, id, -1, p.activePath[2])
    expect(pitches(bar)).toEqual(before.map((m, i) => (i === 2 ? m! - 12 : m)))
    // Labels and spelling stay.
    expect(notes(up).map((n) => n.label)).toEqual(notes(p).map((n) => n.label))
  })

  it('goes no further than three octaves, and back to none', () => {
    let q = p
    for (let k = 0; k < 5; k++) q = shiftPart(q, id, 1)
    expect(partsShown(q)[0].octave).toBe(3)
    q = shiftPart(shiftPart(p, id, 1), id, -1)
    expect(partsShown(q)[0].octave).toBeUndefined()
    const bar = shiftPart(
      shiftPart(p, id, 1, p.activePath[0]),
      id,
      -1,
      p.activePath[0],
    )
    expect(partsShown(bar)[0].octaves).toBeUndefined()
  })
})

describe('freezing a row into notes (David’s request)', () => {
  const rowOf = (q: Progression) => partsShown(q)[0]
  const play = (q: Progression) =>
    partNotes(rowOf(q), q, C, timingOf(q, time), guitar).map((n) => ({
      step: n.step,
      onset: n.onset,
      length: n.length,
      midi: midiNumber(n.note),
    }))
  const freeze = (q: Progression) =>
    freezeRow(q, rowOf(q), C, timingOf(q, time), guitar)

  it('plays a frozen line as it played before', () => {
    const p = addPart(build('C', 'Am', 'F', 'G7'), {
      kind: 'line',
      mode: 'walking',
      roll: 0,
    })
    const frozen = freeze(p)
    expect(play(frozen)).toEqual(play(p))
    expect(partLabel(rowOf(frozen))).toBe('Walking, frozen')
    expect(rowOf(frozen).cells?.[p.activePath[0]]?.kind).toBe('notes')
  })

  it('keeps an arpeggio’s rests and holds, and the octaves it was moved', () => {
    let p = addPart(build('C', 'G'), {
      kind: 'arpeggio',
      settings: {
        choice: 'triad',
        pattern: 'up',
        rate: '8ths',
        octaves: 1,
        guitar: 'position',
      },
      gaps: { 1: 'rest', 3: 'hold' },
    })
    p = shiftPart(p, rowOf(p).id, 1)
    const before = play(p)
    expect(before.length).toBeLessThan(16)
    const frozen = freeze(p)
    expect(play(frozen)).toEqual(before)
    expect(rowOf(frozen).octave).toBeUndefined()
  })

  it('keeps a silenced bar silent, and stays put when the chords change', () => {
    let p = addPart(build('C', 'Am', 'F'), {
      kind: 'line',
      mode: 'roots',
      roll: 0,
    })
    p = clearCell(p, rowOf(p).id, p.activePath[1])
    const frozen = freeze(p)
    expect(play(frozen).some((n) => n.step === 1)).toBe(false)
    const changed = changeAt(frozen, 2, parseChordSymbol('Dm')!)
    expect(play(changed).map((n) => n.midi)).toEqual(
      play(frozen).map((n) => n.midi),
    )
  })

  it('edits a frozen bar note by note', () => {
    const p = freeze(
      addPart(build('C', 'F'), { kind: 'line', mode: 'walking', roll: 0 }),
    )
    const row = rowOf(p)
    const { notes, steps } = frozenLine(row, p, C, timingOf(p, time))
    expect(notes.length).toBe(play(p).length)
    const edited = setFrozenBar(
      p,
      row.id,
      p.activePath[0],
      swapNote(notes, 1, steps, parseNote('A3')!),
    )
    expect(play(edited)[1].midi).toBe(57)
    expect(
      frozenLine(rowOf(edited), edited, C, timingOf(edited, time)).notes[1]
        .label,
    ).toBeTruthy()
  })
})

describe('rows lined up with the melody lane (Phase 7 task 6)', () => {
  it('lays every row out in the lane’s bars, each note where it sounds', () => {
    const p = setLengthAt(
      addPart(build('C', 'Am', 'F', 'G'), {
        kind: 'arpeggio',
        settings: {
          choice: 'triad',
          pattern: 'up',
          rate: '8ths',
          octaves: 1,
          guitar: 'position',
        },
        gaps: { 2: 'rest' },
      }),
      2,
      dur(1, 2),
    )
    const notes = partNotes(partsShown(p)[0], p, C, timingOf(p, time), guitar)
    const melody = [
      { note: parseNote('C5')!, onset: dur(0, 1), length: dur(5, 1) },
    ]
    const bars = melodyStrips(melody, time, 4).length
    expect(bars).toBe(5)
    const row = melodyStrips(notes, time, bars)
    const lane = melodyStrips(melody, time, bars)
    expect(row.map((s) => s.start)).toEqual(lane.map((s) => s.start))
    // Each note in its bar where it sounds, the rests between.
    for (const s of row) {
      for (const g of s.segments) {
        if (g.kind !== 'note') continue
        expect(addDur(s.start, g.from)).toEqual(notes[g.index].onset)
      }
    }
    expect(row[0].segments.filter((g) => g.kind === 'rest')).toHaveLength(1)
  })
})

describe('moving one arpeggio note by octaves (David’s request)', () => {
  const p = addPart(build('C', 'G'), {
    kind: 'arpeggio',
    settings: {
      choice: 'triad',
      pattern: 'up',
      rate: '8ths',
      octaves: 1,
      guitar: 'position',
    },
    gaps: { 1: 'rest' },
  })
  const id = partsShown(p)[0].id
  const notes = (q: Progression) =>
    partNotes(partsShown(q)[0], q, C, timingOf(q, time), guitar)
  const pitches = (q: Progression) => notes(q).map((n) => midiNumber(n.note))

  it('moves just that note of that bar, the row still following the chords', () => {
    const before = notes(p)
    // The third note of bar 1 is at place 2 (place 1 is a rest).
    const target = before.findIndex((n) => n.step === 0 && n.place === 2)
    const q = shiftArpeggioNote(p, id, p.activePath[0], 2, 1)
    expect(pitches(q)).toEqual(
      before.map((n, k) => midiNumber(n.note)! + (k === target ? 12 : 0)),
    )
    expect(recipeLabel(partsShown(q)[0].cells![p.activePath[0]]!)).toMatch(
      /1 note moved/,
    )
    // Changing the chord keeps the move, on the new chord's note.
    const changed = changeAt(q, 0, parseChordSymbol('Am')!)
    const moved = notes(changed).find((n) => n.step === 0 && n.place === 2)!
    const plain = notes(changeAt(p, 0, parseChordSymbol('Am')!)).find(
      (n) => n.step === 0 && n.place === 2,
    )!
    expect(midiNumber(moved.note)).toBe(midiNumber(plain.note)! + 12)
  })

  it('moves back to none, and no further than three octaves', () => {
    const node = p.activePath[1]
    const back = shiftArpeggioNote(
      shiftArpeggioNote(p, id, node, 0, -1),
      id,
      node,
      0,
      1,
    )
    expect(pitches(back)).toEqual(pitches(p))
    let far = p
    for (let k = 0; k < 5; k++) far = shiftArpeggioNote(far, id, node, 0, 1)
    const cell = partsShown(far)[0].cells![node]
    expect(cell?.kind === 'arpeggio' && cell.shifts).toEqual({ 0: 3 })
  })

  it('keeps the move when the row is frozen', () => {
    const q = shiftArpeggioNote(p, id, p.activePath[0], 0, -1)
    const frozen = freezeRow(q, partsShown(q)[0], C, timingOf(q, time), guitar)
    expect(pitches(frozen)).toEqual(pitches(q))
  })
})
