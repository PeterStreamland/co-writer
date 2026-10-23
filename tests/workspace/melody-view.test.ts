import { describe, expect, it } from 'vitest'
import { dur, layOut, typeMelody } from '../../src/theory'
import { melodyAlong } from '../../src/workspace/melody-view'

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
