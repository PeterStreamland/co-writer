import { describe, expect, it } from 'vitest'
import {
  findFingerings,
  formatFrets,
  type Fingering,
} from '../../src/instruments/fingering'
import { makeGuitar } from '../../src/instruments/guitar'
import { PLAYABILITY_RULES } from '../../src/instruments/playability-data'
import { STANDARD_TUNING, tuningStrings } from '../../src/instruments/tunings'
import { parseChordSymbol, type ChordName } from '../../src/theory'
import { textbookShapes } from '../fixtures/textbook-shapes'

function chord(symbol: string): ChordName {
  const parsed = parseChordSymbol(symbol)
  if (!parsed) throw new Error(`bad symbol ${symbol}`)
  return parsed
}

const standard = makeGuitar(STANDARD_TUNING)

function ranked(symbol: string, guitar = standard): string[] {
  return findFingerings(guitar, chord(symbol)).map((f) => formatFrets(f.frets))
}

function shape(symbol: string, frets: string, guitar = standard): Fingering {
  const found = findFingerings(guitar, chord(symbol)).find(
    (f) => formatFrets(f.frets) === frets,
  )
  if (!found) throw new Error(`${frets} is not a ${symbol} shape`)
  return found
}

function costs(f: Fingering): Record<string, number> {
  return Object.fromEntries(f.costs.map((c) => [c.rule, c.count]))
}

describe('playability score', () => {
  // Exit criterion: the textbook shape is in its chord's top five.
  it.each(textbookShapes)(
    'puts the textbook %s shape %s in the top five',
    (symbol, frets) => {
      expect(ranked(symbol).slice(0, 5)).toContain(frets)
    },
  )

  it('ranks the easiest shape first, highest score first', () => {
    for (const symbol of ['C', 'G', 'F', 'Bm', 'C7', 'E5']) {
      const found = findFingerings(standard, chord(symbol))
      for (let i = 1; i < found.length; i++) {
        expect(found[i].score).toBeLessThanOrEqual(found[i - 1].score)
      }
    }
    expect(ranked('C')[0]).toBe('x32010')
    expect(ranked('G')[0]).toBe('320003')
    expect(ranked('F')[0]).toBe('133211')
  })

  it('gives the same ranking for the same chord every time', () => {
    expect(findFingerings(standard, chord('Am7'))).toEqual(
      findFingerings(standard, chord('Am7')),
    )
  })

  it('counts what makes open C easy or hard', () => {
    const c = shape('C', 'x32010')
    expect(costs(c)).toEqual({
      finger: 3,
      'muted-low': 1,
      'open-string': 2,
      position: 1,
    })
    const cost = (id: string) =>
      PLAYABILITY_RULES.find((r) => r.id === id)?.cost as number
    expect(c.score).toBe(
      100 -
        3 * cost('finger') -
        cost('muted-low') -
        2 * cost('open-string') -
        cost('position'),
    )
  })

  it('ranks muted strings lower, inner ones lowest (David’s choice)', () => {
    const order = ranked('C')
    const at = (frets: string) => order.indexOf(frets)
    // The same fingers, with the top string muted, then a middle string.
    expect(at('x32010')).toBeLessThan(at('x3201x'))
    expect(at('x3201x')).toBeLessThan(at('x3x010'))
    expect(costs(shape('C', 'x3x010'))['muted-inner']).toBe(1)
    expect(costs(shape('C', 'x3201x'))['muted-high']).toBe(1)
  })

  it('ranks a triad without its 5th below the full triad', () => {
    // x3201x has C E G C; x32x1x has only C E C.
    const order = ranked('C')
    expect(order.indexOf('x3201x')).toBeLessThan(order.indexOf('x32x1x'))
    expect(costs(shape('C', 'x32x1x'))['omitted-tone']).toBe(1)
    expect(costs(shape('C', 'x3201x'))['omitted-tone']).toBeUndefined()
  })

  it('charges a barre, a stretch and the climb up the neck', () => {
    expect(costs(shape('F', '133211'))).toMatchObject({ barre: 1, finger: 4 })
    // D as x50232 stretches frets 2–5.
    expect(costs(shape('D', 'x50232')).span).toBe(1)
    expect(costs(shape('A', '577655')).position).toBe(5)
    // An open string under a hand at fret 7 is awkward, not a help.
    const far = costs(shape('A', 'x07655'))
    expect(far['open-string-far']).toBe(1)
    expect(far['open-string']).toBeUndefined()
  })

  it('lets a power chord damp its top strings without cost', () => {
    const e5 = costs(shape('E5', '022xxx'))
    expect(e5['muted-high']).toBeUndefined()
    expect(e5.thin).toBeUndefined()
  })

  it('measures position from the capo', () => {
    const capo = makeGuitar(STANDARD_TUNING, { capo: 2 })
    // The G shape at capo 2 sounds A and scores as open G does.
    const a = shape('A', '542225', capo)
    expect(a.score).toBe(shape('G', '320003').score)
    expect(ranked('A', capo)[0]).toBe('542225')
  })

  it('scores shapes on alternate tunings and 7-string guitars too', () => {
    expect(ranked('D', makeGuitar(tuningStrings('drop-d', false)))[0]).toBe(
      '000232',
    )
    expect(ranked('E', makeGuitar(tuningStrings('standard', true)))[0]).toBe(
      'x022100',
    )
  })

  it('explains every rule', () => {
    for (const rule of PLAYABILITY_RULES) {
      expect(rule.explanation.length).toBeGreaterThan(20)
      expect(rule.unit).toHaveLength(2)
    }
  })
})
