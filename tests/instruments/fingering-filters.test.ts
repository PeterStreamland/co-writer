import { describe, expect, it } from 'vitest'
import {
  findFingerings,
  formatFrets,
  type Fingering,
  type FingeringOptions,
} from '../../src/instruments/fingering'
import { makeGuitar } from '../../src/instruments/guitar'
import { STANDARD_TUNING } from '../../src/instruments/tunings'
import {
  parseChordSymbol,
  pitchClass,
  type ChordName,
  type Note,
} from '../../src/theory'

const standard = makeGuitar(STANDARD_TUNING)

function chord(symbol: string): ChordName {
  const parsed = parseChordSymbol(symbol)
  if (!parsed) throw new Error(`bad symbol ${symbol}`)
  return parsed
}

function find(symbol: string, options: FingeringOptions, guitar = standard) {
  return findFingerings(guitar, chord(symbol), options)
}

function shapes(found: Fingering[]): string[] {
  return found.map((f) => formatFrets(f.frets))
}

function lowest(f: Fingering): Note {
  return f.notes.find((n) => n !== null) as Note
}

const name = (n: Note) => `${n.letter}${n.accidental}`

describe('fingering filters', () => {
  it('says which inversion each shape is', () => {
    const c = find('C', {})
    expect(c.every((f) => f.inversion === 0)).toBe(true)
    expect(find('C/E', {}).every((f) => f.inversion === 1)).toBe(true)
    // A bass outside the chord is no inversion.
    expect(find('F/G', {}).every((f) => f.inversion === undefined)).toBe(true)
  })

  it('puts the inversion asked for in the bass', () => {
    const first = find('C', { inversion: 1 })
    expect(first.length).toBeGreaterThan(0)
    expect(first.every((f) => name(lowest(f)) === 'E0')).toBe(true)
    expect(first.every((f) => f.inversion === 1)).toBe(true)
    expect(shapes(first)).toContain('032010')
    expect(shapes(first)).not.toContain('x32010')

    const second = find('C', { inversion: 2 })
    expect(second.every((f) => name(lowest(f)) === 'G0')).toBe(true)
    expect(shapes(second)).toContain('332010')

    // G7 in third inversion has F in the bass.
    const third = find('G7', { inversion: 3 })
    expect(third.every((f) => name(lowest(f)) === 'F0')).toBe(true)
    expect(shapes(third)).toContain('1x0001')
  })

  it('keeps the chord’s own spelling in the bass', () => {
    // A♭'s first inversion has C in the bass, its second E♭ (not D♯).
    const second = find('Ab', { inversion: 2 })
    expect(second.every((f) => name(lowest(f)) === 'E-1')).toBe(true)
  })

  it('offers every inversion at once with any', () => {
    const any = find('C', { inversion: 'any' })
    const found = new Set(any.map((f) => f.inversion))
    expect([...found].sort()).toEqual([0, 1, 2])
    expect(shapes(any)).toEqual(
      expect.arrayContaining(['x32010', '032010', '332010']),
    )
    for (const f of any) {
      expect(['C0', 'E0', 'G0']).toContain(name(lowest(f)))
    }
    // A 7th chord has a third inversion too.
    const g7 = new Set(find('G7', { inversion: 'any' }).map((f) => f.inversion))
    expect([...g7].sort()).toEqual([0, 1, 2, 3])
  })

  it('replaces a slash chord’s bass when an inversion is asked for', () => {
    const shapesFor = shapes(find('C/E', { inversion: 0 }))
    expect(shapesFor).toContain('x32010')
    expect(shapesFor).not.toContain('032010')
  })

  it('refuses an inversion the chord doesn’t have', () => {
    expect(() => find('C', { inversion: 3 })).toThrow(RangeError)
    expect(() => find('C', { inversion: -1 })).toThrow(RangeError)
    expect(() => find('C', { inversion: 1.5 })).toThrow(RangeError)
  })

  it('sounds only the strings asked for', () => {
    const top = [2, 3, 4, 5]
    for (const symbol of ['C', 'D', 'G7', 'Am']) {
      const found = find(symbol, { strings: top })
      expect(found.length, symbol).toBeGreaterThan(0)
      for (const f of found) {
        expect(f.frets[0]).toBeNull()
        expect(f.frets[1]).toBeNull()
      }
    }
    expect(shapes(find('D', { strings: top }))).toContain('xx0232')
    // The first inversion of C on the top four: E G C E.
    expect(shapes(find('C', { strings: top, inversion: 1 }))).toContain(
      'xx2010',
    )
    // Strings needn't be next to each other: the low E and the top three.
    const spread = find('G', { strings: [0, 3, 4, 5] })
    expect(shapes(spread)).toContain('3xx003')
  })

  it('refuses strings the guitar doesn’t have', () => {
    expect(() => find('C', { strings: [] })).toThrow(RangeError)
    expect(() => find('C', { strings: [6] })).toThrow(RangeError)
    expect(() => find('C', { strings: [-1, 2] })).toThrow(RangeError)
    expect(() => find('C', { strings: [1.5] })).toThrow(RangeError)
  })

  it('turns open strings off', () => {
    const fretted = find('C', { openStrings: false })
    expect(fretted.length).toBeGreaterThan(0)
    for (const f of fretted) expect(f.frets).not.toContain(0)
    expect(shapes(fretted)[0]).toBe('x35553')
    // With a capo, the capo's fret counts as open.
    const capo = makeGuitar(STANDARD_TUNING, { capo: 2 })
    const a = find('A', { openStrings: false }, capo)
    expect(a.length).toBeGreaterThan(0)
    for (const f of a) expect(f.frets).not.toContain(2)
    expect(shapes(find('A', {}, capo))).toContain('542225')
    expect(shapes(a)).not.toContain('542225')
  })

  it('leaves the 5th out when asked', () => {
    const c = find('C', { omitFifth: true })
    expect(c.length).toBeGreaterThan(0)
    for (const f of c) {
      expect(f.notes.some((n) => n && name(n) === 'G0')).toBe(false)
    }
    expect(shapes(c)).toContain('x32x1x')
    expect(shapes(c)).not.toContain('x32010')
    // Asked for, a missing 5th costs nothing.
    for (const f of c) {
      expect(f.costs.some((cost) => cost.rule === 'omitted-tone')).toBe(false)
    }
    // A 7th chord without its 5th: C E B♭, as x3231x.
    expect(shapes(find('C7', { omitFifth: true }))).toContain('x3231x')
  })

  it('keeps a 5th that a chord needs or that is asked for in the bass', () => {
    // A power chord is all root and 5th.
    expect(shapes(find('C5', { omitFifth: true }))).toContain('x355xx')
    // A diminished chord's 5th isn't perfect, so it stays.
    const dim = find('Bdim', { omitFifth: true })
    expect(dim.every((f) => f.notes.some((n) => n && name(n) === 'F0'))).toBe(
      true,
    )
    // C/G keeps G in the bass, and nowhere else.
    const slash = find('C/G', { omitFifth: true })
    expect(slash.length).toBeGreaterThan(0)
    for (const f of slash) {
      const gs = f.notes.filter((n) => n && pitchClass(n) === 7)
      expect(name(lowest(f))).toBe('G0')
      expect(gs).toHaveLength(1)
    }
    // With every inversion, no shape has the 5th in the bass.
    const any = find('C', { inversion: 'any', omitFifth: true })
    expect(new Set(any.map((f) => f.inversion))).toEqual(new Set([0, 1]))
  })
})
