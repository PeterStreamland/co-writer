import { describe, expect, it } from 'vitest'
import { dur } from '../../src/theory/duration'
import {
  METERS,
  accentAt,
  barLength,
  beatsOf,
  countUnit,
  groupingOf,
  layOut,
  lengthChoices,
  lengthLabel,
  meterLabel,
  parseMeter,
  tempoUnit,
  type Meter,
} from '../../src/theory/meter'
import { meters } from '../fixtures/meters'

function meterOf(text: string, grouping?: number[]): Meter {
  const m = parseMeter(text)
  if (!m) throw new Error(`not a meter: ${text}`)
  return grouping ? { ...m, grouping } : m
}

describe('meters (golden)', () => {
  it.each(
    meters.map((f) => [
      f.meter + (f.grouping ? ` as ${f.grouping.join('+')}` : ''),
      f,
    ]),
  )('%s', (_, f) => {
    const m = meterOf(f.meter, f.grouping)
    expect(barLength(m)).toEqual(f.bar)
    const pulse = dur(1, m.den)
    expect(
      beatsOf(m).map((b) => [
        b.onset.n * (pulse.d / b.onset.d) + 1,
        b.strength,
      ]),
    ).toEqual(f.beats)
    const count = countUnit(m)
    expect({ ...count.length, name: count.name }).toEqual(f.count)
    expect(tempoUnit(m)).toEqual(f.tempo)
  })

  it('offers every fixture meter in the picker', () => {
    const offered = METERS.map((m) => `${m.num}/${m.den}`)
    for (const f of meters) expect(offered).toContain(f.meter)
  })

  it('7/8 groupings move the strong beats', () => {
    const strong = (g: number[]) =>
      beatsOf(meterOf('7/8', g))
        .filter((b) => b.strength !== 'weak')
        .map((b) => b.onset)
    expect(strong([2, 2, 3])).not.toEqual(strong([3, 2, 2]))
  })

  it('rejects a grouping that does not fill the bar', () => {
    expect(groupingOf({ num: 7, den: 8, grouping: [3, 3] })).toEqual([2, 2, 3])
  })

  it('reads and names meters', () => {
    expect(parseMeter('6/8')).toEqual({ num: 6, den: 8 })
    expect(parseMeter('7/6')).toBeUndefined()
    expect(parseMeter('four')).toBeUndefined()
    expect(meterLabel(meterOf('4/4'))).toBe('4/4')
    expect(meterLabel(meterOf('7/8'))).toBe('7/8 (2+2+3)')
    expect(meterLabel(meterOf('7/8', [3, 2, 2]))).toBe('7/8 (3+2+2)')
    expect(meterLabel(meterOf('5/4'))).toBe('5/4 (3+2)')
  })
})

describe('accents', () => {
  const four = meterOf('4/4')
  const six = meterOf('6/8')
  it.each([
    [four, dur(0, 1), 'downbeat'],
    [four, dur(1, 4), 'weak'],
    [four, dur(1, 2), 'strong'],
    [four, dur(1, 8), 'off'],
    [four, dur(1, 12), 'off'],
    [six, dur(3, 8), 'strong'],
    [six, dur(1, 8), 'off'],
    [six, dur(1, 4), 'off'],
  ] as const)('%o at %o is %s', (m, at, accent) => {
    expect(accentAt(m, at)).toBe(accent)
  })

  it('wraps into the next bar', () => {
    expect(accentAt(four, dur(3, 2))).toBe('strong')
    expect(accentAt(six, dur(9, 8))).toBe('strong')
  })
})

describe('chord lengths', () => {
  const labels = (m: Meter) => lengthChoices(m).map((d) => lengthLabel(m, d))

  it('offers beats up to a bar, then bars (4/4 as before)', () => {
    expect(labels(meterOf('4/4'))).toEqual([
      '1 beat',
      '2 beats',
      '3 beats',
      '1 bar',
      '1½ bars',
      '2 bars',
      '3 bars',
      '4 bars',
    ])
    expect(lengthChoices(meterOf('4/4')).map((d) => (d.n / d.d) * 4)).toEqual([
      1, 2, 3, 4, 6, 8, 12, 16,
    ])
  })

  it('counts each meter in its own unit', () => {
    expect(labels(meterOf('3/4'))).toEqual([
      '1 beat',
      '2 beats',
      '1 bar',
      '2 bars',
      '3 bars',
      '4 bars',
    ])
    expect(labels(meterOf('6/8'))).toEqual([
      '1 beat',
      '1 bar',
      '1½ bars',
      '2 bars',
      '3 bars',
      '4 bars',
    ])
    expect(labels(meterOf('7/8')).slice(0, 7)).toEqual([
      '1 eighth',
      '2 eighths',
      '3 eighths',
      '4 eighths',
      '5 eighths',
      '6 eighths',
      '1 bar',
    ])
  })

  it('names lengths that are not a whole number of beats', () => {
    expect(lengthLabel(meterOf('6/8'), dur(1, 2))).toBe('4 eighths')
    expect(lengthLabel(meterOf('4/4'), dur(1, 8))).toBe('1 eighth')
    expect(lengthLabel(meterOf('4/4'), dur(3, 16))).toBe('3 sixteenths')
    expect(lengthLabel(meterOf('4/4'), dur(1, 6))).toBe('1/6')
  })
})

describe('laying chords out in bars', () => {
  const four = meterOf('4/4')
  const where = (
    lengths: (ReturnType<typeof dur> | undefined)[],
    barMeters: Record<number, Meter> = {},
    meter = four,
  ) =>
    layOut(lengths, { meter, barMeters }).map((p) => ({
      bar: p.bar,
      beat: p.beat,
      accent: p.accent,
      length: p.length,
    }))

  it('gives an unset chord one bar', () => {
    expect(where([undefined, undefined])).toEqual([
      { bar: 1, beat: 1, accent: 'downbeat', length: dur(1, 1) },
      { bar: 2, beat: 1, accent: 'downbeat', length: dur(1, 1) },
    ])
  })

  it('places chords mid-bar on their beat', () => {
    expect(where([dur(1, 2), dur(1, 4), dur(1, 4), undefined])).toEqual([
      { bar: 1, beat: 1, accent: 'downbeat', length: dur(1, 2) },
      { bar: 1, beat: 3, accent: 'strong', length: dur(1, 4) },
      { bar: 1, beat: 4, accent: 'weak', length: dur(1, 4) },
      { bar: 2, beat: 1, accent: 'downbeat', length: dur(1, 1) },
    ])
  })

  it('places a chord off the beat with no beat number', () => {
    const [, second] = where([dur(1, 8), undefined])
    expect(second).toEqual({
      bar: 1,
      beat: undefined,
      accent: 'off',
      length: dur(1, 1),
    })
  })

  it('obeys a bar-level meter override inside a section', () => {
    // A bar of 2/4 in a 4/4 verse: the chord in bar 2 lasts two beats.
    const two = meterOf('2/4')
    expect(where([undefined, undefined, undefined], { 2: two })).toEqual([
      { bar: 1, beat: 1, accent: 'downbeat', length: dur(1, 1) },
      { bar: 2, beat: 1, accent: 'downbeat', length: dur(1, 2) },
      { bar: 3, beat: 1, accent: 'downbeat', length: dur(1, 1) },
    ])
  })

  it('alternates 7/8 and 4/4', () => {
    const seven = meterOf('7/8')
    const placed = layOut([undefined, undefined, dur(1, 4), undefined], {
      meter: seven,
      barMeters: { 2: four, 4: four },
    })
    expect(placed.map((p) => [p.bar, p.beat, p.length])).toEqual([
      [1, 1, dur(7, 8)],
      [2, 1, dur(1, 1)],
      [3, 1, dur(1, 4)],
      // Two quavers into 7/8 (2+2+3): its second beat, lasting a bar.
      [3, 2, dur(7, 8)],
    ])
  })

  it('lists the beats each chord covers, across bar lines', () => {
    const [first, second] = layOut([dur(3, 2), dur(1, 2)], {
      meter: four,
      barMeters: {},
    })
    expect(first.beats.map((b) => [b.bar, b.beat, b.strength])).toEqual([
      [1, 1, 'downbeat'],
      [1, 2, 'weak'],
      [1, 3, 'strong'],
      [1, 4, 'weak'],
      [2, 1, 'downbeat'],
      [2, 2, 'weak'],
    ])
    expect(second.beats.map((b) => [b.bar, b.beat, b.strength])).toEqual([
      [2, 3, 'strong'],
      [2, 4, 'weak'],
    ])
    expect(second.start).toEqual(dur(3, 2))
  })
})
