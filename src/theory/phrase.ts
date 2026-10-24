// Generating a phrase (PLAN Phase 7 task 7, David's request): the next few
// notes, or a bar or two, chosen one at a time from the next-note
// suggestions with a little chance, keeping every next-note rule:
// - every note in range
// - a chord tone on each strong beat, where there is a chord
// - after a leap of a 4th or more, a change of direction
// - notes of the key (colour notes stay a choice of your own)
// - the phrase ends on a chord tone where it can
// Rhythms come beat by beat from rhythm cells, as data. The same melody,
// chords and take always give the same phrase; another take, another.
// A phrase can also go into a bar chosen (Phase 7 task 10, David's note):
// it replaces the notes starting there, and leads into the note after.
import { chordNotes } from './chord-symbol'
import {
  addDur,
  compareDur,
  dur,
  subDur,
  timesDur,
  ZERO,
  type Dur,
} from './duration'
import { seededRandom } from './lens'
import {
  barPosition,
  barStart,
  clearSpan,
  melodyEnd,
  type MelodyNote,
} from './melody'
import { melodySeed } from './melody-ranker'
import { barLength, beatsOf, meterOfBar, type MeterMap } from './meter'
import {
  BIG_LEAP,
  rankNextNotes,
  type NextNoteContext,
  type NextNoteSuggestion,
} from './next-note'
import { midiNumber, mod, pitchClass } from './note'
import {
  PHRASE_CHOICE,
  PHRASE_SIZES,
  RHYTHM_CELLS,
  type PhraseSize,
  type RhythmCell,
} from './phrase-data'

export * from './phrase-data'

// A note's place in the phrase before its pitch is chosen.
type Slot = { onset: Dur; length: Dur }

// Where a phrase starts: after the melody and any rest before the next note.
export function phraseStart(ctx: NextNoteContext): Dur {
  return addDur(melodyEnd(ctx.melody), ctx.gap ?? ZERO)
}

// Where a phrase goes: from its start up to its end.
export type PhraseSpan = { start: Dur; end: Dur }

// The span a phrase of a size fills: after the melody and any rest before
// the next note, or from the start of a bar chosen (counted from 1).
export function phraseSpan(
  ctx: NextNoteContext,
  size: PhraseSize,
  bar?: number,
): PhraseSpan {
  const which = sizeOf(size)
  const start = bar === undefined ? phraseStart(ctx) : barStart(ctx.time, bar)
  const end =
    'bars' in which
      ? barsEnd(ctx.time, start, which.bars)
      : addDur(start, timesDur(ctx.length, which.notes))
  return { start, end }
}

// The melody with a phrase in its span: the notes starting there go, a
// note ringing in stops at its start, and the notes after stay put.
export function placePhrase(
  melody: MelodyNote[],
  phrase: MelodyNote[],
  span: PhraseSpan,
): MelodyNote[] {
  const kept = clearSpan(melody, span.start, span.end)
  const before = kept.filter((m) => compareDur(m.onset, span.start) < 0)
  const after = kept.filter((m) => compareDur(m.onset, span.start) >= 0)
  return [...before, ...phrase, ...after]
}

const sizeOf = (size: PhraseSize) =>
  PHRASE_SIZES.find((p) => p.id === size) ?? PHRASE_SIZES[0]

// Where a bar or two from a point ends: the next barline, and the one after.
function barsEnd(time: MeterMap, at: Dur, bars: number): Dur {
  const { offset, bar: first } = barPosition(time, at)
  let bar = first
  let end = addDur(subDur(at, offset), barLength(meterOfBar(time, bar)))
  for (let k = 1; k < bars; k++) {
    bar++
    end = addDur(end, barLength(meterOfBar(time, bar)))
  }
  return end
}

function pick<T extends { weight: number }>(
  items: T[],
  random: () => number,
): T {
  const total = items.reduce((s, i) => s + i.weight, 0)
  let r = random() * total
  for (const item of items) {
    r -= item.weight
    if (r < 0) return item
  }
  return items[items.length - 1]
}

// The phrase's rhythm from `start` to `end`, beat by beat. Time before the
// first beat is one note; a beat held rings the note before on.
function rhythm(
  time: MeterMap,
  start: Dur,
  end: Dur,
  random: () => number,
): Slot[] {
  const slots: Slot[] = []
  // Whether the last note filled its beat: only then can a beat hold it on,
  // so held notes last whole beats.
  let whole = false
  const at0 = barPosition(time, start)
  let barStart = subDur(start, at0.offset)
  let bar = at0.bar
  while (compareDur(barStart, end) < 0) {
    const meter = meterOfBar(time, bar)
    for (const beat of beatsOf(meter)) {
      const beatStart = addDur(barStart, beat.onset)
      const beatEnd = addDur(beatStart, beat.length)
      if (compareDur(beatEnd, start) <= 0 || compareDur(beatStart, end) >= 0)
        continue
      // Part of a beat left after the melody: one note fills it.
      if (compareDur(beatStart, start) < 0) {
        slots.push({ onset: start, length: subDur(beatEnd, start) })
        whole = false
        continue
      }
      // How many pulses (quavers in 6/8 and 7/8) the beat holds.
      const size = Math.round((beat.length.n * meter.den) / beat.length.d)
      const cells = (RHYTHM_CELLS[size] ?? RHYTHM_CELLS[1]).filter(
        (c) => !('hold' in c) || whole,
      )
      // The last beat lands: one note for the whole beat.
      const last = compareDur(beatEnd, end) >= 0
      const cell: RhythmCell = last
        ? { parts: [1], weight: 1 }
        : pick(cells, random)
      if ('hold' in cell) {
        const before = slots[slots.length - 1]
        before.length = addDur(before.length, beat.length)
        continue
      }
      whole = cell.parts.length === 1
      let at = beatStart
      for (const part of cell.parts) {
        const length = partOf(beat.length, part)
        slots.push({ onset: at, length })
        at = addDur(at, length)
      }
    }
    barStart = addDur(barStart, barLength(meter))
    bar++
  }
  return slots
}

// A part of a beat as an exact length: ½ of a crotchet is a quaver.
function partOf(beat: Dur, part: number): Dur {
  for (const d of [1, 2, 3, 4, 6, 8, 12]) {
    const n = Math.round(part * d)
    if (Math.abs(n / d - part) < 1e-9) return dur(beat.n * n, beat.d * d)
  }
  return beat
}

const midiOf = (s: NextNoteSuggestion) => midiNumber(s.candidate.note) as number

// Whether a next note keeps every rule the phrase holds to.
function keepsRules(
  s: NextNoteSuggestion,
  ctx: NextNoteContext,
  melody: MelodyNote[],
  ending: boolean,
  next?: number,
): boolean {
  const m = midiOf(s)
  const low = midiNumber(ctx.range.low) as number
  const high = midiNumber(ctx.range.high) as number
  if (m < low || m > high) return false
  if (s.tags.includes('chromatic')) return false
  const onset = s.candidate.onset
  const chord = chordAt(ctx, onset)
  const tone = chord !== undefined && chord.has(mod(m, 12))
  // A chord tone on every strong beat it sounds on, struck or held.
  const end = addDur(onset, s.candidate.length)
  for (const at of strongBeats(ctx.time, onset, end)) {
    const there = chordAt(ctx, at)
    if (there && !there.has(mod(m, 12))) return false
  }
  if (ending && chord && !tone) return false
  const [a, b] = melody.slice(-2).map((n) => midiNumber(n.note) as number)
  if (a !== undefined && b !== undefined && Math.abs(b - a) >= BIG_LEAP) {
    // After a leap, turn back.
    if (Math.sign(m - b) !== -Math.sign(b - a)) return false
  }
  // The last note leads into the note after: less than a leap away, and
  // turning back if it was reached by a leap.
  if (ending && next !== undefined) {
    if (Math.abs(next - m) >= BIG_LEAP) return false
    if (b !== undefined && Math.abs(m - b) >= BIG_LEAP) {
      if (Math.sign(next - m) !== -Math.sign(m - b)) return false
    }
  }
  return true
}

// The strong beats (and downbeats) from one point up to another.
function strongBeats(time: MeterMap, from: Dur, to: Dur): Dur[] {
  const out: Dur[] = []
  const { bar: first, offset } = barPosition(time, from)
  let start = subDur(from, offset)
  for (let bar = first; compareDur(start, to) < 0; bar++) {
    const meter = meterOfBar(time, bar)
    for (const beat of beatsOf(meter)) {
      if (beat.strength === 'weak') continue
      const at = addDur(start, beat.onset)
      if (compareDur(at, from) >= 0 && compareDur(at, to) < 0) out.push(at)
    }
    start = addDur(start, barLength(meter))
  }
  return out
}

// The pitch classes of the chord sounding at a point: with no chords at
// all, the key's tonic triad, as the next-note rules use; past the last
// chord, none.
function chordAt(ctx: NextNoteContext, at: Dur): Set<number> | undefined {
  const under = ctx.chords.find(
    (c) =>
      compareDur(c.start, at) <= 0 &&
      compareDur(at, addDur(c.start, c.length)) < 0,
  )
  if (under) {
    return new Set(
      [
        ...chordNotes(under.chord),
        ...(under.chord.bass ? [under.chord.bass] : []),
      ].map(pitchClass),
    )
  }
  return undefined
}

// A phrase after the melody, or into a bar chosen (counted from 1): its
// notes as suggestions, each explained by the rules that chose it. Empty
// when no note keeps the rules. Into a bar, the notes before lead into it
// and it leads into the note after; `placePhrase` puts it in its place.
export function generatePhrase(
  ctx: NextNoteContext,
  size: PhraseSize,
  take = 0,
  bar?: number,
): NextNoteSuggestion[] {
  const which = sizeOf(size)
  const random = seededRandom(
    melodySeed(ctx) + 7919 * take + which.id.length + 104729 * (bar ?? 0),
  )
  const { start, end } = phraseSpan(ctx, size, bar)
  const kept = clearSpan(ctx.melody, start, end)
  const before = kept.filter((m) => compareDur(m.onset, start) < 0)
  const after = kept.find((m) => compareDur(m.onset, start) >= 0)
  const next = after && (midiNumber(after.note) as number)
  let best: NextNoteSuggestion[] = []
  // A whole phrase that couldn't lead into the note after: kept in case no
  // take can.
  let loose: NextNoteSuggestion[] | undefined
  for (let attempt = 0; attempt < PHRASE_CHOICE.tries; attempt++) {
    const slots =
      'bars' in which
        ? rhythm(ctx.time, start, end, random)
        : Array.from({ length: which.notes }, (_, k) => ({
            onset: addDur(start, timesDur(ctx.length, k)),
            length: ctx.length,
          }))
    const chosen: NextNoteSuggestion[] = []
    let melody = before
    let leads = true
    for (const [k, slot] of slots.entries()) {
      const gap = k === 0 ? subDur(slot.onset, melodyEnd(melody)) : ZERO
      const here = { ...ctx, melody, length: slot.length, gap }
      const ending = k === slots.length - 1
      const ranked = rankNextNotes(here)
      let fit = ranked.filter((s) => keepsRules(s, ctx, melody, ending, next))
      if (!fit.length && ending && next !== undefined) {
        fit = ranked.filter((s) => keepsRules(s, ctx, melody, ending))
        leads = false
      }
      if (!fit.length && ending)
        fit = ranked.filter((s) => keepsRules(s, ctx, melody, false))
      if (!fit.length) break
      // A repeat counts for less here: a phrase of repeats doesn't move.
      const pool = fit
        .map((p) => ({
          p,
          score:
            p.score + (p.tags.includes('repeat') ? PHRASE_CHOICE.repeat : 0),
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, PHRASE_CHOICE.pool)
      const top = pool[0].score
      const s = pick(
        pool.map(({ p, score }) => ({
          p,
          weight: Math.exp((score - top) / PHRASE_CHOICE.spread),
        })),
        random,
      ).p
      chosen.push(s)
      melody = [...melody, s.candidate]
    }
    if (chosen.length === slots.length) {
      if (leads) return chosen
      loose ??= chosen
    } else if (chosen.length > best.length) best = chosen
  }
  return loose ?? best
}
