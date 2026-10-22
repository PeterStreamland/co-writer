import { describe, expect, it } from 'vitest'
import {
  BUILT_IN_STYLES,
  NEXT_CHORD_RULES,
  blendWeights,
  chordKey,
  getScale,
  nextChordCandidates,
  parseChordSymbol,
  parseNote,
  readStyleSet,
  snapMix,
  styleScore,
  styleSetJson,
  styleSetProblems,
  type ChordName,
  type Key,
  type StyleSet,
} from '../../src/theory'
import stylesFile from '../../src/theory/styles.json?raw'
import { styleRankings } from '../fixtures/style-rankings'

function parse(text: string): ChordName {
  const chord = parseChordSymbol(text)
  if (!chord) throw new Error(`${text} did not parse`)
  return chord
}

function key(text: string): Key {
  const [tonicText, modeText] = text.split(' ')
  const tonic = parseNote(tonicText)
  const mode = getScale(modeText === 'minor' ? 'natural-minor' : modeText)?.id
  if (!tonic || !mode) throw new Error(`${text} is not a key`)
  return { tonic, mode }
}

const ruleIds = NEXT_CHORD_RULES.map((r) => r.id)

describe('built-in styles', () => {
  it('weighs every rule in pop, rock and metal', () => {
    expect(styleSetProblems(BUILT_IN_STYLES)).toEqual([])
    expect(BUILT_IN_STYLES.styles.map((s) => s.id)).toEqual([
      'pop',
      'rock',
      'metal',
    ])
    for (const style of BUILT_IN_STYLES.styles) {
      expect(Object.keys(style.weights).sort()).toEqual([...ruleIds].sort())
    }
  })

  it('exports exactly as styles.json is written', () => {
    expect(styleSetJson(BUILT_IN_STYLES)).toBe(stylesFile)
  })
})

describe('styleSetProblems', () => {
  const copy = (): StyleSet => JSON.parse(JSON.stringify(BUILT_IN_STYLES))

  it.each([
    ['not an object', 'x', 'not a style set'],
    ['a wrong version', { ...copy(), version: 2 }, 'version 2 is not 1'],
  ])('finds %s', (_, value, problem) => {
    expect(styleSetProblems(value)).toContain(problem)
  })

  it('finds missing, bad and unknown weights', () => {
    const set = copy()
    delete set.styles[0].weights['pedal.sus']
    set.styles[1].weights['rock.flat-six'] = 6
    set.styles[2].weights['rock.flat-six'] = 2.5
    set.styles[2].weights['jazz.tritone'] = 3
    expect(styleSetProblems(set)).toEqual([
      'pop has no weight for pedal.sus',
      'rock has no weight for rock.flat-six',
      'metal has no weight for rock.flat-six',
      'metal weighs unknown rule jazz.tritone',
    ])
  })
})

describe('readStyleSet', () => {
  it('keeps good edits and falls back for the rest', () => {
    const read = readStyleSet({
      styles: [
        { id: 'metal', weights: { 'rock.flat-six': 1, 'pedal.sus': 9 } },
        { id: 'jazz', weights: { 'rock.flat-six': 0 } },
      ],
    })
    const metal = read.styles.find((s) => s.id === 'metal')
    expect(metal?.weights['rock.flat-six']).toBe(1)
    expect(metal?.weights['pedal.sus']).toBe(
      BUILT_IN_STYLES.styles[2].weights['pedal.sus'],
    )
    expect(read.styles.map((s) => s.id)).toEqual(['pop', 'rock', 'metal'])
    expect(read.styles[0]).toEqual(BUILT_IN_STYLES.styles[0])
  })

  it('gives the built-in weights for anything unreadable', () => {
    expect(readStyleSet(null)).toEqual(BUILT_IN_STYLES)
    expect(readStyleSet({ styles: 'no' })).toEqual(BUILT_IN_STYLES)
  })
})

describe('blending', () => {
  it.each([
    [0.3, 0.25],
    [0.4, 0.5],
    [0.875, 1],
    [-1, 0],
    [2, 1],
  ])('snaps a mix of %s to %s', (mix, snapped) => {
    expect(snapMix(mix)).toBe(snapped)
  })

  it('weighs each rule between the two styles', () => {
    const [, rock, metal] = BUILT_IN_STYLES.styles
    const id = 'borrowed.phrygian'
    const at = (mix: number) =>
      blendWeights(BUILT_IN_STYLES, { a: 'rock', b: 'metal', mix })[id]
    expect(at(0)).toBe(rock.weights[id])
    expect(at(1)).toBe(metal.weights[id])
    expect(at(0.5)).toBe((rock.weights[id] + metal.weights[id]) / 2)
    expect(at(0.3)).toBe(at(0.25))
  })

  it('uses one style alone when there is no second', () => {
    expect(blendWeights(BUILT_IN_STYLES, { a: 'pop', mix: 1 })).toEqual(
      BUILT_IN_STYLES.styles[0].weights,
    )
  })

  it('rejects an unknown style', () => {
    expect(() => blendWeights(BUILT_IN_STYLES, { a: 'jazz', mix: 0 })).toThrow()
  })
})

describe('scoring with a style', () => {
  const c = key('C major')
  const previous = [parse('C')]

  it('scales the fit by the weight', () => {
    expect(styleScore(4, 5)).toBe(4)
    expect(styleScore(4, 0)).toBe(0)
    expect(styleScore(4, 2.5)).toBe(2)
  })

  it('counts every rule in full without a style', () => {
    const full = Object.fromEntries(ruleIds.map((id) => [id, 5]))
    expect(nextChordCandidates({ key: c, previous, weights: full })).toEqual(
      nextChordCandidates({ key: c, previous }),
    )
  })

  it('sends a rule weighted 0 to the bottom', () => {
    const weights = Object.fromEntries(ruleIds.map((id) => [id, 5]))
    weights['secondary.dominant'] = 0
    const list = nextChordCandidates({ key: c, previous, weights })
    const e7 = list.find((s) => chordKey(s.candidate) === 'E7')
    expect(e7?.score).toBe(0)
    expect(list.at(-1)?.score).toBe(0)
  })

  it('lets a style choose which reading leads', () => {
    const metal = blendWeights(BUILT_IN_STYLES, { a: 'metal', mix: 0 })
    const s = nextChordCandidates({ key: c, previous, weights: metal }).find(
      (x) => chordKey(x.candidate) === 'Ab',
    )
    expect(s?.ruleIds[0]).toBe('rock.flat-six')
    expect(s?.tags[0]).toBe('rock')
  })

  it('gives the same ranking for the same input and style', () => {
    const blend = blendWeights(BUILT_IN_STYLES, {
      a: 'rock',
      b: 'metal',
      mix: 0.5,
    })
    const run = () =>
      nextChordCandidates({
        key: key('E minor'),
        previous: [parse('Em')],
        weights: blend,
      })
    expect(run()).toEqual(run())
  })
})

describe('switching style moves the ranking (golden fixture)', () => {
  function rank(row: (typeof styleRankings)[number], style: string): number {
    const weights = blendWeights(BUILT_IN_STYLES, { a: style, mix: 0 })
    const list = nextChordCandidates({
      key: key(row.key),
      previous: [parse(row.previous)],
      weights,
    }).filter((s) => !s.keyChange)
    const wanted = chordKey(parse(row.chord))
    const at = list.findIndex((s) => chordKey(s.candidate) === wanted)
    expect(at, `${row.chord} in ${style}`).toBeGreaterThanOrEqual(0)
    return at
  }

  it.each(styleRankings)(
    '$chord after $previous in $key ranks higher in $higherIn than $lowerIn',
    (row) => {
      expect(rank(row, row.higherIn)).toBeLessThan(rank(row, row.lowerIn))
    },
  )
})
