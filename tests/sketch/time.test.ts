import { describe, expect, it } from 'vitest'
import { layOut } from '../../src/theory'
import {
  DEFAULT_BPM,
  DEFAULT_TIME,
  METER_OPTIONS,
  meterId,
  clampBpm,
  flashesOf,
  loadBpm,
  loadTime,
  saveBpm,
  saveTime,
  secondsOf,
  setBarMeter,
  tempoNote,
} from '../../src/sketch/time'

function memoryStore(): Storage {
  const items = new Map<string, string>()
  return {
    get length() {
      return items.size
    },
    clear: () => items.clear(),
    getItem: (k) => items.get(k) ?? null,
    key: (i) => [...items.keys()][i] ?? null,
    removeItem: (k) => void items.delete(k),
    setItem: (k, v) => void items.set(k, v),
  }
}

const SIX_EIGHT = { num: 6, den: 8 }
const SEVEN_EIGHT = { num: 7, den: 8 }

describe('tempo', () => {
  it('times a chord at a tempo', () => {
    expect(secondsOf({ n: 1, d: 1 }, 120)).toBe(2) // a bar of 4/4 at 120
    expect(secondsOf({ n: 1, d: 4 }, 60)).toBe(1)
    expect(secondsOf({ n: 2, d: 1 }, 100)).toBeCloseTo(4.8)
  })

  it("counts the meter's beat", () => {
    // A bar of 6/8 at ♩. = 60 is two seconds; 7/8 at ♩ = 120 is 1.75.
    expect(secondsOf({ n: 3, d: 4 }, 60, SIX_EIGHT)).toBe(2)
    expect(secondsOf({ n: 7, d: 8 }, 120, SEVEN_EIGHT)).toBe(1.75)
    expect(tempoNote(SIX_EIGHT)).toBe('♩.')
    expect(tempoNote(SEVEN_EIGHT)).toBe('♩')
    expect(tempoNote({ num: 2, den: 2 })).toBe('𝅗𝅥')
  })

  it('keeps the tempo between 40 and 240', () => {
    expect(clampBpm(20)).toBe(40)
    expect(clampBpm(300)).toBe(240)
    expect(clampBpm(97.6)).toBe(98)
    expect(clampBpm(NaN)).toBe(DEFAULT_BPM)
  })

  it('remembers the tempo', () => {
    const store = memoryStore()
    expect(loadBpm(store)).toBe(DEFAULT_BPM)
    saveBpm(132, store)
    expect(loadBpm(store)).toBe(132)
    store.setItem('co-writer:bpm', 'fast')
    expect(loadBpm(store)).toBe(DEFAULT_BPM)
  })
})

describe('time signature', () => {
  it('starts in 4/4 and remembers the meter and bar overrides', () => {
    const store = memoryStore()
    expect(loadTime(store)).toEqual(DEFAULT_TIME)
    const time = setBarMeter(
      { meter: { ...SEVEN_EIGHT, grouping: [3, 2, 2] }, barMeters: {} },
      4,
      { num: 4, den: 4 },
    )
    saveTime(time, store)
    expect(loadTime(store)).toEqual(time)
  })

  it('ignores unreadable saved time', () => {
    const store = memoryStore()
    store.setItem('co-writer:time', '{"meter":{"num":7,"den":6}}')
    expect(loadTime(store)).toEqual(DEFAULT_TIME)
    store.setItem('co-writer:time', 'nonsense')
    expect(loadTime(store)).toEqual(DEFAULT_TIME)
    store.setItem(
      'co-writer:time',
      '{"meter":{"num":3,"den":4},"barMeters":{"2":{"num":"x"},"0":{"num":2,"den":4}}}',
    )
    expect(loadTime(store)).toEqual({
      meter: { num: 3, den: 4 },
      barMeters: {},
    })
  })

  it('clears a bar override set back to the section meter', () => {
    let time = setBarMeter(DEFAULT_TIME, 2, { num: 2, den: 4 })
    expect(time.barMeters).toEqual({ 2: { num: 2, den: 4 } })
    time = setBarMeter(time, 2, { num: 4, den: 4 })
    expect(time.barMeters).toEqual({})
    time = setBarMeter(setBarMeter(time, 3, SIX_EIGHT), 3, undefined)
    expect(time.barMeters).toEqual({})
  })
})

describe('the time-signature picker', () => {
  it('offers each meter, and each grouping of the odd ones', () => {
    expect(METER_OPTIONS.map((o) => o.label)).toEqual([
      '4/4',
      '3/4',
      '2/4',
      '2/2',
      '6/8',
      '9/8',
      '12/8',
      '5/4 (3+2)',
      '5/4 (2+3)',
      '5/8 (2+3)',
      '5/8 (3+2)',
      '7/8 (2+2+3)',
      '7/8 (3+2+2)',
      '7/8 (2+3+2)',
    ])
  })

  it('finds the option for a saved meter, grouped or not', () => {
    const ids = METER_OPTIONS.map((o) => o.id)
    expect(ids).toContain(meterId({ num: 7, den: 8 }))
    expect(meterId({ num: 7, den: 8 })).toBe('7/8:2+2+3')
    expect(meterId({ num: 7, den: 8, grouping: [3, 2, 2] })).toBe('7/8:3+2+2')
    expect(meterId({ num: 6, den: 8 })).toBe('6/8')
  })
})

describe('the beat and bar lights', () => {
  it('flash on every beat a chord covers, the bar light on downbeats', () => {
    // C for six beats then G for two, in 4/4 at 120: a beat is 500 ms.
    const [c, g] = layOut(
      [
        { n: 3, d: 2 },
        { n: 1, d: 2 },
      ],
      DEFAULT_TIME,
    )
    expect(flashesOf(c, 120)).toEqual([
      { ms: 0, strength: 'downbeat' },
      { ms: 500, strength: 'weak' },
      { ms: 1000, strength: 'strong' },
      { ms: 1500, strength: 'weak' },
      { ms: 2000, strength: 'downbeat' },
      { ms: 2500, strength: 'weak' },
    ])
    expect(flashesOf(g, 120)).toEqual([
      { ms: 0, strength: 'strong' },
      { ms: 500, strength: 'weak' },
    ])
  })

  it('flash on the dotted beats in 6/8 and the uneven ones in 7/8', () => {
    const [six] = layOut([undefined], { meter: SIX_EIGHT })
    expect(flashesOf(six, 60, SIX_EIGHT).map((f) => f.ms)).toEqual([0, 1000])
    const [seven] = layOut([undefined], { meter: SEVEN_EIGHT })
    // ♩ = 120: quavers are 250 ms, so 2+2+3 flashes at 0, 500 and 1000.
    expect(flashesOf(seven, 120, SEVEN_EIGHT).map((f) => f.ms)).toEqual([
      0, 500, 1000,
    ])
  })
})
