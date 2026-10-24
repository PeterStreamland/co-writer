import { describe, expect, it } from 'vitest'
import {
  PHRASE_SIZES,
  beatsOf,
  addDur,
  barLength,
  barPosition,
  chordNotes,
  compareDur,
  dur,
  formatNote,
  generatePhrase,
  melodyEnd,
  melodyRange,
  meterOfBar,
  midiNumber,
  parseChordSymbol,
  parseMeter,
  parseNote,
  phraseStart,
  pitchClass,
  scaleNotes,
  subDur,
  typeMelody,
  type Dur,
  type Key,
  type MelodyNote,
  type NextNoteContext,
} from '../../src/theory'
import { phrases, type PhraseFixture } from '../fixtures/phrases'

function keyOf(text: string): Key {
  const [tonic, mode] = text.split(' ')
  return { tonic: parseNote(tonic)!, mode }
}

function context(f: PhraseFixture): NextNoteContext {
  const key = keyOf(f.key)
  const meter = parseMeter(f.meter)!
  const value = f.value ? dur(f.value.n, f.value.d) : dur(1, 4)
  let at: Dur = dur(0, 1)
  const chords = f.chords.map((c) => {
    const [symbol, length] =
      typeof c === 'string'
        ? [c, barLength(meter)]
        : [c[0], dur(c[1].n, c[1].d)]
    const placed = { chord: parseChordSymbol(symbol)!, key, start: at, length }
    at = addDur(at, length)
    return placed
  })
  return {
    melody: typeMelody(f.melody, value).notes,
    key,
    chords,
    time: { meter },
    range: f.range
      ? { low: parseNote(f.range[0])!, high: parseNote(f.range[1])! }
      : melodyRange('tenor'),
    length: value,
  }
}

// The strong beats from one point up to another.
function strongBeats(ctx: NextNoteContext, from: Dur, to: Dur): Dur[] {
  const out: Dur[] = []
  const { bar: first, offset } = barPosition(ctx.time, from)
  let start = subDur(from, offset)
  for (let bar = first; compareDur(start, to) < 0; bar++) {
    const meter = meterOfBar(ctx.time, bar)
    for (const b of beatsOf(meter)) {
      const at = addDur(start, b.onset)
      if (b.strength === 'weak') continue
      if (compareDur(at, from) >= 0 && compareDur(at, to) < 0) out.push(at)
    }
    start = addDur(start, barLength(meter))
  }
  return out
}

const midi = (m: MelodyNote) => midiNumber(m.note) as number
const TAKES = 12

describe('generating a phrase (Phase 7 task 7)', () => {
  for (const f of phrases) {
    const ctx = context(f)
    const scale = scaleNotes(ctx.key.tonic, ctx.key.mode).map(
      (n) => `${n.letter}${n.accidental}`,
    )
    for (const size of PHRASE_SIZES) {
      it(`${f.name}: ${size.label.toLowerCase()} follows every next-note rule`, () => {
        for (let take = 0; take < TAKES; take++) {
          const phrase = generatePhrase(ctx, size.id, take)
          expect(phrase.length).toBeGreaterThan(0)
          const notes = phrase.map((s) => s.candidate)
          const all = [...ctx.melody, ...notes]
          const low = midiNumber(ctx.range.low)!
          const high = midiNumber(ctx.range.high)!
          notes.forEach((n, k) => {
            // In range, and in the key.
            expect(midi(n)).toBeGreaterThanOrEqual(low)
            expect(midi(n)).toBeLessThanOrEqual(high)
            expect(scale).toContain(`${n.note.letter}${n.note.accidental}`)
            // A chord tone on each strong beat it sounds on, held or struck.
            for (const at of strongBeats(
              ctx,
              n.onset,
              addDur(n.onset, n.length),
            )) {
              const under = ctx.chords.find(
                (c) =>
                  compareDur(c.start, at) <= 0 &&
                  compareDur(at, addDur(c.start, c.length)) < 0,
              )
              if (!under) continue
              const tones = chordNotes(under.chord).map(pitchClass)
              expect(tones, `${formatNote(n.note)} on a strong beat`).toContain(
                pitchClass(n.note),
              )
            }
            // After a leap of a 4th or more, a change of direction.
            const i = ctx.melody.length + k
            if (i >= 2) {
              const leap = midi(all[i - 1]) - midi(all[i - 2])
              if (Math.abs(leap) >= 5) {
                expect(Math.sign(midi(n) - midi(all[i - 1]))).toBe(
                  -Math.sign(leap),
                )
              }
            }
            // Each a Suggestion, explained.
            expect(phrase[k].ruleIds.length).toBeGreaterThan(0)
          })
          // One after another, with no gaps.
          let at = phraseStart(ctx)
          for (const n of notes) {
            expect(n.onset).toEqual(at)
            at = addDur(n.onset, n.length)
          }
          if ('notes' in size) {
            expect(notes).toHaveLength(size.notes)
          } else {
            // It ends at a barline, a bar or two on.
            const end = melodyEnd(notes)
            expect(barPosition(ctx.time, end).offset).toEqual(dur(0, 1))
            const startBar = barPosition(ctx.time, phraseStart(ctx)).bar
            expect(barPosition(ctx.time, end).bar - startBar).toBe(size.bars)
          }
        }
      })
    }
  }

  it('gives the same phrase for the same take, and other takes', () => {
    const ctx = context(phrases[0])
    const text = (take: number) =>
      generatePhrase(ctx, 'two-bars', take)
        .map(
          (s) =>
            `${formatNote(s.candidate.note)}:${s.candidate.length.n}/${s.candidate.length.d}`,
        )
        .join(' ')
    expect(text(3)).toBe(text(3))
    const takes = new Set(Array.from({ length: 10 }, (_, k) => text(k)))
    expect(takes.size).toBeGreaterThan(5)
  })

  it('starts after a rest before the next note', () => {
    const ctx = { ...context(phrases[3]), gap: dur(1, 4) }
    const [first] = generatePhrase(ctx, 'notes')
    expect(first.candidate.onset).toEqual(
      addDur(melodyEnd(ctx.melody), dur(1, 4)),
    )
  })

  it('mixes note lengths across a bar', () => {
    const ctx = context(phrases[0])
    const lengths = new Set(
      Array.from({ length: 10 }, (_, k) => generatePhrase(ctx, 'bar', k))
        .flat()
        .map((s) => `${s.candidate.length.n}/${s.candidate.length.d}`),
    )
    expect(lengths.size).toBeGreaterThan(2)
  })
})
