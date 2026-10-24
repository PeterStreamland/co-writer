import { describe, expect, it } from 'vitest'
import {
  MELODY_RANKING,
  dur,
  formatNote,
  melodyCategory,
  melodyRange,
  midiNumber,
  noteInsight,
  parseChordSymbol,
  parseNote,
  rankMelody,
  typeMelody,
  type Key,
  type NextNoteContext,
} from '../../src/theory'
import { noteInsights } from '../fixtures/note-insights'

const FOUR = { meter: { num: 4, den: 4 } }

function keyOf(text: string): Key {
  const [tonic, mode] = text.split(' ')
  return { tonic: parseNote(tonic)!, mode }
}

function context(
  melody: string,
  chords: string[],
  key = keyOf('C major'),
  range = melodyRange('tenor'),
): NextNoteContext {
  return {
    melody: typeMelody(melody, dur(1, 4)).notes,
    key,
    chords: chords.map((s, i) => ({
      chord: parseChordSymbol(s)!,
      key,
      start: dur(i, 1),
      length: dur(1, 1),
    })),
    time: FOUR,
    range,
    length: dur(1, 4),
  }
}

const name = (s: { candidate: { note: Parameters<typeof formatNote>[0] } }) =>
  formatNote(s.candidate.note)

const MELODIES = ['', 'C4', 'E4 F G', 'F4 C4 A4', 'C4 C♯ D', 'A3 B C4 D E F G']

describe('the melody’s next-token interface (Phase 7 task 4)', () => {
  it('shows six to eight, no more than three from a group, grouped', () => {
    for (const m of MELODIES) {
      const r = rankMelody(context(m, ['C', 'Am', 'F', 'G7']))
      expect(r.shown.length).toBeGreaterThanOrEqual(MELODY_RANKING.min)
      expect(r.shown.length).toBeLessThanOrEqual(MELODY_RANKING.max)
      for (const g of r.groups) {
        // A first note is always a chord tone, so that group fills the list.
        if (m) expect(g.suggestions.length).toBeLessThanOrEqual(3)
        for (const s of g.suggestions) {
          expect(melodyCategory(s)).toBe(g.category)
        }
      }
      expect(r.groups.flatMap((g) => g.suggestions)).toHaveLength(
        r.shown.length,
      )
    }
  })

  it('is the same for the same input, wildcard and all (SPEC 6.1)', () => {
    const ctx = context('E4 F G', ['C', 'G'])
    expect(rankMelody(ctx)).toEqual(rankMelody(ctx))
  })

  it('has a wildcard not among those shown; Another steps through the rest', () => {
    const ctx = context('E4 F G', ['C', 'G'])
    const first = rankMelody(ctx)
    expect(first.wildcard).toBeDefined()
    expect(first.shown.map(name)).not.toContain(name(first.wildcard!))
    const seen = new Set<string>()
    for (let i = 0; i < first.wildcards; i++) {
      seen.add(name(rankMelody(ctx, { another: i }).wildcard!))
    }
    expect(seen.size).toBe(first.wildcards)
    expect(name(rankMelody(ctx, { another: first.wildcards }).wildcard!)).toBe(
      name(first.wildcard!),
    )
  })

  it('says what moved a note’s ranking', () => {
    const r = rankMelody(
      context('F4 C4 A4', ['F'], undefined, melodyRange('soprano')),
    )
    const g4 = r.shown.find((s) => name(s) === 'G4')!
    expect(g4.contextNotes).toContain(
      'Ranked higher: it turns back after the leap.',
    )
  })

  // Exit criterion: every suggestion stays in range and is tagged; across
  // the interface, shown and wildcard alike.
  it('keeps every note shown and every wildcard in range, and tagged', () => {
    const kinds = [
      'chord-tone',
      'passing',
      'neighbour',
      'leap',
      'chromatic',
      'repeat',
    ]
    for (const preset of ['bass', 'tenor', 'soprano', 'guitar']) {
      const range = melodyRange(preset)
      for (const m of MELODIES) {
        const ctx = context(m, ['C', 'Am', 'F', 'G7'], undefined, range)
        const r = rankMelody(ctx)
        for (let i = 0; i < Math.max(1, r.wildcards); i++) {
          const w = rankMelody(ctx, { another: i }).wildcard
          for (const s of [...r.shown, ...(w ? [w] : [])]) {
            const midi = midiNumber(s.candidate.note)!
            expect(midi).toBeGreaterThanOrEqual(midiNumber(range.low)!)
            expect(midi).toBeLessThanOrEqual(midiNumber(range.high)!)
            expect(s.tags.some((t) => kinds.includes(t))).toBe(true)
          }
        }
      }
    }
  })
})

describe('a next note’s ⓘ reading', () => {
  for (const f of noteInsights) {
    it(`${f.note} in ${f.key}${f.chord ? ` over ${f.chord}` : ''}`, () => {
      const insight = noteInsight(
        keyOf(f.key),
        parseNote(f.note)!,
        f.chord ? parseChordSymbol(f.chord)! : undefined,
        f.from ? parseNote(f.from)! : undefined,
      )
      expect(insight.reading).toBe(f.reading)
      expect(insight.move).toBe(f.move)
    })
  }
})
