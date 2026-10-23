import { describe, expect, it } from 'vitest'
import {
  dur,
  formatNote,
  layOut,
  parseNote,
  typeMelody,
} from '../../src/theory'
import { melodyAlong, rangeFromSetting } from '../../src/workspace/melody-view'

describe('the melody with the chords', () => {
  it('puts each note over the chord it starts under', () => {
    // Two chords, a bar and two beats, in 4/4.
    const timing = layOut([undefined, dur(1, 2)], {
      meter: { num: 4, den: 4 },
    })
    const melody = typeMelody('E4 - - G A B C', dur(1, 4)).notes
    const along = melodyAlong(melody, timing)
    expect(along.map((n) => n.step)).toEqual([0, 0, 1, 1])
    // C starts at 1½ bars, after the last chord: it plays only alone.
    expect(along.map((n) => n.ref)).toEqual([0, 1, 2, 3])
    expect(along[0].length).toEqual(dur(3, 4))
  })
})

describe('the melody range', () => {
  const text = (r: ReturnType<typeof rangeFromSetting>) =>
    `${formatNote(r.low)}–${formatNote(r.high)}`
  it('is tenor, C3–A4, unless set', () => {
    expect(text(rangeFromSetting())).toBe('C3–A4')
    expect(text(rangeFromSetting({ preset: 'soprano' }))).toBe('C4–A5')
  })
  it('takes your own notes, if the low one is lower', () => {
    const low = parseNote('D3')!
    const high = parseNote('D5')!
    expect(text(rangeFromSetting({ preset: 'custom', low, high }))).toBe(
      'D3–D5',
    )
    expect(
      text(rangeFromSetting({ preset: 'custom', low: high, high: low })),
    ).toBe('C3–A4')
  })
})
