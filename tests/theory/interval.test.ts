import { Interval as TonalInterval, Note as TonalNote } from 'tonal'
import { describe, expect, it } from 'vitest'
import {
  degreeLabel,
  formatInterval,
  formatNote,
  intervalBetween,
  parseInterval,
  parseNote,
  semitones,
  transpose,
  transposeDown,
} from '../../src/theory'
import {
  degreeLabels,
  intervals,
  transpositions,
} from '../fixtures/notes-and-intervals'

function note(text: string) {
  const parsed = parseNote(text)
  if (!parsed) throw new Error(`fixture note ${text} did not parse`)
  return parsed
}

function interval(text: string) {
  const parsed = parseInterval(text)
  if (!parsed) throw new Error(`fixture interval ${text} did not parse`)
  return parsed
}

describe('parseInterval and formatInterval', () => {
  it('reads quality and number', () => {
    expect(parseInterval('M3')).toEqual({ quality: 'M', number: 3 })
    expect(parseInterval('P5')).toEqual({ quality: 'P', number: 5 })
    expect(parseInterval('dd7')).toEqual({ quality: 'dd', number: 7 })
    expect(parseInterval('A11')).toEqual({ quality: 'A', number: 11 })
  })

  it.each(['M4', 'P3', 'm5', 'P0', 'X3', '3', 'M', 'mm3', 'M-3'])(
    'rejects %j',
    (text) => {
      expect(parseInterval(text)).toBeUndefined()
    },
  )

  it('round-trips', () => {
    for (const text of ['P1', 'A1', 'm2', 'M3', 'd5', 'A4', 'd7', 'P8', 'M9']) {
      expect(formatInterval(interval(text))).toBe(text)
    }
  })
})

describe('semitones', () => {
  it.each([
    ['P1', 0],
    ['A1', 1],
    ['m2', 1],
    ['A2', 3],
    ['m3', 3],
    ['d4', 4],
    ['A4', 6],
    ['d5', 6],
    ['d7', 9],
    ['M7', 11],
    ['P8', 12],
    ['m9', 13],
    ['P11', 17],
    ['M13', 21],
    ['dd7', 8],
    ['AA4', 7],
  ])('%s spans %i semitones', (text, size) => {
    expect(semitones(interval(text))).toBe(size)
  })
})

describe('intervalBetween', () => {
  it.each(intervals)('%s up to %s is %s', (from, to, expected) => {
    expect(formatInterval(intervalBetween(note(from), note(to)))).toBe(expected)
  })

  it('measures compound intervals when both notes have octaves', () => {
    const between = (a: string, b: string) =>
      formatInterval(intervalBetween(note(a), note(b)))
    expect(between('C4', 'C5')).toBe('P8')
    expect(between('C4', 'D5')).toBe('M9')
    expect(between('C3', 'F4')).toBe('P11')
    expect(between('B3', 'C4')).toBe('m2')
    expect(between('Cb4', 'B#3')).toBe('dd2')
  })

  it('matches tonal for every pair of spellings from ♭ to ♯', () => {
    const names = [...'CDEFGAB'].flatMap((l) => [`${l}b`, l, `${l}#`])
    for (const a of names) {
      for (const b of names) {
        const ours = formatInterval(intervalBetween(note(a), note(b)))
        // tonal writes M3 as 3M.
        const theirs = TonalInterval.distance(a, b).replace(
          /^(\d+)(\w+)$/,
          '$2$1',
        )
        expect(ours, `${a} to ${b}`).toBe(theirs)
      }
    }
  })
})

describe('transpose', () => {
  it.each(transpositions)('%s up a %s is %s', (from, by, expected) => {
    expect(
      formatNote(transpose(note(from), interval(by)), { ascii: true }),
    ).toBe(expected)
  })

  it.each(transpositions)('%s down from %s gets back', (from, by, to) => {
    expect(transposeDown(note(to), interval(by))).toEqual(note(from))
  })

  it('matches tonal for every spelling and simple or compound interval', () => {
    const names = [...'CDEFGAB'].flatMap((l) => [`${l}b`, l, `${l}#`])
    const sizes = ['P1', 'm2', 'M2', 'A2', 'm3', 'M3', 'P4', 'A4', 'd5', 'P5']
    sizes.push('m6', 'M6', 'd7', 'm7', 'M7', 'P8', 'M9', 'P11', 'M13')
    for (const name of names) {
      for (const size of sizes) {
        const ours = transpose(note(`${name}4`), interval(size))
        const tonalSize = size.replace(/^(\w+?)(\d+)$/, '$2$1')
        const theirs = TonalNote.transpose(`${name}4`, tonalSize)
        expect(formatNote(ours, { ascii: true }), `${name}4 + ${size}`).toBe(
          theirs,
        )
      }
    }
  })

  it('leaves the octave off when the note has none', () => {
    expect(transpose(note('A'), interval('M3'))).toEqual(note('C#'))
  })
})

describe('degreeLabel', () => {
  it.each(degreeLabels)('in %s, %s is %s', (tonic, n, label) => {
    expect(degreeLabel(note(tonic), note(n))).toBe(label)
  })

  it('can write typed characters instead of symbols', () => {
    expect(degreeLabel(note('C'), note('Eb'), { ascii: true })).toBe('b3')
    expect(degreeLabel(note('C'), note('D#'), { ascii: true })).toBe('#2')
  })
})
