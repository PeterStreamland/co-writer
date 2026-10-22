import { describe, expect, it } from 'vitest'
import {
  ZERO,
  addDur,
  compareDur,
  dur,
  durEquals,
  ratioOf,
  subDur,
  sumDurs,
  timesDur,
} from '../../src/theory/duration'
import { exactBars } from '../fixtures/meters'
import { barLength, parseMeter } from '../../src/theory/meter'

describe('exact durations', () => {
  it('keeps fractions in lowest terms', () => {
    expect(dur(2, 8)).toEqual({ n: 1, d: 4 })
    expect(dur(6, 4)).toEqual({ n: 3, d: 2 })
    expect(dur(0, 5)).toEqual(ZERO)
    expect(dur(3, -4)).toEqual({ n: -3, d: 4 })
  })

  it('adds, subtracts and multiplies exactly', () => {
    expect(addDur(dur(1, 4), dur(1, 8))).toEqual({ n: 3, d: 8 })
    expect(addDur(dur(1, 12), dur(1, 6))).toEqual({ n: 1, d: 4 })
    expect(subDur(dur(7, 8), dur(1, 4))).toEqual({ n: 5, d: 8 })
    expect(timesDur(dur(3, 8), 2)).toEqual({ n: 3, d: 4 })
    expect(ratioOf(dur(3, 4), dur(3, 8))).toBe(2)
  })

  it('compares durations', () => {
    expect(compareDur(dur(1, 3), dur(1, 4))).toBe(1)
    expect(compareDur(dur(2, 8), dur(1, 4))).toBe(0)
    expect(compareDur(dur(1, 12), dur(1, 8))).toBe(-1)
    expect(durEquals({ n: 2, d: 4 }, { n: 1, d: 2 })).toBe(true)
  })

  it('never rounds: a third of a beat three times is a beat', () => {
    const third = dur(1, 12)
    expect(sumDurs([third, third, third])).toEqual({ n: 1, d: 4 })
  })

  it.each(exactBars.map((b) => [b.meter, b] as const))(
    'tuplets sum exactly to a bar of %s',
    (meter, { notes }) => {
      const total = sumDurs(notes.map(([n, d]) => dur(n, d)))
      expect(total).toEqual(barLength(parseMeter(meter)!))
    },
  )
})
