import { describe, expect, it } from 'vitest'
import {
  chordSymbol,
  closeVoicing,
  formatNote,
  inversionOf,
  inversions,
  midiNumber,
  parseChordSymbol,
  parseNote,
  stepInversion,
  inversionStepLabel,
  type ChordName,
  type Note,
} from '../../src/theory'
import { inversionSteps } from '../fixtures/inversion-steps'

const notesOf = (text: string): Note[] =>
  text.split(' ').map((t) => parseNote(t)!)
const text = (notes: Note[]) => notes.map((n) => formatNote(n)).join(' ')
const ascii = (c: ChordName) => chordSymbol(c, { ascii: true })

describe('stepping through inversions (Phase 7 task 9)', () => {
  for (const f of inversionSteps) {
    it(f.name, () => {
      let chord = parseChordSymbol(f.chord)!
      let notes = notesOf(f.notes)
      let octave = 0
      for (const want of f.steps) {
        const step = stepInversion(chord, notes, f.way === 'up' ? 1 : -1)!
        expect(step).toBeDefined()
        chord = step.chord
        notes = step.notes
        octave += step.octave
        expect(ascii(chord)).toBe(ascii(parseChordSymbol(want.chord)!))
        expect(text(notes)).toBe(text(notesOf(want.notes)))
        expect(inversionStepLabel(step.inversion, octave)).toBe(want.label)
      }
    })
  }

  // The exit criterion: every inversion before the next octave, labelled.
  const chords = [
    'C',
    'Cm',
    'Bdim',
    'Caug',
    'G7',
    'Fmaj7',
    'Dm7',
    'F#m7b5',
    'Bbsus2',
    'E5',
    'Abm6',
    'C#dim7',
  ]
  for (const symbol of chords) {
    it(`${symbol} visits every inversion before the next octave, each way`, () => {
      const start = parseChordSymbol(symbol)!
      const count = inversions(start).length
      for (const by of [1, -1] as const) {
        let chord = start
        let notes = rootVoicing(start)
        const seen: number[] = []
        let octave = 0
        for (let k = 0; k < count; k++) {
          const step = stepInversion(chord, notes, by)!
          chord = step.chord
          notes = step.notes
          octave += step.octave
          seen.push(inversionOf(chord)!)
          // Each step is labelled as what it is.
          const label = inversionStepLabel(step.inversion, octave)
          if (step.inversion > 0) expect(label).toMatch(/inversion/)
          if (octave !== 0) expect(label).toMatch(/octave/)
          // The bass moves the way asked, and is the lowest note.
          expect(Math.min(...notes.map((n) => midiNumber(n)!))).toBe(
            midiNumber(notes[0]),
          )
        }
        // Every inversion once, ending in root position an octave away.
        expect([...seen].sort()).toEqual([...Array(count).keys()])
        expect(seen.at(-1)).toBe(0)
        expect(octave).toBe(by)
        expect(midiNumber(notes[0])! - midiNumber(rootVoicing(start)[0])!).toBe(
          12 * by,
        )
      }
    })
  }

  it('can’t step a slash chord over a note outside it', () => {
    const fOverG = parseChordSymbol('F/G')!
    expect(stepInversion(fOverG, notesOf('G2 F3 A3 C4'), 1)).toBeUndefined()
  })
})

// A chord's root position, close, from its root in octave 3.
function rootVoicing(chord: ChordName): Note[] {
  return closeVoicing(chord, 3)
}
