import { describe, expect, it } from 'vitest'
import {
  CAGED_ORDER,
  cagedShape,
  groupByCaged,
  shapeName,
} from '../../src/instruments/caged'
import { findFingerings, formatFrets } from '../../src/instruments/fingering'
import { makeGuitar, type Guitar } from '../../src/instruments/guitar'
import { STANDARD_TUNING, tuningStrings } from '../../src/instruments/tunings'
import { parseChordSymbol, type ChordName } from '../../src/theory'
import { cagedShapes, shapeNames } from '../fixtures/caged'

function chord(symbol: string): ChordName {
  const parsed = parseChordSymbol(symbol)
  if (!parsed) throw new Error(`bad symbol ${symbol}`)
  return parsed
}

// The fingering with these frets, as the search finds it.
function fingering(guitar: Guitar, name: ChordName, frets: string) {
  const found = findFingerings(guitar, name).find(
    (f) => formatFrets(f.frets) === frets,
  )
  if (!found) throw new Error(`${frets} is not a shape the search finds`)
  return found
}

describe('CAGED shapes', () => {
  it.each(cagedShapes)(
    'names the shapes of $chord in $tuning (capo $capo)',
    ({ tuning, sevenString, capo, chord: symbol, shapes }) => {
      const guitar = makeGuitar(tuningStrings(tuning, sevenString ?? false), {
        capo,
      })
      const name = chord(symbol)
      for (const [frets, shape] of Object.entries(shapes)) {
        expect(
          cagedShape(guitar, name, fingering(guitar, name, frets)),
          frets,
        ).toBe(shape)
      }
    },
  )

  it.each(shapeNames)(
    'names $frets as $name',
    ({ tuning, capo, chord: symbol, frets, name }) => {
      const guitar = makeGuitar(tuningStrings(tuning, false), { capo })
      const c = chord(symbol)
      expect(shapeName(guitar, c, fingering(guitar, c, frets))).toBe(name)
    },
  )

  it('finds no CAGED shapes outside standard tuning', () => {
    for (const id of ['drop-d', 'dadgad', 'open-g']) {
      const guitar = makeGuitar(tuningStrings(id, false))
      const found = findFingerings(guitar, chord('G'))
      expect(found.every((f) => !cagedShape(guitar, chord('G'), f))).toBe(true)
    }
  })

  it('finds every shape of a major chord across the neck', () => {
    const guitar = makeGuitar(STANDARD_TUNING)
    for (const symbol of ['C', 'D', 'E', 'F', 'G', 'A', 'B']) {
      const groups = groupByCaged(
        guitar,
        chord(symbol),
        findFingerings(guitar, chord(symbol)),
      )
      const shapes = groups.map((g) => g.shape).filter(Boolean)
      expect(new Set(shapes), symbol).toEqual(new Set(CAGED_ORDER))
    }
  })

  it('groups in C A G E D order, then the rest, keeping each group’s order', () => {
    const guitar = makeGuitar(STANDARD_TUNING)
    const name = chord('C')
    const found = findFingerings(guitar, name)
    const groups = groupByCaged(guitar, name, found)
    expect(groups.map((g) => g.shape)).toEqual([...CAGED_ORDER, undefined])
    // Nothing lost or repeated.
    expect(groups.flatMap((g) => g.fingerings)).toHaveLength(found.length)
    for (const group of groups) {
      const positions = group.fingerings.map((f) => found.indexOf(f))
      expect(positions).toEqual([...positions].sort((a, b) => a - b))
      for (const f of group.fingerings) {
        expect(cagedShape(guitar, name, f)).toBe(group.shape)
      }
    }
    // The easiest C-shape C is open C.
    expect(formatFrets(groups[0].fingerings[0].frets)).toBe('x32010')
  })
})
