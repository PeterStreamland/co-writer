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
import { addPart, partsShown, type PartRecipe } from '../../src/sketch/parts'
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
import { partLabel, partNotes } from '../../src/workspace/parts-view'

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

  it('names its row', () => {
    expect(partLabel({ kind: 'line', mode: 'walking', roll: 0 })).toBe(
      'Walking',
    )
    expect(partLabel({ kind: 'line', mode: 'wildcard', roll: 2 })).toBe(
      'Wildcard (roll 3)',
    )
    expect(
      partLabel({
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
  })
})
