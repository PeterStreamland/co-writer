import { describe, expect, it } from 'vitest'
import {
  counterpoint,
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
  counterpointLine,
  counterpointRows,
  harmonyLook,
  harmonyRows,
  melodyAlong,
  notesByBar,
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
      expect(row.notes).toEqual(
        harmonise(ctx, row.id).notes.map((n, place) => ({ ...n, place })),
      )
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

  it('shows your own notes in a row, and counts them', () => {
    const edits = {
      '3rd-above': [
        {
          at: ctx.melody[1].onset,
          under: ctx.melody[1].note,
          note: parseNote('C5')!,
        },
        { at: ctx.melody[2].onset, under: ctx.melody[2].note },
        // Under a melody note that has since changed: it no longer applies.
        {
          at: ctx.melody[3].onset,
          under: parseNote('B4')!,
          note: parseNote('D5')!,
        },
      ],
    }
    const [thirds, counter] = harmonyRows(
      ['3rd-above', 'counter'],
      ctx,
      timing,
      edits,
    )
    expect(thirds.edited).toBe(2)
    expect(counter.edited).toBe(0)
    expect(thirds.notes.map((n) => n.place)).toEqual([0, 1, 3, 4, 5, 6, 7])
    expect(formatNote(thirds.notes[1].note)).toBe('C5')
    expect(thirds.notes[1].edited).toBe(true)
    expect(thirds.along.map((n) => n.note)).toEqual(
      thirds.notes.map((n) => n.note),
    )
  })

  it('has no rows with no harmonies chosen', () => {
    expect(harmonyRows([], ctx, timing)).toEqual([])
  })
})

// The Harmony cards show their notes bar by bar (Phase 7 task 15).
describe('notes bar by bar', () => {
  const at = (n: number, d: number) => ({ n, d })
  const note = (name: string, onset: { n: number; d: number }) => ({
    note: parseNote(name)!,
    onset,
    length: at(1, 4),
  })

  it('groups notes by the bar they start in, keeping each one’s place', () => {
    const notes = [
      note('G4', at(0, 1)),
      note('F4', at(1, 4)),
      note('A4', at(1, 1)),
      note('B4', at(9, 4)),
    ]
    const bars = notesByBar(notes, { meter: { num: 4, den: 4 } })
    expect(bars.map((b) => b.bar)).toEqual([1, 2, 3])
    expect(bars.map((b) => b.notes.map((n) => formatNote(n.note)))).toEqual([
      ['G4', 'F4'],
      ['A4'],
      ['B4'],
    ])
    expect(bars[2].notes[0].place).toBe(3)
  })

  it('follows bars of their own length, and skips empty bars', () => {
    // A 3/4 bar 1, then 4/4: a note at beat 4 falls in bar 2.
    const time = {
      meter: { num: 4, den: 4 },
      barMeters: { 1: { num: 3, den: 4 } },
    }
    const bars = notesByBar([note('C4', at(3, 4)), note('D4', at(11, 4))], time)
    expect(bars.map((b) => b.bar)).toEqual([2, 4])
    expect(notesByBar([], time)).toEqual([])
  })
})

describe('counterpoint lines as rows', () => {
  const key = { tonic: parseNote('C')!, mode: 'major' }
  const time = { meter: { num: 4, den: 4 } }
  const timing = layOut([undefined, undefined], time)
  const ctx: HarmonyContext = {
    melody: typeMelody('E4 F4 G4 A4 G4 F4 E4 D4 C4', dur(1, 4)).notes,
    key,
    chords: ['C', 'G7'].map((s, i) => ({
      chord: parseChordSymbol(s)!,
      key,
      start: timing[i].start,
      length: timing[i].length,
    })),
    time,
  }

  it('makes a row for each line kept, and none for an unknown id', () => {
    const rows = counterpointRows(
      ['2-below-strict', 'no-such', '1-above-freer'],
      ctx,
      timing,
    )
    expect(rows.map((r) => r.id)).toEqual(['2-below-strict', '1-above-freer'])
    expect(rows[0].label).toBe('Counterpoint: Two against one, below, strict')
    expect(rows[0].notes.map((n) => n.note)).toEqual(
      counterpoint(ctx, {
        species: 2,
        side: 'below',
        mode: 'strict',
      }).notes.map((n) => n.note),
    )
    // Notes past the last chord play only without the chords.
    expect(rows[1].along.length).toBeGreaterThan(0)
    for (const n of rows[1].along) {
      expect(n.note).toEqual(rows[1].notes[n.ref].note)
    }
  })

  it('works a line out once for the same melody', () => {
    const o = { species: 3, side: 'above', mode: 'strict' } as const
    expect(counterpointLine(ctx, o)).toBe(counterpointLine(ctx, o))
  })

  it('shows your own notes in a row, and counts them', () => {
    const line = counterpointLine(ctx, {
      species: 1,
      side: 'below',
      mode: 'strict',
    }).notes
    const edits = {
      '1-below-strict': [
        {
          at: line[2].onset,
          under: ctx.melody[2].note,
          note: parseNote('C3')!,
        },
      ],
    }
    const [row] = counterpointRows(['1-below-strict'], ctx, timing, edits)
    expect(row.edited).toBe(1)
    expect(row.notes[2].edited).toBe(true)
    expect(formatNote(row.notes[2].note)).toBe('C3')
  })

  it('has no rows without a melody', () => {
    expect(
      counterpointRows(['1-below-strict'], { ...ctx, melody: [] }, timing),
    ).toEqual([])
  })
})
