import { describe, expect, it } from 'vitest'
import { makeGuitar } from '../../src/instruments/guitar'
import { shiftNotes, shiftShape } from '../../src/instruments/octave'
import { STANDARD_TUNING } from '../../src/instruments/tunings'
import { findFingerings } from '../../src/instruments/fingering'
import {
  formatNote,
  midiNumber,
  parseChordSymbol,
  parseNote,
  type Note,
} from '../../src/theory'

const guitar = makeGuitar(STANDARD_TUNING)
const notes = (text: string) => text.split(' ').map((n) => parseNote(n)!)
const names = (ns: Note[]) => ns.map((n) => formatNote(n)).join(' ')
const mean = (ns: Note[]) =>
  ns.reduce((s, n) => s + midiNumber(n)!, 0) / ns.length

describe('moving a chord by octaves (David’s request)', () => {
  it('moves every note twelve semitones, keeping its spelling', () => {
    expect(names(shiftNotes(notes('C3 E3 G3 Bb3'), 1)!)).toBe('C4 E4 G4 B♭4')
    expect(names(shiftNotes(notes('F#4 A#4 C#5'), -2)!)).toBe('F♯2 A♯2 C♯3')
  })

  it('stays on the piano', () => {
    expect(shiftNotes(notes('C8'), 1)).toBeUndefined()
    expect(shiftNotes(notes('A0 C1'), -1)).toBeUndefined()
  })

  it('moves a guitar shape twelve frets along where the neck has room', () => {
    const c = parseChordSymbol('C')!
    const open = {
      frets: [null, 3, 2, 0, 1, 0],
      notes: notes('C3 E3 G3 C4 E4'),
    }
    const up = shiftShape(guitar, c, open, 1)!
    expect(up.frets).toEqual([null, 15, 14, 12, 13, 12])
    expect(names(up.notes)).toBe('C4 E4 G4 C5 E5')
  })

  it('finds the nearest playable shape where the same shape won’t fit', () => {
    const c = parseChordSymbol('C')!
    const open = {
      frets: [null, 3, 2, 0, 1, 0],
      notes: notes('C3 E3 G3 C4 E4'),
    }
    // An octave below the open C has no room on the neck: a lower C shape
    // is offered instead, or none if the neck has nothing lower.
    const down = shiftShape(guitar, c, open, -1)
    if (down) expect(mean(down.notes)).toBeLessThan(mean(open.notes))
    // An octave up from a high shape that can't move 12 frets: the nearest
    // shape higher up.
    const high = findFingerings({ ...guitar, frets: { low: 0, high: 24 } }, c)
      .sort(
        (a, b) =>
          Math.max(...b.frets.map((f) => f ?? 0)) -
          Math.max(...a.frets.map((f) => f ?? 0)),
      )
      .find((f) => Math.max(...f.frets.map((x) => x ?? 0)) > 12)!
    const shape = {
      frets: high.frets,
      notes: high.notes.filter((n): n is Note => n !== null),
    }
    const up = shiftShape(guitar, c, shape, 1)
    if (up) {
      expect(mean(up.notes)).toBeGreaterThan(mean(shape.notes))
      expect(up.frets.every((f) => f === null || f <= 24)).toBe(true)
    }
  })
})
