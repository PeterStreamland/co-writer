import { describe, expect, it } from 'vitest'
import { dur, formatNote, parseMeter, parseNote } from '../../src/theory'
import { beatsWords, melodyStrips } from '../../src/workspace/melody-strips'
import { strips } from '../fixtures/melody-strips'

const d = (f: { n: number; d: number }) => dur(f.n, f.d)

describe('the melody lane as time strips (Phase 7 task 6)', () => {
  for (const f of strips) {
    it(f.name, () => {
      const notes = f.notes.map((n) => ({
        note: parseNote(n.note)!,
        onset: d(n.onset),
        length: d(n.length),
        ...(n.holds ? { holds: n.holds.map(d) } : {}),
      }))
      const out = melodyStrips(notes, { meter: parseMeter(f.meter)! }, f.bars)
      expect(out.map((s) => s.bar)).toEqual(f.strips.map((s) => s.bar))
      out.forEach((s, i) => {
        const want = f.strips[i]
        expect(s.count).toBe(want.count)
        expect(
          s.segments.map((g) => {
            const base = { kind: g.kind, from: g.from, to: g.to }
            if (g.kind !== 'note') return base
            return {
              ...base,
              note: formatNote(notes[g.index].note),
              ...(g.tiedIn ? { tiedIn: true } : {}),
              ...(g.tiedOut ? { tiedOut: true } : {}),
              ...(g.held ? { held: g.held } : {}),
            }
          }),
        ).toEqual(
          want.segments.map((g) => ({
            ...g,
            from: d(g.from),
            to: d(g.to),
            ...(g.kind === 'note' && g.held ? { held: g.held.map(d) } : {}),
          })),
        )
      })
    })
  }

  it('every bar’s segments fill it end to end', () => {
    for (const f of strips) {
      const notes = f.notes.map((n) => ({
        note: parseNote(n.note)!,
        onset: d(n.onset),
        length: d(n.length),
      }))
      for (const s of melodyStrips(notes, { meter: parseMeter(f.meter)! }, 3)) {
        expect(s.segments[0].from).toEqual(dur(0, 1))
        s.segments.forEach((g, i) => {
          if (i > 0) expect(g.from).toEqual(s.segments[i - 1].to)
        })
        expect(s.segments.at(-1)!.to).toEqual(s.length)
      }
    }
  })

  it('says counts as a musician does', () => {
    expect(beatsWords(2.5)).toBe('2½')
    expect(beatsWords(0.25)).toBe('¼')
    expect(beatsWords(1 / 3)).toBe('⅓')
    expect(beatsWords(3)).toBe('3')
  })
})
