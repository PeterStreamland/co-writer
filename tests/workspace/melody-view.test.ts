import { describe, expect, it } from 'vitest'
import {
  dur,
  formatNote,
  harmonise,
  layOut,
  parseChordSymbol,
  parseNote,
  typeMelody,
  type HarmonyContext,
} from '../../src/theory'
import {
  harmonyLook,
  harmonyRows,
  melodyAlong,
  rangeFromSetting,
} from '../../src/workspace/melody-view'

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

describe('rows for the harmonies (Phase 7 task 11)', () => {
  const time = { meter: { num: 4, den: 4 } }
  const timing = layOut([undefined, undefined], time)
  const key = { tonic: parseNote('C')!, mode: 'major' }
  const ctx: HarmonyContext = {
    melody: typeMelody('E4 F4 G4 A4 G4 F4 E4 D4', dur(1, 4)).notes,
    key,
    chords: ['C', 'G7'].map((s, i) => ({
      chord: parseChordSymbol(s)!,
      key,
      start: timing[i].start,
      length: timing[i].length,
    })),
    time,
  }

  it('gives each harmony playing a row of its own, in the order chosen', () => {
    const rows = harmonyRows(['counter', '3rd-above', 'no-such'], ctx, timing)
    expect(rows.map((r) => r.id)).toEqual(['counter', '3rd-above'])
    expect(rows.map((r) => r.label)).toEqual(['Countermelody', '3rds above'])
    for (const row of rows) {
      expect(row.notes).toEqual(harmonise(ctx, row.id).notes)
    }
  })

  it('plays each row along with a look of its own, note by note', () => {
    const [counter, thirds] = harmonyRows(['counter', '3rd-above'], ctx, timing)
    expect(new Set(counter.along.map((n) => n.look))).toEqual(
      new Set([harmonyLook('counter')]),
    )
    expect(harmonyLook('counter')).not.toBe(harmonyLook('3rd-above'))
    expect(thirds.along.map((n) => n.ref)).toEqual([0, 1, 2, 3, 4, 5, 6, 7])
    expect(thirds.along.map((n) => n.note)).toEqual(
      thirds.notes.map((n) => n.note),
    )
    expect(thirds.along.map((n) => n.step)).toEqual([0, 0, 0, 0, 1, 1, 1, 1])
  })

  it('has no rows with no harmonies chosen', () => {
    expect(harmonyRows([], ctx, timing)).toEqual([])
  })
})
