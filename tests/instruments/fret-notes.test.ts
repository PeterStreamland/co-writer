import { describe, expect, it } from 'vitest'
import { DEFAULT_SPAN, formatFrets } from '../../src/instruments/fingering'
import { fretNotes } from '../../src/instruments/fret-notes'
import { fretMidi, makeGuitar } from '../../src/instruments/guitar'
import { voiceProgressionOnGuitar } from '../../src/instruments/lens-guitar'
import { STANDARD_TUNING } from '../../src/instruments/tunings'
import {
  EXPERIMENTAL_LENSES,
  midiNumber,
  parseNote,
  seededRandom,
  type Note,
} from '../../src/theory'
import { progressions } from '../lens-helpers'

const standard = makeGuitar(STANDARD_TUNING)
const notes = (text: string) => text.split(' ').map((n) => parseNote(n) as Note)

describe('fretting exact notes', () => {
  it('finds the open C chord for C3 E3 G3 C4 E4', () => {
    const found = fretNotes(standard, notes('C3 E3 G3 C4 E4'), { most: 10 })
    expect(found.map((f) => formatFrets(f.frets))).toContain('x32010')
  })

  it('plays exactly the notes asked for, one per string, within the span', () => {
    const asked = notes('E3 A3 D4 G4 B4')
    for (const f of fretNotes(standard, asked, { most: 20 })) {
      const sounding = f.frets.flatMap((fret, s) =>
        fret === null ? [] : [fretMidi(standard, s, fret) as number],
      )
      expect(sounding.sort((a, b) => a - b)).toEqual(
        asked.map((n) => midiNumber(n) as number),
      )
      const fretted = f.frets.filter((x): x is number => x !== null && x > 0)
      if (fretted.length) {
        expect(
          Math.max(...fretted) - Math.min(...fretted) + 1,
        ).toBeLessThanOrEqual(DEFAULT_SPAN)
      }
    }
  })

  it('finds nothing for more notes than strings, or out of reach', () => {
    expect(fretNotes(standard, notes('C3 D3 E3 F3 G3 A3 B3'))).toEqual([])
    expect(fretNotes(standard, notes('C1'))).toEqual([])
  })
})

describe('experimental lenses on guitar', () => {
  it.each(EXPERIMENTAL_LENSES)(
    'voices the test progressions with reachable shapes in the %s lens',
    (lens) => {
      for (const p of progressions.slice(0, 8)) {
        const voiced = voiceProgressionOnGuitar(
          standard,
          lens,
          p.steps,
          seededRandom(3),
        )
        expect(voiced).toHaveLength(p.steps.length)
        for (const c of voiced) {
          const fretted = c.voicing.frets.filter(
            (x): x is number => x !== null && x > 0,
          )
          if (fretted.length) {
            const span = Math.max(...fretted) - Math.min(...fretted) + 1
            expect(span, formatFrets(c.voicing.frets)).toBeLessThanOrEqual(
              DEFAULT_SPAN,
            )
          }
        }
      }
    },
  )
})
