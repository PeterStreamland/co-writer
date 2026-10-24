import { describe, expect, it } from 'vitest'
import {
  PHRASE_RHYTHMS,
  PHRASE_SIZES,
  defaultRhythm,
  writtenSpan,
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
  phraseSpan,
  phraseStart,
  placePhrase,
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
import { phrasesInto } from '../fixtures/phrases-into'

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

// Every next-note rule a phrase keeps (the Phase 7 exit criterion).
function expectRules(
  ctx: NextNoteContext,
  scale: string[],
  phrase: ReturnType<typeof generatePhrase>,
) {
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
    for (const at of strongBeats(ctx, n.onset, addDur(n.onset, n.length))) {
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
        expect(Math.sign(midi(n) - midi(all[i - 1]))).toBe(-Math.sign(leap))
      }
    }
    // Each a Suggestion, explained.
    expect(phrase[k].ruleIds.length).toBeGreaterThan(0)
  })
}

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
          expectRules(ctx, scale, phrase)
          const notes = phrase.map((s) => s.candidate)
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

const placed = (notes: MelodyNote[]) =>
  notes.map((n) => `${formatNote(n.note)}@${n.onset.n}/${n.onset.d}`)
const written = (text: string) =>
  text
    .split(' ')
    .filter(Boolean)
    .map((w) => {
      const [note, at] = w.split('@')
      const [n, d] = at.split('/').map(Number)
      const onset = dur(n, d ?? 1)
      return `${formatNote(parseNote(note)!)}@${onset.n}/${onset.d}`
    })

describe('writing a phrase into a chosen bar (Phase 7 task 10)', () => {
  for (const f of phrasesInto) {
    const ctx = context(f)
    const scale = scaleNotes(ctx.key.tonic, ctx.key.mode).map(
      (n) => `${n.letter}${n.accidental}`,
    )
    for (const size of PHRASE_SIZES) {
      it(`${f.name}: ${size.label.toLowerCase()} replaces bar ${f.bar} and keeps every rule`, () => {
        const span = phraseSpan(ctx, size.id, f.bar)
        let barStart: Dur = dur(0, 1)
        for (let b = 1; b < f.bar; b++)
          barStart = addDur(barStart, barLength(meterOfBar(ctx.time, b)))
        expect(span.start).toEqual(barStart)
        for (let take = 0; take < TAKES; take++) {
          const phrase = generatePhrase(ctx, size.id, take, f.bar)
          expect(phrase.length).toBeGreaterThan(0)
          const notes = phrase.map((s) => s.candidate)
          const melody = placePhrase(ctx.melody, notes, span)
          // The notes before and after stand as David chose.
          const before = melody.filter(
            (m) => compareDur(m.onset, span.start) < 0,
          )
          const after = melody.filter((m) => compareDur(m.onset, span.end) >= 0)
          expect(placed(before)).toEqual(written(f.before))
          const later = ctx.melody.filter(
            (m) => compareDur(m.onset, span.end) >= 0,
          )
          expect(placed(after)).toEqual(placed(later))
          if (size.id === 'bar') expect(placed(after)).toEqual(written(f.after))
          // A note ringing in stops at the bar's start.
          for (const m of before)
            expect(
              compareDur(addDur(m.onset, m.length), span.start),
            ).toBeLessThanOrEqual(0)
          expect(melody).toHaveLength(
            before.length + notes.length + after.length,
          )
          // One after another from the bar's start to the span's end.
          let at = span.start
          for (const n of notes) {
            expect(n.onset).toEqual(at)
            at = addDur(n.onset, n.length)
          }
          expect(at).toEqual(span.end)
          const all = [...before, ...notes]
          const low = midiNumber(ctx.range.low)!
          const high = midiNumber(ctx.range.high)!
          notes.forEach((n, k) => {
            expect(midi(n)).toBeGreaterThanOrEqual(low)
            expect(midi(n)).toBeLessThanOrEqual(high)
            expect(scale).toContain(`${n.note.letter}${n.note.accidental}`)
            for (const s of strongBeats(
              ctx,
              n.onset,
              addDur(n.onset, n.length),
            )) {
              const under = ctx.chords.find(
                (c) =>
                  compareDur(c.start, s) <= 0 &&
                  compareDur(s, addDur(c.start, c.length)) < 0,
              )
              if (!under) continue
              expect(chordNotes(under.chord).map(pitchClass)).toContain(
                pitchClass(n.note),
              )
            }
            const i = before.length + k
            if (i >= 2) {
              const leap = midi(all[i - 1]) - midi(all[i - 2])
              if (Math.abs(leap) >= 5)
                expect(Math.sign(midi(n) - midi(all[i - 1]))).toBe(
                  -Math.sign(leap),
                )
            }
          })
          // It leads into the note after: within a 3rd, and turning back
          // after a leap.
          const next = after[0]
          if (next) {
            const last = notes[notes.length - 1]
            expect(Math.abs(midi(next) - midi(last))).toBeLessThan(5)
            const prev = all[all.length - 2]
            if (prev && Math.abs(midi(last) - midi(prev)) >= 5)
              expect(Math.sign(midi(next) - midi(last))).toBe(
                -Math.sign(midi(last) - midi(prev)),
              )
          }
        }
      })
    }
  }

  it('starts an empty bar after the melody with a rest', () => {
    const f = phrasesInto.find((p) => p.after === '' && p.bar > 1)!
    const ctx = context(f)
    const [first] = generatePhrase(ctx, 'bar', 0, f.bar)
    expect(first.candidate.onset).toEqual(dur(2, 1))
    expect(compareDur(melodyEnd(ctx.melody), dur(2, 1))).toBeLessThan(0)
  })

  it('writes after the melody as before when no bar is chosen', () => {
    const ctx = context(phrases[3])
    expect(phraseSpan(ctx, 'notes').start).toEqual(phraseStart(ctx))
    const text = (s: ReturnType<typeof generatePhrase>) =>
      placed(s.map((p) => p.candidate)).join(' ')
    expect(text(generatePhrase(ctx, 'bar', 2))).toBe(
      text(generatePhrase(ctx, 'bar', 2, undefined)),
    )
  })

  it('gives other bars other phrases, the same bar the same take', () => {
    const ctx = context(phrasesInto[0])
    const text = (bar: number, take: number) =>
      placed(generatePhrase(ctx, 'bar', take, bar).map((p) => p.candidate))
        .map((w) => w.split('@')[0])
        .join(' ')
    expect(text(2, 1)).toBe(text(2, 1))
    const takes = new Set(Array.from({ length: 8 }, (_, k) => text(2, k)))
    expect(takes.size).toBeGreaterThan(3)
  })
})

describe('more control for Write a phrase (Phase 7 task 16)', () => {
  const takes = 4
  const len = (n: MelodyNote) => `${n.length.n}/${n.length.d}`
  for (const f of phrases) {
    const ctx = context(f)
    const scale = scaleNotes(ctx.key.tonic, ctx.key.mode).map(
      (n) => `${n.letter}${n.accidental}`,
    )
    const value = len({ ...ctx.melody[0], length: ctx.length })
    const double = len({
      ...ctx.melody[0],
      length: dur(ctx.length.n * 2, ctx.length.d),
    })
    for (const size of PHRASE_SIZES) {
      for (const rhythm of PHRASE_RHYTHMS) {
        const counts = 'notes' in size ? [1, 7, 16] : [undefined]
        for (const count of counts) {
          const options = { rhythm: rhythm.id, count }
          it(`${f.name}: ${size.label.toLowerCase()}${count ? ` (${count})` : ''}, ${rhythm.label.toLowerCase()}, keeps every rule`, () => {
            for (let take = 0; take < takes; take++) {
              const phrase = generatePhrase(
                ctx,
                size.id,
                take,
                undefined,
                options,
              )
              expect(phrase.length).toBeGreaterThan(0)
              expectRules(ctx, scale, phrase)
              const notes = phrase.map((s) => s.candidate)
              // One after another from where the phrase starts.
              let at = phraseStart(ctx)
              for (const n of notes) {
                expect(n.onset).toEqual(at)
                at = addDur(n.onset, n.length)
              }
              const span = phraseSpan(ctx, size.id, undefined, options)
              if (count) {
                expect(notes).toHaveLength(count)
                expect(writtenSpan(span, size.id, notes).end).toEqual(
                  melodyEnd(notes),
                )
              } else {
                // Bars end at their barline, whatever the rhythm.
                expect(melodyEnd(notes)).toEqual(span.end)
              }
              // Even notes all last the note value, and mixed ones the
              // note value or twice it; in bars the last may be cut short.
              const body = count ? notes : notes.slice(0, -1)
              if (rhythm.id === 'even') {
                for (const n of body) expect(len(n)).toBe(value)
              }
              if (rhythm.id === 'mixed') {
                for (const n of body) expect([value, double]).toContain(len(n))
              }
            }
          })
        }
      }
    }
  }

  it('keeps the takes it gave before when nothing new is chosen', () => {
    const ctx = context(phrases[0])
    const text = (p: ReturnType<typeof generatePhrase>) =>
      p
        .map((s) => `${formatNote(s.candidate.note)}:${len(s.candidate)}`)
        .join(' ')
    for (const size of PHRASE_SIZES) {
      for (let take = 0; take < 3; take++) {
        expect(
          text(
            generatePhrase(ctx, size.id, take, undefined, {
              rhythm: defaultRhythm(size.id),
              count: 4,
            }),
          ),
        ).toBe(text(generatePhrase(ctx, size.id, take)))
      }
    }
    expect(defaultRhythm('notes')).toBe('even')
    expect(defaultRhythm('two-bars')).toBe('varied')
  })

  it('mixes in a long note now and then, and varies a set number of notes', () => {
    const ctx = context(phrases[0])
    const lengths = (rhythm: 'mixed' | 'varied') =>
      new Set(
        Array.from({ length: 8 }, (_, k) =>
          generatePhrase(ctx, 'notes', k, undefined, { rhythm, count: 8 }),
        )
          .flat()
          .map((s) => len(s.candidate)),
      )
    expect([...lengths('mixed')].sort()).toEqual(['1/2', '1/4'])
    expect(lengths('varied').size).toBeGreaterThan(2)
  })

  it('keeps a set number between 1 and 16', () => {
    const ctx = context(phrases[0])
    expect(
      generatePhrase(ctx, 'notes', 0, undefined, { count: 40 }),
    ).toHaveLength(16)
    expect(
      generatePhrase(ctx, 'notes', 0, undefined, { count: 0 }),
    ).toHaveLength(1)
  })
})
