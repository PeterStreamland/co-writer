// Editing a line bar by bar (David's request, 2026-10-23). A bar you edit
// keeps its notes, as a list of notes and where each starts in the chord;
// each lasts to the next, the last to the chord's end, so a bar always
// fits its chord, even after the chord's length changes. Every note of an
// edited bar is tagged again against its chord and the notes either side:
// a chord tone, an approach, a passing or neighbour note, or a note of your
// own, and chromatic outside the key.
// Tap a note and other notes for its place come as ranked suggestions;
// ways to add notes after it, sharing its time, come the same way.
import { chordSymbol } from './chord'
import {
  addDur,
  compareDur,
  dur,
  subDur,
  timesDur,
  ZERO,
  type Dur,
} from './duration'
import {
  ADD_MOVES,
  LONGEST_RUN,
  SHORTEST,
  SWAP_REACH,
  SWAP_SCORING,
  SWAP_SHOWN,
  type AddMoveId,
} from './line-edits-data'
import {
  approachNote,
  noteOver,
  passingNotes,
  slotsOf,
  spellPitch,
  tonesOf,
  type LineNote,
  type LineStep,
} from './lines'
import {
  formatNote,
  midiNumber,
  mod,
  noteAtMidi,
  pitchClass,
  type Note,
} from './note'
import { fillTemplate, makeSuggestion, type Suggestion } from './suggestion'

export * from './line-edits-data'

// A note of an edited bar: spelled with its octave, and when it starts,
// from the start of the chord. It lasts to the next note unless it has a
// length of its own, shorter, which leaves a rest after it (a frozen row's
// arpeggio rests, 2026-10-24).
export type BarNote = { note: Note; at: Dur; length?: Dur }

const name = (n: Note) => formatNote({ ...n, octave: undefined })

// A bar of a line as bar notes.
export function barOf(
  notes: Pick<LineNote, 'step' | 'onset' | 'length' | 'note'>[],
  step: number,
  steps: LineStep[],
): BarNote[] {
  const { start, length } = steps[step].placed
  const own = notes.filter((n) => n.step === step)
  return own.map((n, k) => {
    const at = subDur(n.onset, start)
    const next = own[k + 1] ? subDur(own[k + 1].onset, start) : length
    return compareDur(addDur(at, n.length), next) < 0
      ? { note: n.note, at, length: n.length }
      : { note: n.note, at }
  })
}

// A bar's notes fitted to a chord's length: in order, none past the end,
// the first at the start.
function fitted(bar: BarNote[], length: Dur): BarNote[] {
  const sorted = [...bar]
    .sort((a, b) => compareDur(a.at, b.at))
    .filter((n) => compareDur(n.at, length) < 0)
    .filter((n, i, all) => compareDur(n.at, all[i + 1]?.at ?? length) < 0)
  if (sorted.length) sorted[0] = { ...sorted[0], at: ZERO }
  // A length of its own only while it stops before the next note.
  return sorted.map((n, i) => {
    if (!n.length) return n
    const span = subDur(sorted[i + 1]?.at ?? length, n.at)
    if (compareDur(n.length, span) < 0) return n
    const held = { ...n }
    delete held.length
    return held
  })
}

// A note tagged by what it is between the notes either side: a tone of
// the chord, a step away and back, a step on the way, a semitone into the
// next note, or else a note of your own.
function tagged(
  step: LineStep,
  index: number,
  note: Note,
  onset: Dur,
  length: Dur,
  prev?: Note,
  next?: Note,
): LineNote {
  const m = midiOf(note)
  const tone = tonesOf(step.chord).some(
    (t) => pitchClass(t.note) === pitchClass(note),
  )
  const over = (kind: Parameters<typeof noteOver>[5], why = '') =>
    noteOver(step, index, note, onset, length, kind, why)
  if (tone) return over('tone')
  if (prev && next) {
    const into = m - midiOf(prev)
    const out = midiOf(next) - m
    const steps = Math.abs(into) <= 2 && Math.abs(out) <= 2 && into !== 0
    if (steps && midiOf(prev) === midiOf(next)) {
      return over(
        'neighbour',
        `${name(note)}, a step ${into > 0 ? 'above' : 'below'} ${name(prev)}, steps back to it.`,
      )
    }
    if (steps && Math.sign(into) === Math.sign(out)) {
      return over(
        'passing',
        `${name(note)} passes by step from ${name(prev)} to ${name(next)}.`,
      )
    }
  }
  if (next && Math.abs(midiOf(next) - m) === 1) {
    return over(
      'approach',
      `${name(note)} leads by a semitone ${midiOf(next) > m ? 'up' : 'down'} into ${name(next)}.`,
    )
  }
  return over(
    'free',
    `${name(note)} isn’t a note of ${chordSymbol(step.chord)} and doesn’t step between the notes either side: a note of your own, for colour or tension.`,
  )
}

const midiOf = (n: Note) => midiNumber(n) as number

// The line with its edited bars in place of the mode's notes, each edited
// note tagged against its chord and the notes either side (the line
// repeats, so the last note leads into the first).
export function withBars(
  notes: LineNote[],
  steps: LineStep[],
  bars: Record<number, BarNote[]>,
): LineNote[] {
  const out: { note: LineNote; edited: boolean }[] = []
  steps.forEach((step, i) => {
    const bar = bars[i]
    if (!bar) {
      for (const n of notes)
        if (n.step === i) out.push({ note: n, edited: false })
      return
    }
    const { start, length } = step.placed
    const fit = fitted(bar, length)
    fit.forEach((b, k) => {
      const onset = addDur(start, b.at)
      const span = b.length ?? subDur(fit[k + 1]?.at ?? length, b.at)
      out.push({
        note: noteOver(step, i, b.note, onset, span, 'tone'),
        edited: true,
      })
    })
  })
  return out.map(({ note, edited }, k) => {
    if (!edited) return note
    const prev =
      out.length > 1 ? out[mod(k - 1, out.length)].note.note : undefined
    const next =
      out.length > 1 ? out[mod(k + 1, out.length)].note.note : undefined
    return tagged(
      steps[note.step],
      note.step,
      note.note,
      note.onset,
      note.length,
      prev,
      next,
    )
  })
}

// Whether a note starts where the chord changes or on a strong beat.
function onStrong(n: LineNote, steps: LineStep[]): boolean {
  const { placed } = steps[n.step]
  if (compareDur(n.onset, placed.start) === 0) return true
  return slotsOf(placed).some(
    (s) =>
      compareDur(s.at, n.onset) === 0 &&
      (s.strength === 'downbeat' || s.strength === 'strong'),
  )
}

// Notes for another note's place, best first: chord tones first where the
// chord changes or on a strong beat, then notes that step or lead into the
// next, the nearer the better, and notes outside the key last.
export function noteOptions(
  notes: LineNote[],
  index: number,
  steps: LineStep[],
  range: number[],
): Suggestion<LineNote>[] {
  const n = notes[index]
  const step = steps[n.step]
  const many = notes.length > 1
  const prev = many ? notes[mod(index - 1, notes.length)] : undefined
  const next = many ? notes[mod(index + 1, notes.length)] : undefined
  const strong = onStrong(n, steps)
  const atChange = compareDur(n.onset, step.placed.start) === 0
  const tones = tonesOf(step.chord)
  const options: Suggestion<LineNote>[] = []
  for (let m = n.midi - SWAP_REACH; m <= n.midi + SWAP_REACH; m++) {
    if (m === n.midi || m < range[0] - 2 || m > range[1] + 2) continue
    const tone = tones.find((t) => pitchClass(t.note) === mod(m, 12))
    const note = tone
      ? (noteAtMidi(tone.note, m) as Note)
      : spellPitch(step.key, m, next ? next.midi >= m : true)
    const candidate = tagged(
      step,
      n.step,
      note,
      n.onset,
      n.length,
      prev?.note,
      next?.note,
    )
    const ruleIds: string[] = []
    let score = 0
    const kind = candidate.tags[0]
    if (kind === 'chord-tone') {
      score += strong ? SWAP_SCORING.strongTone : SWAP_SCORING.tone
      ruleIds.push('line-swap-chord-tone')
    } else {
      if (kind === 'approach') score += SWAP_SCORING.approach
      else if (kind === 'free') score += SWAP_SCORING.free
      else score += SWAP_SCORING.step
      ruleIds.push(`line-swap-${kind}`)
      if (atChange) {
        score += SWAP_SCORING.offChange
        ruleIds.push('line-swap-off-change')
      }
    }
    if (candidate.tags.includes('chromatic')) {
      score += SWAP_SCORING.outside
      ruleIds.push('line-swap-outside')
    }
    const moves =
      (prev ? Math.abs(m - prev.midi) : 0) +
      (next ? Math.abs(next.midi - m) : 0)
    score += SWAP_SCORING.move * moves
    const contextNotes =
      atChange && kind !== 'chord-tone'
        ? [
            `It isn’t a note of ${chordSymbol(step.chord)}, so the line no longer lands on the chord as it changes.`,
          ]
        : []
    options.push(
      makeSuggestion({
        candidate,
        score,
        tags: candidate.tags,
        ruleIds,
        explanation: candidate.explanation,
        contextNotes,
      }),
    )
  }
  return options.sort((a, b) => b.score - a.score).slice(0, SWAP_SHOWN)
}

// Ways to add notes after a note, sharing its time, each the bar as it
// would be: a passing note, an approach into the next note, another chord
// tone, a run of scale steps or semitones into the next note, or the note
// struck again. None makes a note shorter than a semiquaver.
export function addOptions(
  notes: LineNote[],
  index: number,
  steps: LineStep[],
): Suggestion<BarNote[]>[] {
  const n = notes[index]
  const step = steps[n.step]
  const next = notes[mod(index + 1, notes.length)]
  const bar = barOf(notes, n.step, steps)
  const at = subDur(n.onset, step.placed.start)
  const place = bar.findIndex((b) => compareDur(b.at, at) === 0)
  const shortest = dur(...SHORTEST)
  const split = (added: Note[]): BarNote[] | undefined => {
    const part = dur(n.length.n, n.length.d * (added.length + 1))
    if (compareDur(part, shortest) < 0) return undefined
    const parts: BarNote[] = [n.note, ...added].map((note, k) => ({
      note,
      at: addDur(at, timesDur(part, k)),
    }))
    // A rest after the note stays after the last of its parts.
    if (bar[place].length) parts[parts.length - 1].length = part
    return [...bar.slice(0, place), ...parts, ...bar.slice(place + 1)]
  }
  const toward =
    next.midi === n.midi ? 'below' : next.midi > n.midi ? 'below' : 'above'
  const scale = passingNotes(step.key, n.note, next.note, false)
  const chromatic = passingNotes(step.key, n.note, next.note, true)
  const approach = approachNote(next.note, toward, step.key)
  const otherTone = tonesOf(step.chord)
    .flatMap((t) =>
      [-12, 0, 12].map(
        (o) => noteAtMidi(t.note, nearest(t.note, n.midi) + o) as Note,
      ),
    )
    .filter(
      (t) =>
        midiOf(t) !== n.midi &&
        midiOf(t) !== next.midi &&
        Math.abs(midiOf(t) - n.midi) <= SWAP_REACH,
    )
    .sort(
      (a, b) =>
        Math.abs(midiOf(a) - next.midi) - Math.abs(midiOf(b) - next.midi) ||
        Math.abs(midiOf(a) - n.midi) - Math.abs(midiOf(b) - n.midi),
    )[0]
  const added: Record<AddMoveId, Note[] | undefined> = {
    passing: scale.length
      ? [scale[Math.floor((scale.length - 1) / 2)]]
      : undefined,
    approach: midiOf(approach) !== n.midi ? [approach] : undefined,
    'chord-tone': otherTone ? [otherTone] : undefined,
    'scale-run':
      scale.length >= 2 && scale.length <= LONGEST_RUN ? scale : undefined,
    'chromatic-run':
      chromatic.length >= 2 && chromatic.length <= LONGEST_RUN
        ? chromatic
        : undefined,
    repeat: [n.note],
  }
  return ADD_MOVES.flatMap((move, order) => {
    const extra = added[move.id]
    const candidate = extra && split(extra)
    if (!extra || !candidate) return []
    return [
      makeSuggestion({
        candidate,
        score: ADD_MOVES.length - order,
        tags: ['add', move.id],
        ruleIds: [`line-add-${move.id}`],
        explanation: fillTemplate(move.explanation, {
          note: name(n.note),
          added: extra.map(name).join(' '),
          next: name(next.note),
          chord: chordSymbol(step.chord),
        }),
      }),
    ]
  })
}

// The pitch of a note's spelling nearest a pitch.
function nearest(spelling: Note, near: number): number {
  const pc = pitchClass(spelling)
  return near + (mod(pc - near + 6, 12) - 6)
}

// The bar without a note: the note before it holds on, or the next takes
// the start; none when it is the bar's only note.
export function removeNote(
  notes: LineNote[],
  index: number,
  steps: LineStep[],
): BarNote[] | undefined {
  const n = notes[index]
  const bar = barOf(notes, n.step, steps)
  if (bar.length < 2) return undefined
  const at = subDur(n.onset, steps[n.step].placed.start)
  const place = bar.findIndex((b) => compareDur(b.at, at) === 0)
  return fitted(
    bar.flatMap((b, k) => {
      if (k === place) return []
      if (k !== place - 1 || !b.length) return [b]
      // The note before holds on through it.
      const held = { ...b }
      delete held.length
      return [held]
    }),
    steps[n.step].placed.length,
  )
}

// A bar with one note in another's place.
export function swapNote(
  notes: LineNote[],
  index: number,
  steps: LineStep[],
  note: Note,
): BarNote[] {
  const n = notes[index]
  const at = subDur(n.onset, steps[n.step].placed.start)
  return barOf(notes, n.step, steps).map((b) =>
    compareDur(b.at, at) === 0 ? { ...b, note } : b,
  )
}
