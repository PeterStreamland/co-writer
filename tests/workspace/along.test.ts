import { describe, expect, it } from 'vitest'
import { lightsAt, type AlongNote } from '../../src/workspace/along'

const C4 = { letter: 'C', accidental: 0, octave: 4 } as const
const note = (
  ref: number,
  n: number,
  d: number,
  length: number,
): AlongNote => ({
  step: 0,
  onset: { n, d },
  length: { n: length, d: 4 },
  note: C4,
  ref,
})

// Each row keeps its own light until its own next note (Phase 7 task 13).
describe('the light on each row', () => {
  // A melody of a held half note then a quarter; a row of quarters.
  const melody = [note(0, 0, 1, 2), note(1, 3, 4, 1)]
  const row = [note(0, 0, 1, 1), note(1, 1, 4, 1), note(2, 1, 2, 1)]
  const voices = { melody, r1: row }

  it('lights the note sounding on each row at once', () => {
    expect(lightsAt(voices, { n: 0, d: 1 })).toEqual({
      melody: melody[0],
      r1: row[0],
    })
  })

  it('keeps a held note lit while another row moves on', () => {
    const lit = lightsAt(voices, { n: 1, d: 4 })
    expect(lit.melody).toBe(melody[0])
    expect(lit.r1).toBe(row[1])
  })

  it('keeps the last note lit through a rest until the next takes over', () => {
    // The row's last note ends at 3/4, and the melody's next starts then.
    const lit = lightsAt(voices, { n: 3, d: 4 })
    expect(lit.r1).toBe(row[2])
    expect(lit.melody).toBe(melody[1])
  })

  it('lights nothing on a row before its first note', () => {
    const late = { r2: [note(0, 1, 2, 1)] }
    expect(lightsAt(late, { n: 1, d: 4 })).toEqual({})
  })
})
