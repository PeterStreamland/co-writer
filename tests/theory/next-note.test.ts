import { describe, expect, it } from 'vitest'
import {
  NEXT_NOTE_SHOWN,
  RANGE_PRESETS,
  dur,
  formatNote,
  layOut,
  melodyRange,
  midiNumber,
  nextNotes,
  parseChordSymbol,
  parseNote,
  rankNextNotes,
  typeMelody,
  type Dur,
  type Key,
  type NextNoteContext,
} from '../../src/theory'
import { nextNotes as cases } from '../fixtures/next-notes'

const FOUR = { meter: { num: 4, den: 4 } }

function keyOf(text: string): Key {
  const [tonic, mode] = text.split(' ')
  return { tonic: parseNote(tonic)!, mode }
}

function context(c: (typeof cases)[number]): NextNoteContext {
  const key = keyOf(c.key)
  const value = c.value ? dur(c.value.n, c.value.d) : dur(1, 4)
  const symbols = c.chords.map((x) => (typeof x === 'string' ? x : x[0]))
  const lengths = c.chords.map((x) =>
    typeof x === 'string' ? undefined : dur(x[1].n, x[1].d),
  )
  const timing = layOut(lengths, FOUR)
  return {
    melody: typeMelody(c.melody, value).notes,
    key,
    chords: symbols.map((s, i) => ({
      chord: parseChordSymbol(s)!,
      key,
      start: timing[i].start,
      length: timing[i].length,
    })),
    time: FOUR,
    range: c.range
      ? { low: parseNote(c.range[0])!, high: parseNote(c.range[1])! }
      : melodyRange('tenor'),
    length: value,
  }
}

const names = (ctx: NextNoteContext) =>
  nextNotes(ctx).map((s) => formatNote(s.candidate.note))

describe('next-note suggestions (Phase 7 task 2)', () => {
  for (const c of cases) {
    it(c.name, () => {
      const ctx = context(c)
      const shown = nextNotes(ctx)
      const all = rankNextNotes(ctx)
      const allNames = all.map((s) => formatNote(s.candidate.note))
      if (c.top) expect(names(ctx)[0]).toBe(c.top)
      for (const n of c.inTop ?? []) expect(names(ctx)).toContain(n)
      for (const [a, b] of c.above ?? []) {
        expect(allNames).toContain(a)
        expect(allNames.indexOf(a)).toBeLessThan(
          allNames.indexOf(b) === -1 ? Infinity : allNames.indexOf(b),
        )
      }
      for (const n of c.absent ?? []) expect(allNames).not.toContain(n)
      for (const [n, tags] of Object.entries(c.tags ?? {})) {
        const s = all.find((x) => formatNote(x.candidate.note) === n)
        expect(s, n).toBeDefined()
        for (const t of tags) expect(s!.tags, n).toContain(t)
      }
      expect(shown.length).toBeLessThanOrEqual(NEXT_NOTE_SHOWN)
    })
  }
})

// Exit criterion: every suggestion stays in range and is tagged (chord
// tone, passing, neighbour, leap, chromatic; or a repeat).
describe('every suggestion stays in range and is tagged', () => {
  const KINDS = [
    'chord-tone',
    'passing',
    'neighbour',
    'leap',
    'chromatic',
    'repeat',
  ]
  const melodies = [
    'C4 D E F G A B C',
    'E4 G C5 B4 A G',
    'A3 C4 E4 G4 A4',
    'G4 F♯ E D C B3',
    'C4 C♯ D D♯ E',
  ]
  const presets = RANGE_PRESETS.map((p) => p.id)
  it('over every preset, melody and length', () => {
    const key = keyOf('C major')
    const chords = ['C', 'Am', 'F', 'G7'].map((s, i) => ({
      chord: parseChordSymbol(s)!,
      key,
      start: dur(i, 1),
      length: dur(1, 1),
    }))
    let checked = 0
    for (const preset of presets) {
      const range = melodyRange(preset)
      const low = midiNumber(range.low)!
      const high = midiNumber(range.high)!
      for (const text of [...melodies, '']) {
        for (const value of [dur(1, 8), dur(1, 4), dur(3, 8)] as Dur[]) {
          const melody = typeMelody(text, value).notes
          const all = rankNextNotes({
            melody,
            key,
            chords,
            time: FOUR,
            range,
            length: value,
          })
          for (const s of all) {
            const m = midiNumber(s.candidate.note)!
            expect(m).toBeGreaterThanOrEqual(low)
            expect(m).toBeLessThanOrEqual(high)
            expect(s.tags.some((t) => KINDS.includes(t))).toBe(true)
            expect(s.explanation.length).toBeGreaterThan(0)
            if (melody.length) {
              const last = midiNumber(melody.at(-1)!.note)!
              expect(Math.abs(m - last)).toBeLessThanOrEqual(12)
            }
            checked++
          }
        }
      }
    }
    expect(checked).toBeGreaterThan(1000)
  })

  it('past the last chord no chord rules apply', () => {
    const ctx = context({
      name: '',
      key: 'C major',
      chords: ['C'],
      melody: 'C4 D E F',
    })
    for (const s of rankNextNotes(ctx)) {
      expect(s.tags).not.toContain('chord-tone')
      expect(s.ruleIds).not.toContain('melody-strong-non-tone')
    }
    // Steps either way, nothing from a chord.
    expect(names(ctx).slice(0, 2).sort()).toEqual(['E4', 'G4'])
  })

  it('with no chords, the tonic triad guides the strong beats', () => {
    const ctx = context({
      name: '',
      key: 'C major',
      chords: [],
      melody: 'C4 D',
    })
    // Beat 3 is strong: the triad's C or E, a step either side of D.
    expect(names(ctx).slice(0, 2).sort()).toEqual(['C4', 'E4'])
  })

  it('the same melody always gives the same ranking', () => {
    const ctx = context(cases[0])
    expect(nextNotes(ctx)).toEqual(nextNotes(ctx))
  })

  it('starts the next note after the last, or after a rest', () => {
    const ctx = context(cases[0])
    const [s] = nextNotes({ ...ctx, gap: dur(1, 4) })
    expect(s.candidate.onset).toEqual(dur(3, 4))
    expect(s.candidate.length).toEqual(dur(1, 4))
  })
})
