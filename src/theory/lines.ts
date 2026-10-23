// Lines (PLAN Phase 6 task 3, SPEC 7.4): bass lines, inner voices and
// lines between chords, laid over the beat grid. Each chord's beats are its
// slots (the chord's start, then each beat inside it), and every note fills
// one or more whole slots, so a line fits the beats exactly. Every line
// lands on a tone of each chord when it changes, except a pedal, which is
// tagged; every note is tagged (chord tone, passing, neighbour, approach,
// pedal) and explained, and one outside the key is tagged chromatic.
import { ownTones, type ArpeggioTone } from './arpeggio'
import { chordSymbol } from './chord'
import type { ChordName } from './chord-symbol'
import { addDur, compareDur, dur, subDur, timesDur, type Dur } from './duration'
import {
  degreeLabel,
  parseInterval,
  transpose,
  transposeDown,
  type Interval,
} from './interval'
import { seededRandom, voiceProgression } from './lens'
import {
  LINE_MODES,
  type LineDensity,
  type LineMode,
  type LineModeId,
} from './lines-data'
import type { BeatStrength, Placement } from './meter'
import {
  LETTERS,
  formatNote,
  letterIndex,
  midiNumber,
  mod,
  noteAtMidi,
  parseNote,
  pitchClass,
  type Note,
} from './note'
import { keyName } from './numeral'
import { scaleNotes, type Key } from './scale'

export * from './lines-data'

// 'free' marks a note you chose that is none of the others (an edit).
export type LineTag =
  | 'chord-tone'
  | 'passing'
  | 'neighbour'
  | 'approach'
  | 'pedal'
  | 'free'
  | 'chromatic'

// A chord of the line: what it is, its key, where it falls in the bars,
// and how many notes the line plays in it (unset: as the mode plays).
export type LineStep = {
  chord: ChordName
  key: Key
  placed: Placement
  density?: LineDensity
}

// A note of a line: spelled with its octave, when it starts and how long it
// lasts (fractions of a whole note from the start of the progression), the
// chord it sounds over, its tags, its interval above that chord's root, and
// why it is there.
export type LineNote = {
  note: Note
  midi: number
  onset: Dur
  length: Dur
  step: number
  tags: LineTag[]
  label: string
  explanation: string
}

export type Line = { mode: LineMode; notes: LineNote[] }

const SEMITONE = parseInterval('m2') as Interval
const WHOLE_TONE = parseInterval('M2') as Interval

export type Slot = { at: Dur; length: Dur; strength: BeatStrength | 'off' }

// A chord's slots: its start, then each beat inside it, each lasting to the
// next or to the chord's end. A density keeps only the start (held) or the
// strong beats, or splits each beat in two, or a dotted beat in three.
export function slotsOf(placed: Placement, density?: LineDensity): Slot[] {
  const end = addDur(placed.start, placed.length)
  const inner = placed.beats.filter(
    (b) =>
      compareDur(b.at, placed.start) > 0 &&
      (density !== 'strong' || isStrong(b.strength)),
  )
  const starts = [
    { at: placed.start, strength: placed.accent },
    ...(density === 'held'
      ? []
      : inner.map((b) => ({ at: b.at, strength: b.strength }))),
  ]
  const slots: Slot[] = starts.map((s, i) => ({
    ...s,
    length: subDur(starts[i + 1]?.at ?? end, s.at),
  }))
  if (density !== 'split') return slots
  return slots.flatMap((s) => {
    const parts = s.length.n % 3 === 0 ? 3 : 2
    const part = dur(s.length.n, s.length.d * parts)
    return Array.from({ length: parts }, (_, k) => ({
      at: addDur(s.at, timesDur(part, k)),
      length: part,
      strength: k === 0 ? s.strength : ('off' as const),
    }))
  })
}

// A downbeat or a strong beat.
function isStrong(strength: BeatStrength | 'off'): boolean {
  return strength === 'downbeat' || strength === 'strong'
}

const pitch = (n: Note) => midiNumber(n) as number

// The note's spelling in the octave nearest `near`, within the range.
function place(spelling: Note, near: number, [low, high]: number[]): Note {
  const pc = pitchClass(spelling)
  let best: number | undefined
  for (let m = low; m <= high; m++) {
    if (mod(m, 12) !== pc) continue
    if (best === undefined || Math.abs(m - near) < Math.abs(best - near)) {
      best = m
    }
  }
  return noteAtMidi(spelling, best ?? low + mod(pc - low, 12)) as Note
}

// The chord's tones up to the 7th (a 6th, 2nd or 4th where it has one).
export function tonesOf(chord: ChordName): ArpeggioTone[] {
  return ownTones(chord).filter((t) => t.number <= 7)
}

// The chord's tone of a number (3 for the 3rd), or the nearest stand-in: a
// sus chord's 2nd or 4th for its 3rd, the root when it has no 7th.
function toneNumbered(chord: ChordName, number: number): Note {
  const tones = tonesOf(chord)
  const stands: Record<number, number[]> = {
    3: [3, 4, 2, 5],
    5: [5],
    7: [7, 6, 1],
  }
  for (const n of stands[number] ?? [number]) {
    const found = tones.find((t) => t.number === n)
    if (found) return found.note
  }
  return chord.root
}

const ORDINALS: Record<number, string> = {
  1: 'root',
  2: '2nd',
  3: '3rd',
  4: '4th',
  5: '5th',
  6: '6th',
  7: '7th',
}

// Whether the key has the note as spelled (SPEC 4: notes keep their
// spelling, so E♯ isn't in C major though F is).
export function inKey(key: Key, note: Note): boolean {
  return scaleNotes(key.tonic, key.mode).some(
    (n) => n.letter === note.letter && n.accidental === note.accidental,
  )
}

// A pitch in a line, spelled: as the key spells it if the key has it,
// else as a natural, else raised going up and lowered coming down (C♯ on
// the way up to D, D♭ on the way down to C).
export function spellPitch(key: Key, midi: number, rising: boolean): Note {
  const pc = mod(midi, 12)
  const scale = scaleNotes(key.tonic, key.mode).find(
    (n) => pitchClass(n) === pc,
  )
  if (scale) return noteAtMidi(scale, midi) as Note
  const natural = LETTERS.find(
    (l) => pitchClass({ letter: l, accidental: 0 }) === pc,
  )
  if (natural)
    return noteAtMidi({ letter: natural, accidental: 0 }, midi) as Note
  const letter = LETTERS.find(
    (l) => pitchClass({ letter: l, accidental: rising ? 1 : -1 }) === pc,
  ) as Note['letter']
  return noteAtMidi({ letter, accidental: rising ? 1 : -1 }, midi) as Note
}

const name = (n: Note) => formatNote({ ...n, octave: undefined })

// A note of the line over a chord, tagged and explained. A chord tone says
// which tone it is; any other kind brings its own reason. A note outside
// the key is tagged chromatic and says so.
function lineNote(
  step: LineStep,
  index: number,
  note: Note,
  slots: Slot[],
  kind: NoteKind,
  why = '',
): LineNote {
  const first = slots[0]
  const last = slots[slots.length - 1]
  const length = subDur(addDur(last.at, last.length), first.at)
  return noteOver(step, index, note, first.at, length, kind, why)
}

export type NoteKind = Exclude<LineTag, 'chord-tone' | 'chromatic'> | 'tone'

// A note of the line from `onset` for `length`, tagged and explained as
// lineNote says.
export function noteOver(
  step: LineStep,
  index: number,
  note: Note,
  onset: Dur,
  length: Dur,
  kind: NoteKind,
  why = '',
): LineNote {
  const { chord, key } = step
  const symbol = chordSymbol(chord)
  const own = tonesOf(chord).find(
    (t) => pitchClass(t.note) === pitchClass(note),
  )
  const isTone = kind === 'tone' || (kind === 'pedal' && own !== undefined)
  const tags: LineTag[] = [isTone ? 'chord-tone' : kind]
  const parts = [
    isTone && own
      ? `${name(note)}, the ${ORDINALS[own.number] ?? own.label} of ${symbol}.`
      : why,
  ]
  if (!inKey(key, note)) {
    tags.push('chromatic')
    parts.push(`${name(note)} is outside ${keyName(key)}: a chromatic note.`)
  }
  return {
    note,
    midi: pitch(note),
    onset,
    length,
    step: index,
    tags,
    label: own ? own.label : degreeLabel(chord.root, note),
    explanation: parts.join(' '),
  }
}

// The note a semitone from a target, from below (F♯ to G) or above (A♭ to
// G), in the octave next to it: as the key spells it when the key has it
// (B into C, A into A♭ in C major), else spelled toward the target.
export function approachNote(
  target: Note,
  from: 'below' | 'above',
  key?: Key,
): Note {
  const midi = pitch(target) + (from === 'below' ? -1 : 1)
  const scale = key
    ? scaleNotes(key.tonic, key.mode).find(
        (n) => pitchClass(n) === mod(midi, 12),
      )
    : undefined
  const spelling =
    scale ??
    (from === 'below'
      ? transposeDown(target, SEMITONE)
      : transpose(target, SEMITONE))
  return noteAtMidi(spelling, midi) as Note
}

// A step above a target, in the octave above it: the key's note on the
// next letter up, unless that is more than a whole tone away (B over A♭ in
// C major), when the whole tone (B♭) is the step.
export function stepAbove(key: Key, target: Note): Note {
  const letter = LETTERS[mod(letterIndex(target.letter) + 1, 7)]
  const scale = scaleNotes(key.tonic, key.mode).find((n) => n.letter === letter)
  const near =
    scale && mod(pitchClass(scale) - pitchClass(target), 12) <= 2
      ? scale
      : undefined
  const spelling = near ?? transpose(target, WHOLE_TONE)
  const above = mod(pitchClass(spelling) - pitchClass(target), 12)
  return noteAtMidi(spelling, pitch(target) + above) as Note
}

// An enclosure of a target: the key's step above it, then the semitone
// below it.
export function enclosureOf(key: Key, target: Note): Note[] {
  return [stepAbove(key, target), approachNote(target, 'below', key)]
}

// The notes strictly between two pitches, from the first toward the
// second: the key's notes, or every semitone (spellPitch).
export function passingNotes(
  key: Key,
  from: Note,
  to: Note,
  chromatic: boolean,
): Note[] {
  const scale = scaleNotes(key.tonic, key.mode)
  const a = pitch(from)
  const b = pitch(to)
  const dir = Math.sign(b - a)
  const notes: Note[] = []
  for (let m = a + dir; dir !== 0 && m !== b; m += dir) {
    const inScale = scale.some((n) => pitchClass(n) === mod(m, 12))
    if (inScale || chromatic) notes.push(spellPitch(key, m, dir > 0))
  }
  return notes
}

export function rangeOf(mode: LineMode): number[] {
  return mode.range.map((n) => pitch(parseNote(n) as Note))
}

// The line for a mode over the progression's chords. The last chord leads
// back to the first, as the progression repeats.
// The Wildcard rolls with `random`; by default a seed from the chords
// themselves, so the same progression gives the same roll.
export function lineFor(
  id: LineModeId,
  steps: LineStep[],
  random: () => number = seededRandom(lineSeed(steps)),
): Line {
  const mode = LINE_MODES.find((m) => m.id === id)
  if (!mode) throw new Error(`unknown line mode ${id}`)
  const range = rangeOf(mode)
  const notes =
    mode.group === 'bass'
      ? bassLine(id, steps, range)
      : mode.group === 'inner'
        ? innerLine(id, steps, range)
        : betweenLine(id, steps, range, random)
  return { mode, notes: restrike(notes, steps) }
}

// With a density set, a note held over several slots is struck again on
// each (a root a beat, roots in 8ths), so the chord plays as many notes as
// asked.
function restrike(notes: LineNote[], steps: LineStep[]): LineNote[] {
  return notes.flatMap((n) => {
    const step = steps[n.step]
    if (!step.density) return [n]
    const end = addDur(n.onset, n.length)
    const starts = slotsOf(step.placed, step.density)
      .map((s) => s.at)
      .filter((at) => compareDur(at, n.onset) >= 0 && compareDur(at, end) < 0)
    return starts.map((at, k) => ({
      ...n,
      onset: at,
      length: subDur(starts[k + 1] ?? end, at),
    }))
  })
}

// A seed from the progression: its chords and where they fall.
export function lineSeed(steps: LineStep[]): number {
  const text = steps
    .map(
      (s) => `${chordSymbol(s.chord)}@${s.placed.start.n}/${s.placed.start.d}`,
    )
    .join(' ')
  let hash = 2166136261
  for (let i = 0; i < text.length; i++) {
    hash = Math.imul(hash ^ text.charCodeAt(i), 16777619)
  }
  return hash >>> 0
}

// The moves the Wildcard picks from, chord by chord.
const WILD_MOVES: LineModeId[] = ['scale-steps', 'chromatic', 'enclosure']
// How many of the best-fitting tones it may aim for.
const WILD_CHOICE = 3

function bassLine(
  id: LineModeId,
  steps: LineStep[],
  range: number[],
): LineNote[] {
  const notes: LineNote[] = []
  const middle = (range[0] + range[1]) / 2
  let last = range[0]
  steps.forEach((step, i) => {
    const slots = slotsOf(step.placed, step.density)
    const next = steps[(i + 1) % steps.length]
    const symbol = chordSymbol(step.chord)
    if (id === 'pedal') {
      const tonic = place(step.key.tonic, range[0], range)
      notes.push(
        lineNote(
          step,
          i,
          tonic,
          slots,
          'pedal',
          `${name(tonic)}, the key note, held under ${symbol}: a pedal, not one of its notes.`,
        ),
      )
      return
    }
    const root = place(step.chord.root, last, range)
    last = pitch(root)
    // The approach into the next root, on the chord's last slot.
    // The last chord leads back to the note the line actually starts on.
    const approach = (after: Note): LineNote => {
      const target =
        i === steps.length - 1 && notes[0]
          ? notes[0].note
          : place(next.chord.root, pitch(after), range)
      // From the side the line comes from, unless that note is the one
      // already sounding (E to F): then from the other side.
      let from: 'below' | 'above' =
        pitch(target) >= pitch(after) ? 'below' : 'above'
      if (pitch(approachNote(target, from, step.key)) === pitch(after)) {
        from = from === 'below' ? 'above' : 'below'
      }
      const note = approachNote(target, from, step.key)
      return lineNote(
        step,
        i,
        note,
        slots.slice(-1),
        'approach',
        `${name(note)} leads by a semitone ${from === 'below' ? 'up' : 'down'} into ${name(target)}, the root of ${chordSymbol(next.chord)}.`,
      )
    }
    if (id === 'roots' || slots.length === 1) {
      notes.push(lineNote(step, i, root, slots, 'tone'))
      return
    }
    if (id === 'root-fifth') {
      let split = slots.findIndex((s, k) => k > 0 && isStrong(s.strength))
      if (split < 0) split = Math.ceil(slots.length / 2)
      const fifth = place(toneNumbered(step.chord, 5), pitch(root), range)
      notes.push(lineNote(step, i, root, slots.slice(0, split), 'tone'))
      notes.push(lineNote(step, i, fifth, slots.slice(split), 'tone'))
      return
    }
    if (id === 'approach') {
      notes.push(lineNote(step, i, root, slots.slice(0, -1), 'tone'))
      notes.push(approach(root))
      return
    }
    // Walking: the root, then the chord's tones up (or down, high in the
    // range) a beat at a time, then the approach.
    const ladder: Note[] = []
    for (const t of tonesOf(step.chord)) {
      for (let m = range[0]; m <= range[1]; m++) {
        if (mod(m, 12) === pitchClass(t.note)) {
          ladder.push(noteAtMidi(t.note, m) as Note)
        }
      }
    }
    ladder.sort((a, b) => pitch(a) - pitch(b))
    let at = ladder.findIndex((n) => pitch(n) === pitch(root))
    let dir = pitch(root) < middle ? 1 : -1
    notes.push(lineNote(step, i, root, slots.slice(0, 1), 'tone'))
    let previous = root
    for (let k = 1; k < slots.length - 1; k++) {
      if (!ladder[at + dir]) dir = -dir
      at += dir
      previous = ladder[at]
      notes.push(lineNote(step, i, previous, [slots[k]], 'tone'))
    }
    notes.push(approach(previous))
    last = pitch(previous)
  })
  return notes
}

function innerLine(
  id: LineModeId,
  steps: LineStep[],
  range: number[],
): LineNote[] {
  if (id === 'tenor' || id === 'alto') {
    const voiced = voiceProgression(
      'classical',
      steps.map((s) => ({ key: s.key, chord: s.chord })),
    )
    const part = id === 'tenor' ? 1 : 2
    return steps.map((step, i) => {
      const sorted = [...voiced[i].voicing.notes].sort(
        (a, b) => pitch(a) - pitch(b),
      )
      const note = sorted[Math.min(part, sorted.length - 1)]
      return lineNote(step, i, note, slotsOf(step.placed, step.density), 'tone')
    })
  }
  // Guide tones: the first chord's 3rd or 7th, then each chord's 3rd or 7th,
  // whichever is nearer the last.
  const middle = (range[0] + range[1]) / 2
  let previous: Note | undefined
  return steps.map((step, i) => {
    const third = toneNumbered(step.chord, 3)
    const seventh = toneNumbered(step.chord, 7)
    let note: Note
    if (!previous) {
      note = place(id === 'guide-3rd' ? third : seventh, middle, range)
    } else {
      const near = pitch(previous)
      const options = [third, seventh].map((n) => place(n, near, range))
      note = options.reduce((a, b) =>
        Math.abs(pitch(b) - near) < Math.abs(pitch(a) - near) ? b : a,
      )
    }
    previous = note
    return lineNote(step, i, note, slotsOf(step.placed, step.density), 'tone')
  })
}

function betweenLine(
  mode: LineModeId,
  steps: LineStep[],
  range: number[],
  random: () => number,
): LineNote[] {
  const wild = mode === 'wildcard'
  const notes: LineNote[] = []
  // The line starts on the first chord's tone nearest the middle of its
  // lowest octave; each chord after starts on the tone the last led into.
  let start = nearestTone(steps[0].chord, range[0] + 6, range)
  steps.forEach((step, i) => {
    const slots = slotsOf(step.placed, step.density)
    const next = steps[(i + 1) % steps.length]
    const id = wild
      ? WILD_MOVES[Math.floor(random() * WILD_MOVES.length)]
      : mode
    // Scale steps and chromatic lines put a chord tone on every strong beat
    // and pass between them on the weak beats, the last stretch leading
    // into the next chord. An enclosure takes the chord's last beats.
    const strong =
      id === 'enclosure'
        ? [0]
        : slots.flatMap((s, k) => (k === 0 || isStrong(s.strength) ? [k] : []))
    let held: Slot[] = []
    strong.forEach((from, j) => {
      const to = strong[j + 1] ?? slots.length
      const lastStretch = j === strong.length - 1
      const toward = lastStretch ? next.chord : step.chord
      // Back at the top, the line leads into the note it started on.
      const wrap = lastStretch && i === steps.length - 1 ? notes[0] : undefined
      const { target, path } = leadInto(
        id,
        step.key,
        start,
        toward,
        to - from - 1,
        range,
        wild ? random : undefined,
        wrap?.note,
      )
      held.push(...slots.slice(from, to - path.length))
      const leads = path.length > 0 || pitch(target) !== pitch(start)
      if (leads || j === strong.length - 1) {
        if (held.length) notes.push(lineNote(step, i, start, held, 'tone'))
        held = []
      }
      const what = tonesOf(toward).find(
        (t) => pitchClass(t.note) === pitchClass(target),
      )
      const targetName = `${name(target)}, the ${ORDINALS[what?.number ?? 1]} of ${chordSymbol(toward)}`
      path.forEach((note, k) => {
        const slot = slots[to - path.length + k]
        if (id === 'enclosure') {
          const above = pitch(note) > pitch(target)
          notes.push(
            lineNote(
              step,
              i,
              note,
              [slot],
              'approach',
              `${name(note)}, a ${above ? 'step above' : 'semitone below'} ${targetName}, closes in on it from ${above ? 'above' : 'below'} (an enclosure).`,
            ),
          )
        } else if (pitch(target) === pitch(start)) {
          notes.push(
            lineNote(
              step,
              i,
              note,
              [slot],
              'neighbour',
              `${name(note)}, a ${pitch(note) > pitch(start) ? 'step above' : 'semitone below'} ${name(start)}, steps back to it: ${targetName}.`,
            ),
          )
        } else {
          notes.push(
            lineNote(
              step,
              i,
              note,
              [slot],
              'passing',
              `${name(note)} passes by ${id === 'chromatic' ? 'semitone' : 'step'} from ${name(start)} to ${targetName}.`,
            ),
          )
        }
      })
      start = target
    })
  })
  return notes
}

// The chord's tone nearest a pitch, within the range.
function nearestTone(chord: ChordName, near: number, range: number[]): Note {
  return tonesOf(chord)
    .map((t) => place(t.note, near, range))
    .reduce((a, b) =>
      Math.abs(pitch(b) - near) < Math.abs(pitch(a) - near) ? b : a,
    )
}

// Which tone of the next chord to lead into from `start`, and the notes on
// the way, in at most `room` slots. Scale steps and chromatic lines prefer
// a target whose path fills the room, then the nearest and the one nearer
// the middle of the range; a common tone gets a neighbour (the step above,
// or in a chromatic line the semitone below).
// Enclosures go to the nearest tone.
function leadInto(
  id: LineModeId,
  key: Key,
  start: Note,
  next: ChordName,
  room: number,
  range: number[],
  random?: () => number,
  only?: Note,
): { target: Note; path: Note[] } {
  const targets: Note[] = only ? [only] : []
  for (const t of only ? [] : tonesOf(next)) {
    for (let m = range[0]; m <= range[1]; m++) {
      if (mod(m, 12) === pitchClass(t.note)) {
        targets.push(noteAtMidi(t.note, m) as Note)
      }
    }
  }
  const distance = (t: Note) => Math.abs(pitch(t) - pitch(start))
  if (id === 'enclosure') {
    // The nearest tone, or by chance one of the nearest few.
    const near = [...targets].sort((a, b) => distance(a) - distance(b))
    const target = random
      ? near[Math.floor(random() * Math.min(WILD_CHOICE, near.length))]
      : near[0]
    // When the held note is already the step above, it is the enclosure's
    // upper half; only the semitone below follows.
    const [above, below] = enclosureOf(key, target)
    const upper = pitch(above) === pitch(start) ? [] : [above]
    const path = room >= 2 ? [...upper, below] : room === 1 ? [below] : []
    return { target, path: path.filter((n) => pitch(n) !== pitch(start)) }
  }
  const fits: { target: Note; path: Note[]; score: number }[] = []
  for (const target of targets) {
    const path =
      pitch(target) === pitch(start)
        ? room > 0
          ? [
              id === 'chromatic'
                ? approachNote(start, 'below', key)
                : stepAbove(key, start),
            ]
          : []
        : passingNotes(key, start, target, id === 'chromatic')
    if (path.length > room) continue
    // Unused room counts most, then the leap; staying put costs a little,
    // so the line moves to another tone where it can; straying more than a
    // 4th from the middle of the range costs as much as unused room, so a
    // long line turns round rather than climbing away.
    const drift = Math.abs(pitch(target) - (range[0] + range[1]) / 2)
    const stay = pitch(target) === pitch(start) ? 0.5 : 0
    const score =
      room -
      path.length +
      distance(target) * 0.1 +
      stay +
      Math.max(0, drift - 5)
    fits.push({ target, path, score })
  }
  // The best fit, or by chance one of the best few.
  fits.sort((a, b) => a.score - b.score)
  const chosen = random
    ? fits[Math.floor(random() * Math.min(WILD_CHOICE, fits.length))]
    : fits[0]
  return (
    chosen ?? {
      target: only ?? place(next.root, pitch(start), range),
      path: [],
    }
  )
}
