import { describe, expect, it } from 'vitest'
import {
  allScales,
  describeNumeral,
  diatonicChords,
  hasDiatonicChords,
  parseNote,
  romanNumeral,
  type Key,
} from '../../src/theory'
import { majorKeys, minorKeys } from '../fixtures/key-signatures'
import {
  numeralCases,
  numeralDescriptions,
  numeralsOnC,
  triadsInKey,
} from '../fixtures/numerals'

function note(text: string) {
  const parsed = parseNote(text)
  if (!parsed) throw new Error(`fixture note ${text} did not parse`)
  return parsed
}

function key(tonic: string, mode: string): Key {
  return { tonic: note(tonic), mode }
}

function numerals(k: Key, kind: 'triad' | 'seventh'): string[] {
  return diatonicChords(k, kind).map((c) => romanNumeral(k, c).numeral)
}

describe('diatonic numerals', () => {
  it.each(Object.entries(numeralsOnC))('C %s', (mode, { triads, sevenths }) => {
    expect(numerals(key('C', mode), 'triad')).toEqual(triads)
    expect(numerals(key('C', mode), 'seventh')).toEqual(sevenths)
  })

  it.each(triadsInKey)('$tonic $mode', ({ tonic, mode, triads }) => {
    expect(numerals(key(tonic, mode), 'triad')).toEqual(triads)
  })

  it('labels every diatonic chord of every key as diatonic', () => {
    const tonics = [...majorKeys, ...minorKeys].map((k) => k.tonic)
    const modes = allScales()
      .map((s) => s.id)
      .filter(hasDiatonicChords)
    for (const tonic of tonics) {
      for (const mode of modes) {
        const k = key(tonic, mode)
        for (const kind of ['triad', 'seventh', 'ninth', 'sus4'] as const) {
          for (const chord of diatonicChords(k, kind)) {
            expect(romanNumeral(k, chord).kind, `${tonic} ${mode}`).toBe(
              'diatonic',
            )
          }
        }
      }
    }
  })

  it('keeps every function through an enharmonic key swap', () => {
    for (const [sharp, flat, mode] of [
      ['F#', 'Gb', 'major'],
      ['C#', 'Db', 'major'],
      ['D#', 'Eb', 'natural-minor'],
      ['G#', 'Ab', 'dorian'],
    ]) {
      for (const kind of ['triad', 'seventh'] as const) {
        expect(numerals(key(sharp, mode), kind)).toEqual(
          numerals(key(flat, mode), kind),
        )
      }
    }
    // V7/vi and ♭VI, spelled in each key
    expect(romanNumeral(key('F#', 'major'), chordOf('A#', '7')).numeral).toBe(
      'V7/vi',
    )
    expect(romanNumeral(key('Gb', 'major'), chordOf('Bb', '7')).numeral).toBe(
      'V7/vi',
    )
    expect(romanNumeral(key('F#', 'major'), chordOf('D', 'M')).numeral).toBe(
      '♭VI',
    )
    expect(romanNumeral(key('Gb', 'major'), chordOf('Ebb', 'M')).numeral).toBe(
      '♭VI',
    )
  })
})

function chordOf(root: string, quality: string, bass?: string) {
  return bass === undefined
    ? { root: note(root), quality }
    : { root: note(root), quality, bass: note(bass) }
}

describe('numeral cases', () => {
  it.each(numeralCases)(
    '$root$quality/$bass in $tonic $mode is $numeral',
    (c) => {
      const k = key(c.tonic, c.mode)
      const chord = chordOf(c.root, c.quality, c.bass)
      const result = romanNumeral(k, chord)
      expect(result.numeral).toBe(c.numeral)
      expect(result.kind).toBe(c.kind)
      expect(romanNumeral(k, chord, { slash: true }).numeral).toBe(
        c.slash ?? c.numeral,
      )
      if (c.sources) {
        expect(result.sources?.map((s) => s.mode)).toEqual(c.sources)
        for (const source of result.sources ?? []) {
          expect(source.tonic).toEqual(k.tonic)
        }
      } else {
        expect(result.sources).toBeUndefined()
      }
    },
  )

  it('names the target of a secondary chord', () => {
    const result = romanNumeral(key('C', 'major'), chordOf('G#', 'dim7'))
    expect(result.target).toEqual({
      degree: 6,
      numeral: 'vi',
      role: 'leading-note',
    })
  })

  it('rejects an unknown quality', () => {
    expect(() => romanNumeral(key('C', 'major'), chordOf('C', 'xyz'))).toThrow()
  })
})

describe('describeNumeral', () => {
  it.each(numeralDescriptions)('$text', (c) => {
    const k = key(c.tonic, c.mode)
    expect(
      describeNumeral(k, romanNumeral(k, chordOf(c.root, c.quality))),
    ).toBe(c.text)
  })
})
