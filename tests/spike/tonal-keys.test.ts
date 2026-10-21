// Phase 0 spike: does tonal spell every key signature correctly?
// Uses tonal directly because it tests the library; Phase 1 wraps it in src/theory.
import { Key } from 'tonal'
import { describe, expect, it } from 'vitest'
import {
  dSharpHarmonicMinor,
  majorKeys,
  minorKeys,
} from '../fixtures/key-signatures'

function signatureOf(accidentals: string): number {
  if (accidentals === '') return 0
  return accidentals[0] === '#' ? accidentals.length : -accidentals.length
}

describe('tonal spells all 15 major key signatures', () => {
  it.each(majorKeys)('$tonic major', ({ tonic, signature, scale }) => {
    const key = Key.majorKey(tonic)
    expect([...key.scale]).toEqual(scale)
    expect(signatureOf(key.keySignature)).toBe(signature)
  })
})

describe('tonal spells all 15 minor key signatures', () => {
  it.each(minorKeys)('$tonic minor', ({ tonic, signature, scale }) => {
    const key = Key.minorKey(tonic)
    expect([...key.natural.scale]).toEqual(scale)
    expect(signatureOf(key.keySignature)).toBe(signature)
  })
})

describe('awkward spellings', () => {
  it('F# major has E#, not F', () => {
    expect(Key.majorKey('F#').scale).toContain('E#')
    expect(Key.majorKey('F#').scale).not.toContain('F')
  })

  it('Cb major has Fb, not E', () => {
    expect(Key.majorKey('Cb').scale).toContain('Fb')
    expect(Key.majorKey('Cb').scale).not.toContain('E')
  })

  it('C# major has B#, not C', () => {
    expect(Key.majorKey('C#').scale).toContain('B#')
  })

  it('Ab minor has Fb as its flat 6th', () => {
    expect(Key.minorKey('Ab').natural.scale[5]).toBe('Fb')
  })

  it('D# harmonic minor has C## (C double sharp)', () => {
    expect([...Key.minorKey('D#').harmonic.scale]).toEqual(dSharpHarmonicMinor)
  })
})
