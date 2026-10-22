import { describe, expect, it } from 'vitest'
import { frequency } from '../../src/audio/pitch'
import { parseNote } from '../../src/theory'

const hz = (text: string) => frequency(parseNote(text)!)

describe('frequency', () => {
  it('tunes A4 to 440 Hz and middle C to 261.63 Hz', () => {
    expect(hz('A4')).toBe(440)
    expect(hz('C4')).toBeCloseTo(261.63, 2)
    expect(hz('A3')).toBe(220)
  })

  it('sounds enharmonic spellings the same', () => {
    expect(hz('C#4')).toBeCloseTo(hz('Db4'), 9)
    expect(hz('Cb4')).toBeCloseTo(hz('B3'), 9)
    expect(hz('B#3')).toBeCloseTo(hz('C4'), 9)
  })

  it('refuses a note with no octave', () => {
    expect(() => hz('C')).toThrow()
  })
})
