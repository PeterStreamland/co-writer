import { describe, expect, it } from 'vitest'
import {
  allScales,
  commonScales,
  degreeName,
  degreeLabel,
  enharmonicKey,
  formatNote,
  keyInMode,
  parseNote,
  pickerTonics,
  pitchClass,
  scaleNotes,
  scaleSteps,
  stepLabel,
  type Key,
} from '../../src/theory'
import {
  degreeNames,
  pickerTonics as pickerFixture,
  stepPatterns,
  swaps,
} from '../fixtures/key-picker'
import { majorKeys, minorKeys } from '../fixtures/key-signatures'

function note(text: string) {
  const parsed = parseNote(text)
  if (!parsed) throw new Error(`fixture note ${text} did not parse`)
  return parsed
}

const ascii = (n: { letter: string; accidental: number }) =>
  formatNote(n as never, { ascii: true })

describe('pickerTonics', () => {
  for (const [scale, expected] of Object.entries(pickerFixture)) {
    it(`lists the common spellings for ${scale}`, () => {
      expect(pickerTonics(scale).map(ascii)).toEqual(expected)
    })
  }

  it('offers every pitch class, with one sharp or flat at most, for every scale', () => {
    for (const scale of allScales()) {
      const tonics = pickerTonics(scale.id)
      expect(new Set(tonics.map(pitchClass)).size, scale.id).toBe(12)
      for (const tonic of tonics) {
        expect(Math.abs(tonic.accidental)).toBeLessThanOrEqual(1)
      }
    }
  })
})

describe('enharmonicKey', () => {
  for (const { scale, from, to } of swaps) {
    it(`swaps ${from} ${scale} to ${to ?? 'nothing'}`, () => {
      const swapped = enharmonicKey({ tonic: note(from), mode: scale })
      expect(swapped ? ascii(swapped.tonic) : null).toBe(to)
      if (swapped) expect(swapped.mode).toBe(scale)
    })
  }

  it('swaps back to where it started, for every scale', () => {
    for (const scale of allScales()) {
      for (const tonic of pickerTonics(scale.id)) {
        const key: Key = { tonic, mode: scale.id }
        const swapped = enharmonicKey(key)
        if (!swapped) continue
        expect(pitchClass(swapped.tonic)).toBe(pitchClass(tonic))
        expect(ascii(enharmonicKey(swapped)!.tonic)).toBe(ascii(tonic))
      }
    }
  })

  it('reaches all 30 key signatures from the picker', () => {
    for (const [mode, keys] of [
      ['major', majorKeys],
      ['natural-minor', minorKeys],
    ] as const) {
      const reachable = new Set<string>()
      for (const tonic of pickerTonics(mode)) {
        reachable.add(ascii(tonic))
        const swapped = enharmonicKey({ tonic, mode })
        if (swapped) reachable.add(ascii(swapped.tonic))
      }
      expect([...reachable].sort()).toEqual(keys.map((k) => k.tonic).sort())
    }
  })
})

describe('keyInMode', () => {
  it('keeps the spelling when the new scale can use it', () => {
    const key = keyInMode({ tonic: note('C#'), mode: 'major' }, 'dorian')
    expect(ascii(key.tonic)).toBe('C#')
    expect(key.mode).toBe('dorian')
  })

  it('respells when the new scale would need more than seven', () => {
    // D♭ minor has B𝄫; C♯ minor is the key people write in.
    const key = keyInMode({ tonic: note('Db'), mode: 'major' }, 'natural-minor')
    expect(ascii(key.tonic)).toBe('C#')
  })

  it('keeps both tied spellings', () => {
    const key = keyInMode({ tonic: note('Gb'), mode: 'major' }, 'lydian')
    expect(ascii(key.tonic)).toBe('Gb')
  })
})

describe('scaleSteps', () => {
  for (const [scale, expected] of Object.entries(stepPatterns)) {
    it(`gives the step pattern of ${scale}`, () => {
      expect(scaleSteps(scale).map(stepLabel)).toEqual(expected)
    })
  }

  it('adds up to an octave for every scale', () => {
    for (const scale of allScales()) {
      const steps = scaleSteps(scale.id)
      expect(
        steps.reduce((a, b) => a + b, 0),
        scale.id,
      ).toBe(12)
      expect(
        steps.every((s) => s > 0),
        scale.id,
      ).toBe(true)
    }
  })

  it('labels larger steps in tones and semitones', () => {
    expect([1, 2, 3, 4, 5].map(stepLabel)).toEqual([
      'S',
      'T',
      'T+S',
      '2T',
      '2T+S',
    ])
  })
})

describe('degreeName', () => {
  for (const [scale, expected] of Object.entries(degreeNames)) {
    it(`names the degrees of C ${scale}`, () => {
      const tonic = note('C')
      const actual = scaleNotes(tonic, scale).map((n) => [
        degreeLabel(tonic, n, { ascii: true }),
        degreeName(tonic, n),
      ])
      expect(actual).toEqual(expected)
    })
  }

  it('follows spelling, not pitch', () => {
    // In C, E♭ is the mediant and D♯ the sharpened supertonic.
    expect(degreeName(note('C'), note('Eb'))).toBe('mediant')
    expect(degreeName(note('C'), note('D#'))).toBe('sharpened supertonic')
  })

  it('names the same degree in every key', () => {
    for (const tonic of pickerTonics('major')) {
      expect(
        scaleNotes(tonic, 'major').map((n) => degreeName(tonic, n)),
      ).toEqual(degreeNames.major.map(([, name]) => name))
    }
  })
})

describe('commonScales', () => {
  it('puts the everyday scales first, all real dictionary scales', () => {
    const ids = commonScales().map((s) => s.id)
    expect(ids.slice(0, 2)).toEqual(['major', 'natural-minor'])
    expect(ids).toContain('minor-pentatonic')
    expect(ids).toContain('minor-blues')
    expect(ids).toContain('dorian')
  })
})
