import { describe, expect, it } from 'vitest'
import {
  CHORD_STYLES,
  addDur,
  chordHits,
  chordStyle,
  compareDur,
  dur,
  formatNote,
  layOut,
  parseMeter,
  parseNote,
  type Dur,
  type MeterMap,
  type Note,
  type Placement,
} from '../../src/theory'
import { chordStyles } from '../fixtures/chord-styles'

const fraction = (text: string): Dur => {
  const [n, d] = text.split('/').map(Number)
  return dur(n, d)
}
const notesOf = (text: string): Note[] =>
  text
    .split(' ')
    .filter(Boolean)
    .map((t) => parseNote(t)!)

// A chord placed `at` into the bar, after a chord filling the time before.
function placed(time: MeterMap, length: Dur, at?: Dur): Placement {
  if (!at || at.n === 0) return layOut([length], time)[0]
  return layOut([at, length], time)[1]
}

describe('chord styles (Phase 7 task 8)', () => {
  for (const f of chordStyles) {
    it(f.name, () => {
      const time = { meter: parseMeter(f.meter)! }
      const hits = chordHits(
        f.style,
        notesOf(f.notes ?? 'C3 E3 G3 C4'),
        placed(time, fraction(f.length), f.at ? fraction(f.at) : undefined),
        time,
      )
      expect(
        hits.map((h) => [
          `${h.onset.n}/${h.onset.d}`,
          `${h.length.n}/${h.length.d}`,
          h.notes.map((n) => formatNote(n)).join(' '),
          ...(compareDur(h.sound, h.length) !== 0 && h.notes.length
            ? [`${h.sound.n}/${h.sound.d}`]
            : []),
        ]),
      ).toEqual(
        f.hits.map(([onset, length, notes, sound]) => {
          const [o, l] = [fraction(onset), fraction(length)]
          return [
            `${o.n}/${o.d}`,
            `${l.n}/${l.d}`,
            notesOf(notes)
              .map((n) => formatNote(n))
              .join(' '),
            ...(sound ? [`${fraction(sound).n}/${fraction(sound).d}`] : []),
          ]
        }),
      )
      if (f.strums) expect(hits.map((h) => h.strum)).toEqual(f.strums)
    })
  }

  // The exit criterion's first half: every style fills each chord's
  // length exactly, wherever it falls and however long it is.
  const meters = ['4/4', '3/4', '2/4', '6/8', '12/8', '7/8', '5/4']
  const lengths = ['1/8', '1/4', '3/8', '1/2', '3/4', '1/1', '3/2', '2/1']
  const starts = ['0/1', '1/8', '1/4', '1/2']
  const notes = notesOf('E2 B2 E3 G3 B3 E4')
  for (const style of CHORD_STYLES) {
    it(`${style.label} fills each chord exactly, in every meter`, () => {
      for (const m of meters) {
        const time = { meter: parseMeter(m)! }
        for (const l of lengths) {
          for (const s of starts) {
            const p = placed(time, fraction(l), fraction(s))
            const hits = chordHits(style.id, notes, p, time)
            let at = dur(0, 1)
            for (const h of hits) {
              expect(h.onset, `${style.id} ${m} ${l} from ${s}`).toEqual(at)
              expect(compareDur(h.length, dur(0, 1))).toBe(1)
              at = addDur(at, h.length)
              // Nothing rings past the chord's end.
              expect(
                compareDur(addDur(h.onset, h.sound), p.length),
              ).toBeLessThanOrEqual(0)
              expect(h.notes.length > 0).toBe(
                compareDur(h.sound, dur(0, 1)) > 0,
              )
              for (const n of h.notes) expect(notes).toContain(n)
            }
            expect(at, `${style.id} ${m} ${l} from ${s}`).toEqual(p.length)
            // Struck as it starts, except off-beat stabs, which rest first.
            if (style.id !== 'stabs')
              expect(hits[0].notes.length).toBeGreaterThan(0)
          }
        }
      }
    })
  }

  it('reads an unknown style as block', () => {
    expect(chordStyle('polka')).toBe('block')
    expect(chordStyle(undefined)).toBe('block')
    expect(chordStyle('stabs')).toBe('stabs')
  })
})
