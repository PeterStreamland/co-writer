// Any number of notes in a bar of a line (David's request, 2026-10-23),
// from one to sixteen. Where they fall: the chord's start, then the
// strongest places of the bar (beats by strength, then half-beats, then
// semiquavers), later ones first when they tie, so extra notes lead into
// the next chord. What they play: the mode's own notes where they start on
// one of those places, and between them notes the mode likes (another chord
// tone, a step toward the next note, a neighbour, an approach, or the note
// again for roots and pedals), each scored as data. A strong beat always
// takes a chord tone. With `random` (a refresh), chance joins the scores,
// for both the rhythm and the notes, and only the bar's first note is kept,
// so every refresh is a new bar that still follows the rules.
import {
  addDur,
  compareDur,
  dur,
  durEquals,
  ratioOf,
  subDur,
  timesDur,
  type Dur,
} from './duration'
import type { BarNote } from './line-edits'
import {
  FILL_CHANCE,
  FILL_INTO_TARGET,
  FILL_MOVE,
  FILL_WEIGHTS,
  GRID,
  MOST_NOTES,
  PLACE_WEIGHTS,
  BACK_AGAIN,
  REPEAT_AGAIN,
  RHYTHM_CHANCE,
  type FillKind,
} from './line-fill-data'
import {
  approachNote,
  passingNotes,
  slotsOf,
  stepAbove,
  tonesOf,
  type LineNote,
  type LineStep,
} from './lines'
import type { LineModeId } from './lines-data'
import type { Placement } from './meter'
import { midiNumber, mod, noteAtMidi, pitchClass, type Note } from './note'

export * from './line-fill-data'

type Place = { at: Dur; weight: number }

const strengthWeight = (s: string) =>
  s === 'downbeat' || s === 'strong' || s === 'weak'
    ? PLACE_WEIGHTS[s]
    : PLACE_WEIGHTS.half

// The places a chord's notes can start, each with how much it counts: every
// semiquaver, or the chord's slots when its length isn't whole semiquavers.
function placesOf(placed: Placement): Place[] {
  const grid = dur(...GRID)
  const units = ratioOf(placed.length, grid)
  if (!Number.isInteger(units)) {
    return slotsOf(placed).map((s) => ({
      at: s.at,
      weight: strengthWeight(s.strength),
    }))
  }
  const beats = [
    { at: placed.start, strength: placed.accent as string },
    ...placed.beats.filter((b) => compareDur(b.at, placed.start) > 0),
  ]
  return Array.from({ length: units }, (_, k) => {
    const at = addDur(placed.start, timesDur(grid, k))
    const beat = beats.find((b) => durEquals(b.at, at))
    if (beat) return { at, weight: strengthWeight(beat.strength) }
    const within = beats.filter((b) => compareDur(b.at, at) < 0).at(-1)!
    const off = ratioOf(subDur(at, within.at), grid)
    return {
      at,
      weight: off % 2 === 0 ? PLACE_WEIGHTS.half : PLACE_WEIGHTS.quarter,
    }
  })
}

// The most notes a chord's bar can hold.
export function mostNotes(placed: Placement): number {
  return Math.min(MOST_NOTES, placesOf(placed).length)
}

// Where `count` notes start in a chord: its start, then the strongest
// places, later first on a tie, or by chance with `random`.
export function rhythmOf(
  placed: Placement,
  count: number,
  random?: () => number,
): Dur[] {
  const places = placesOf(placed)
  const n = Math.max(1, Math.min(count, places.length))
  return places
    .map((p, k) => ({
      ...p,
      k,
      score:
        k === 0 ? Infinity : p.weight + (random ? random() * RHYTHM_CHANCE : 0),
    }))
    .sort((a, b) => b.score - a.score || b.k - a.k)
    .slice(0, n)
    .sort((a, b) => a.k - b.k)
    .map((p) => p.at)
}

const pitch = (n: Note) => midiNumber(n) as number

// A bar of the line with `count` notes, as bar notes. `notes` is the
// mode's line over the whole progression, so the bar knows what comes
// next.
export function fillBar(
  notes: LineNote[],
  steps: LineStep[],
  index: number,
  mode: LineModeId,
  range: number[],
  count: number,
  random?: () => number,
): BarNote[] {
  const step = steps[index]
  const { placed } = step
  const own = notes.filter((n) => n.step === index)
  if (own.length === 0) return []
  const after = notes.find((n) => n.step > index) ?? notes[0]
  const onsets = rhythmOf(placed, count, random)
  const places = placesOf(placed)
  const strongAt = (at: Dur) =>
    (places.find((p) => durEquals(p.at, at))?.weight ?? 0) >=
    PLACE_WEIGHTS.strong
  // The mode's lead into the next chord (an approach note) stays the bar's
  // last note, however many come before it, unless that falls on a strong
  // beat.
  const tail = own[own.length - 1]
  const last = onsets.length - 1
  const lead =
    !random &&
    own.length > 1 &&
    last > 0 &&
    tail.tags.includes('approach') &&
    !strongAt(onsets[last])
      ? tail
      : undefined
  const out: Note[] = []
  onsets.forEach((at, k) => {
    if (k === 0) return out.push(own[0].note)
    if (lead && k === last) return out.push(lead.note)
    const kept = random
      ? undefined
      : own.find((n) => n !== lead && durEquals(n.onset, at))
    if (kept) return out.push(kept.note)
    // What the line heads for: the mode's next note in this bar, its lead,
    // or the next chord's first note.
    const ahead = random
      ? undefined
      : own.find((n) => n !== lead && compareDur(n.onset, at) > 0)
    const target = ahead ?? lead ?? after
    const targetAt = ahead ? ahead.onset : lead ? onsets[last] : after.onset
    const nextAt = onsets[k + 1]
    const prev = out[out.length - 1]
    out.push(
      choose(step, mode, range, prev, target.note, {
        strong: strongAt(at),
        last: nextAt === undefined || compareDur(nextAt, targetAt) >= 0,
        before: out.length > 1 ? pitch(out[out.length - 2]) : undefined,
        random,
      }),
    )
  })
  return out.map((note, k) => ({ note, at: subDur(onsets[k], placed.start) }))
}

// The note to play after `prev` on the way to `target`: the best-scoring
// kind the mode likes, a chord tone on a strong beat. After a note outside
// the chord, the line moves on rather than stepping further off.
function choose(
  step: LineStep,
  mode: LineModeId,
  range: number[],
  prev: Note,
  target: Note,
  {
    strong,
    last,
    before,
    random,
  }: {
    strong: boolean
    last: boolean
    before?: number
    random?: () => number
  },
): Note {
  const weights = FILL_WEIGHTS[mode]
  const pm = pitch(prev)
  const tm = pitch(target)
  const tones = tonesOf(step.chord)
  const isTone = (n: Note) =>
    tones.some((t) => pitchClass(t.note) === pitchClass(n))
  const offChord = !isTone(prev) && mode !== 'pedal'
  const options: { note: Note; kind: FillKind }[] = []
  for (const t of tones) {
    const near = pm + (mod(pitchClass(t.note) - pm + 6, 12) - 6)
    for (const m of [near - 12, near, near + 12]) {
      if (m !== pm)
        options.push({ note: noteAtMidi(t.note, m) as Note, kind: 'tone' })
    }
  }
  if (!offChord) options.push({ note: prev, kind: 'repeat' })
  if (!strong) {
    if (tm !== pm) {
      const [scale] = passingNotes(step.key, prev, target, false)
      const [semitone] = passingNotes(step.key, prev, target, true)
      if (scale) options.push({ note: scale, kind: 'passing' })
      if (semitone && (!scale || pitch(semitone) !== pitch(scale))) {
        options.push({ note: semitone, kind: 'chromatic' })
      }
    }
    if (!offChord) {
      options.push({ note: stepAbove(step.key, prev), kind: 'neighbour' })
      options.push({
        note: approachNote(prev, 'below', step.key),
        kind: 'neighbour',
      })
    }
    if (last) {
      const approach = approachNote(
        target,
        tm >= pm ? 'below' : 'above',
        step.key,
      )
      if (pitch(approach) !== pm)
        options.push({ note: approach, kind: 'approach' })
    }
  }
  let best: { note: Note; score: number } | undefined
  for (const o of options) {
    const m = pitch(o.note)
    if (m < range[0] - 2 || m > range[1] + 2) continue
    const score =
      weights[o.kind] -
      FILL_MOVE * Math.abs(m - pm) -
      (m === tm ? FILL_INTO_TARGET : 0) -
      (o.kind === 'repeat' && before === pm ? REPEAT_AGAIN : 0) -
      (o.kind !== 'repeat' && m === before ? BACK_AGAIN : 0) +
      (random ? random() * FILL_CHANCE : 0)
    if (!best || score > best.score) best = { note: o.note, score }
  }
  return best?.note ?? prev
}
