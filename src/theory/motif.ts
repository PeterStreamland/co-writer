// Motif options (PLAN Phase 7 task 3): find a motif in the melody, the
// notes that start in one bar, and offer it again in the next free bar as
// a repeat, a sequence (moved by scale steps in the key), with a changed
// ending, or upside down. Each option is a Suggestion, scored by how its
// notes sit on the chords where it lands, and kept inside the range.
import { chordNotes } from './chord-symbol'
import { addDur, compareDur, subDur, type Dur } from './duration'
import { barPosition, melodyEnd, type MelodyNote } from './melody'
import { accentAt, barLength, meterOfBar, type MeterMap } from './meter'
import {
  MOTIF_LABELS,
  MOTIF_MIN_NOTES,
  MOTIF_SCORING as S,
  MOTIF_TEXT,
  SEQUENCES_SHOWN,
  SEQUENCE_STEPS,
  type MotifKind,
} from './motif-data'
import {
  rankNextNotes,
  type MelodyRange,
  type NextNoteContext,
} from './next-note'
import {
  LETTERS,
  formatNote,
  letterIndex,
  midiNumber,
  mod,
  pitchClass,
  type Note,
} from './note'
import { scaleNotes, type Key } from './scale'
import { fillTemplate, makeSuggestion, type Suggestion } from './suggestion'

export * from './motif-data'

export type Motif = { bar: number; start: Dur; notes: MelodyNote[] }

export type MotifOption = {
  kind: MotifKind
  steps?: number // a sequence's scale steps
  notes: MelodyNote[]
}

export type MotifSuggestion = Suggestion<MotifOption>

const midiOf = (n: Note) => midiNumber(n) as number

// Every motif in the melody: each bar with at least two notes starting in
// it, in order.
export function motifsIn(melody: MelodyNote[], time: MeterMap): Motif[] {
  const bars = new Map<number, Motif>()
  for (const m of melody) {
    const { bar, offset } = barPosition(time, m.onset)
    const motif = bars.get(bar) ?? {
      bar,
      start: subDur(m.onset, offset),
      notes: [],
    }
    motif.notes.push(m)
    bars.set(bar, motif)
  }
  return [...bars.values()].filter((b) => b.notes.length >= MOTIF_MIN_NOTES)
}

// A motif's rhythm: where each note falls in its bar, and how long it is.
function rhythmOf(motif: Motif): string {
  return motif.notes
    .map((n) => {
      const at = subDur(n.onset, motif.start)
      return `${at.n}/${at.d}:${n.length.n}/${n.length.d}`
    })
    .join(' ')
}

// The motif to offer: the bar whose rhythm comes back most, else the
// earliest.
export function mainMotif(
  melody: MelodyNote[],
  time: MeterMap,
): Motif | undefined {
  const all = motifsIn(melody, time)
  const counts = new Map<string, number>()
  for (const m of all) {
    const r = rhythmOf(m)
    counts.set(r, (counts.get(r) ?? 0) + 1)
  }
  let best: Motif | undefined
  for (const m of all) {
    if (!best || counts.get(rhythmOf(m))! > counts.get(rhythmOf(best))!) {
      best = m
    }
  }
  return best
}

// A note moved by scale steps in the key, keeping any alteration it has
// from the key (G♯ in A minor a step up is A♯). Seven-note scales only.
export function transposeDiatonic(note: Note, steps: number, key: Key): Note {
  const scale = scaleNotes(key.tonic, key.mode)
  const target = letterIndex(note.letter) + steps
  const letter = LETTERS[mod(target, 7)]
  const from = scale.find((n) => n.letter === note.letter)
  const to = scale.find((n) => n.letter === letter)
  const offset = note.accidental - (from?.accidental ?? 0)
  return {
    letter,
    accidental: (to?.accidental ?? 0) + offset,
    octave: (note.octave ?? 4) + Math.floor(target / 7),
  }
}

// Each note's scale steps from the first, mirrored.
export function upsideDown(notes: Note[], key: Key): Note[] {
  const first = notes[0]
  const step = (n: Note) => (n.octave ?? 4) * 7 + letterIndex(n.letter)
  return notes.map((n) =>
    transposeDiatonic(n, -2 * (step(n) - step(first)), key),
  )
}

// The options in the range: as they are, or moved by an octave or two.
function inRange(
  notes: MelodyNote[],
  range: MelodyRange,
  near: number | undefined,
): { notes: MelodyNote[]; moved: boolean } | undefined {
  const low = midiOf(range.low)
  const high = midiOf(range.high)
  const fits = (by: number) =>
    notes.every((n) => {
      const m = midiOf(n.note) + by
      return m >= low && m <= high
    })
  const shift = (by: number) =>
    notes.map((n) => ({
      ...n,
      note: { ...n.note, octave: (n.note.octave ?? 4) + by / 12 },
    }))
  if (fits(0)) return { notes, moved: false }
  const tries = [-12, 12, -24, 24].filter(fits)
  if (!tries.length) return undefined
  const first = midiOf(notes[0].note)
  tries.sort(
    (a, b) =>
      Math.abs(first + a - (near ?? first)) -
      Math.abs(first + b - (near ?? first)),
  )
  return { notes: shift(tries[0]), moved: true }
}

// Where the options start: the next bar line at or after the melody's end
// (and any rest waiting).
function nextBar(time: MeterMap, end: Dur): { bar: number; start: Dur } {
  const { bar, offset } = barPosition(time, end)
  if (offset.n === 0) return { bar, start: end }
  return {
    bar: bar + 1,
    start: addDur(subDur(end, offset), barLength(meterOfBar(time, bar))),
  }
}

const ORDINAL: Record<number, string> = {
  2: '2nd',
  3: '3rd',
  4: '4th',
  5: '5th',
  6: '6th',
  7: '7th',
}

// The motif's options in the next free bar, best first: a repeat, the
// best sequences, a changed ending and upside down; each in the range.
export function motifOptions(
  ctx: Omit<NextNoteContext, 'length'>,
  motif: Motif | undefined = mainMotif(ctx.melody, ctx.time),
): MotifSuggestion[] {
  if (!motif) return []
  const { melody, chords, time, range } = ctx
  const end = addDur(melodyEnd(melody), ctx.gap ?? { n: 0, d: 1 })
  const { bar: to, start } = nextBar(time, end)
  const last = melody.at(-1)
  const near = last && midiOf(last.note)
  const placed = (notes: Note[]): MelodyNote[] =>
    motif.notes.map((m, i) => ({
      note: notes[i],
      onset: addDur(start, subDur(m.onset, motif.start)),
      length: m.length,
    }))
  const keyAt = (at: Dur): Key =>
    chords.find(
      (c) =>
        compareDur(c.start, at) <= 0 &&
        compareDur(at, addDur(c.start, c.length)) < 0,
    )?.key ??
    chords.at(-1)?.key ??
    ctx.key
  const key = keyAt(start)
  const sevenNotes = scaleNotes(key.tonic, key.mode).length === 7
  // How the notes sit on the chords where they land.
  const fit = (notes: MelodyNote[]) => {
    let score = 0
    for (const n of notes) {
      const chord = chords.find(
        (c) =>
          compareDur(c.start, n.onset) <= 0 &&
          compareDur(n.onset, addDur(c.start, c.length)) < 0,
      )?.chord
      if (!chord) continue
      const tone = [...chordNotes(chord), ...(chord.bass ? [chord.bass] : [])]
        .map(pitchClass)
        .includes(pitchClass(n.note))
      const { bar, offset } = barPosition(time, n.onset)
      const accent = accentAt(meterOfBar(time, bar), offset)
      const strong = accent === 'downbeat' || accent === 'strong'
      if (strong) score += tone ? S.strongTone : S.strongNonTone
      else if (tone) score += S.tone
    }
    return score
  }
  const values = { bar: String(motif.bar), to: String(to) }
  const make = (
    kind: MotifKind,
    notes: Note[],
    extra: Record<string, string> = {},
    steps?: number,
  ): MotifSuggestion | undefined => {
    const fitted = inRange(placed(notes), range, near)
    if (!fitted) return undefined
    let score = S.base[kind] + fit(fitted.notes)
    if (near !== undefined) {
      score += S.distance * Math.abs(midiOf(fitted.notes[0].note) - near)
    }
    if (fitted.moved) score += S.octave
    const ruleIds = [`motif-${kind}`]
    if (fitted.moved) ruleIds.push('motif-octave')
    const option: MotifOption = { kind, notes: fitted.notes }
    if (steps !== undefined) option.steps = steps
    return makeSuggestion({
      candidate: option,
      score: Math.round(score * 1000) / 1000,
      tags: ['motif', kind],
      ruleIds,
      explanation:
        fillTemplate(MOTIF_TEXT[kind], { ...values, ...extra }) +
        (fitted.moved ? ' Moved by an octave to stay in range.' : ''),
    })
  }
  const notes = motif.notes.map((m) => m.note)
  const out: MotifSuggestion[] = []
  const repeat = make('repeat', notes)
  if (repeat) out.push(repeat)
  if (sevenNotes) {
    const sequences = SEQUENCE_STEPS.flatMap((steps) => {
      const s = make(
        'sequence',
        notes.map((n) => transposeDiatonic(n, steps, key)),
        {
          move: `${steps > 0 ? 'up' : 'down'} a ${ORDINAL[Math.abs(steps) + 1]}`,
        },
        steps,
      )
      return s ? [s] : []
    }).sort((a, b) => b.score - a.score)
    out.push(...sequences.slice(0, SEQUENCES_SHOWN))
  }
  // A changed ending: the best next note for the last note's place.
  const head = placed(notes).slice(0, -1)
  const lastPlaced = placed(notes).at(-1)!
  const prefix = [...melody, ...head]
  const ending = rankNextNotes({
    ...ctx,
    melody: prefix,
    length: lastPlaced.length,
    gap: subDur(lastPlaced.onset, melodyEnd(prefix)),
  }).find((s) => midiOf(s.candidate.note) !== midiOf(lastPlaced.note))
  if (ending) {
    const changed = make(
      'changed-ending',
      [...notes.slice(0, -1), ending.candidate.note],
      {
        note: formatNote(ending.candidate.note),
        from: formatNote(lastPlaced.note),
      },
    )
    if (changed) out.push(changed)
  }
  if (sevenNotes) {
    const flipped = make('upside-down', upsideDown(notes, key))
    if (flipped) out.push(flipped)
  }
  return out.sort((a, b) => b.score - a.score)
}

// An option's name: "Repeat", "Sequence up a 3rd".
export function motifLabel(option: MotifOption): string {
  const label = MOTIF_LABELS[option.kind]
  if (option.steps === undefined) return label
  const way = option.steps > 0 ? 'up' : 'down'
  return `${label} ${way} a ${ORDINAL[Math.abs(option.steps) + 1]}`
}

// "C♯4 D4": an option's notes as text.
export function motifText(notes: MelodyNote[]): string {
  return notes.map((n) => formatNote(n.note)).join(' ')
}
