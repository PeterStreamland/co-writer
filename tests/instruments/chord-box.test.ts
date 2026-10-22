import { describe, expect, it } from 'vitest'
import { chordBox } from '../../src/instruments/chord-box'
import { findFingerings, formatFrets } from '../../src/instruments/fingering'
import { makeGuitar, type Guitar } from '../../src/instruments/guitar'
import { STANDARD_TUNING } from '../../src/instruments/tunings'
import { parseChordSymbol, type ChordName } from '../../src/theory'

function parse(text: string): ChordName {
  const chord = parseChordSymbol(text)
  if (!chord) throw new Error(`${text} did not parse`)
  return chord
}

function box(guitar: Guitar, symbol: string, frets: string) {
  const chord = parse(symbol)
  const f = findFingerings(guitar, chord).find(
    (x) => formatFrets(x.frets) === frets,
  )
  if (!f) throw new Error(`${frets} not found`)
  return chordBox(guitar, chord, f)
}

const standard = makeGuitar(STANDARD_TUNING)

describe('chord box', () => {
  it('draws open C from the nut', () => {
    const c = box(standard, 'C', 'x32010')
    expect(c).toMatchObject({ first: 1, rows: 4, top: 'nut' })
    expect(c.strings.map((s) => s.fret)).toEqual([null, 3, 2, 0, 1, 0])
    expect(c.strings.map((s) => s.row)).toEqual([
      undefined,
      3,
      2,
      undefined,
      1,
      undefined,
    ])
    expect(c.strings.map((s) => s.open)).toEqual([
      false,
      false,
      false,
      true,
      false,
      true,
    ])
    // Each sounding string carries its chord tone.
    expect(c.strings.map((s) => s.tone?.label)).toEqual([
      undefined,
      'R',
      '3',
      '5',
      'R',
      '3',
    ])
    expect(c.strings[1].tone?.role).toBe('root')
  })

  it('starts up the neck at the shape’s lowest fret', () => {
    const a = box(standard, 'A', '577655')
    expect(a).toMatchObject({ first: 5, rows: 4, top: 'none' })
    expect(a.strings.map((s) => s.row)).toEqual([1, 3, 3, 2, 1, 1])
  })

  it('stays at the nut for a shape reaching fret 4', () => {
    expect(box(standard, 'B', 'x24442')).toMatchObject({
      first: 1,
      top: 'nut',
    })
  })

  it('grows for a shape wider than four frets', () => {
    const d = box(standard, 'D', 'x57775')
    expect(d.rows).toBe(4)
    const wide = findFingerings(standard, parse('G'), { maxSpan: 6 }).find(
      (f) => {
        const fretted = f.frets.filter((x): x is number => x !== null && x > 0)
        return Math.max(...fretted) - Math.min(...fretted) === 5
      },
    )!
    const layout = chordBox(standard, parse('G'), wide)
    expect(layout.rows).toBe(6)
  })

  it('draws a capo across the top and counts its fret as open', () => {
    const capo = makeGuitar(STANDARD_TUNING, { capo: 2 })
    const a = box(capo, 'A', '542225')
    expect(a).toMatchObject({ first: 3, rows: 4, top: 'capo' })
    expect(a.strings.map((s) => s.open)).toEqual([
      false,
      false,
      true,
      true,
      true,
      false,
    ])
    expect(a.strings.map((s) => s.row)).toEqual([
      3,
      2,
      undefined,
      undefined,
      undefined,
      3,
    ])
  })
})
