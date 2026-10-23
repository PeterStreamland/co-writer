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
import { addDur, compareDur, subDur, type Dur } from './duration'
import {
  degreeLabel,
  parseInterval,
  transpose,
  transposeDown,
  type Interval,
} from './interval'
import { voiceProgression } from './lens'
import { LINE_MODES, type LineMode, type LineModeId } from './lines-data'
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

export type LineTag =
  'chord-tone' | 'passing' | 'neighbour' | 'approach' | 'pedal' | 'chromatic'

// A chord of the line: what it is, its key, and where it falls in the bars.
export type LineStep = { chord: ChordName; key: Key; placed: Placement }

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
const AUGMENTED_UNISON = parseInterval('A1') as Interval
const WHOLE_TONE = parseInterval('M2') as Interval

type Slot = { at: Dur; length: Dur; strength: BeatStrength | 'off' }

// A chord's slots: its start, then each beat inside it, each lasting to the
// next or to the chord's end.
function slotsOf(placed: Placement): Slot[] {
  const end = addDur(placed.start, placed.length)
  const inner = placed.beats.filter((b) => compareDur(b.at, placed.start) > 0)
  const starts = [
    { at: placed.start, strength: placed.accent },
    ...inner.map((b) => ({ at: b.at, strength: b.strength })),
  ]
  return starts.map((s, i) => ({
    ...s,
    length: subDur(starts[i + 1]?.at ?? end, s.at),
  }))
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
function tonesOf(chord: ChordName): ArpeggioTone[] {
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

function inKey(key: Key, note: Note): boolean {
  return scaleNotes(key.tonic, key.mode).some(
    (n) => pitchClass(n) === pitchClass(note),
  )
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
  kind: Exclude<LineTag, 'chord-tone' | 'chromatic'> | 'tone',
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
  const first = slots[0]
  const last = slots[slots.length - 1]
  return {
    note,
    midi: pitch(note),
    onset: first.at,
    length: subDur(addDur(last.at, last.length), first.at),
    step: index,
    tags,
    label: own ? own.label : degreeLabel(chord.root, note),
    explanation: parts.join(' '),
  }
}

// The note a semitone from a target, from below (F♯ to G) or above (A♭ to
// G), spelled toward it, in the octave next to it.
export function approachNote(target: Note, from: 'below' | 'above'): Note {
  const spelling =
    from === 'below'
      ? transposeDown(target, SEMITONE)
      : transpose(target, SEMITONE)
  return noteAtMidi(
    spelling,
    pitch(target) + (from === 'below' ? -1 : 1),
  ) as Note
}

// The key's note a step above a target (its next letter up), in the octave
// above it.
function stepAbove(key: Key, target: Note): Note {
  const letter = LETTERS[mod(letterIndex(target.letter) + 1, 7)]
  const scale = scaleNotes(key.tonic, key.mode).find((n) => n.letter === letter)
  const spelling = scale ?? transpose(target, WHOLE_TONE)
  const above = mod(pitchClass(spelling) - pitchClass(target), 12)
  return noteAtMidi(spelling, pitch(target) + above) as Note
}

// An enclosure of a target: the key's step above it, then the semitone
// below it.
export function enclosureOf(key: Key, target: Note): Note[] {
  return [stepAbove(key, target), approachNote(target, 'below')]
}

// The notes strictly between two pitches, from the first toward the
// second: the key's notes, or every semitone (spelled as the key does, or
// as a raised note going up and a lowered one coming down).
function between(key: Key, from: Note, to: Note, chromatic: boolean): Note[] {
  const scale = scaleNotes(key.tonic, key.mode)
  const a = pitch(from)
  const b = pitch(to)
  const dir = Math.sign(b - a)
  const notes: Note[] = []
  let previous = from
  for (let m = a + dir; dir !== 0 && m !== b; m += dir) {
    const inScale = scale.find((n) => pitchClass(n) === mod(m, 12))
    if (inScale) {
      previous = noteAtMidi(inScale, m) as Note
      notes.push(previous)
    } else if (chromatic) {
      const spelling =
        dir > 0
          ? transpose(previous, AUGMENTED_UNISON)
          : transposeDown(previous, AUGMENTED_UNISON)
      previous = noteAtMidi(spelling, m) as Note
      notes.push(previous)
    }
  }
  return notes
}

function rangeOf(mode: LineMode): number[] {
  return mode.range.map((n) => pitch(parseNote(n) as Note))
}

// The line for a mode over the progression's chords. The last chord leads
// back to the first, as the progression repeats.
export function lineFor(id: LineModeId, steps: LineStep[]): Line {
  const mode = LINE_MODES.find((m) => m.id === id)
  if (!mode) throw new Error(`unknown line mode ${id}`)
  const range = rangeOf(mode)
  const notes =
    mode.group === 'bass'
      ? bassLine(id, steps, range)
      : mode.group === 'inner'
        ? innerLine(id, steps, range)
        : betweenLine(id, steps, range)
  return { mode, notes }
}

function bassLine(
  id: LineModeId,
  steps: LineStep[],
  range: number[],
): LineNote[] {
  const notes: LineNote[] = []
  const middle = (range[0] + range[1]) / 2
  let last = range[0]
  steps.forEach((step, i) => {
    const slots = slotsOf(step.placed)
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
    const approach = (after: Note): LineNote => {
      const target = place(next.chord.root, pitch(after), range)
      // From the side the line comes from, unless that note is the one
      // already sounding (E to F): then from the other side.
      let from: 'below' | 'above' =
        pitch(target) >= pitch(after) ? 'below' : 'above'
      if (pitch(approachNote(target, from)) === pitch(after)) {
        from = from === 'below' ? 'above' : 'below'
      }
      const note = approachNote(target, from)
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
      let split = slots.findIndex((s, k) => k > 0 && s.strength !== 'weak')
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
      return lineNote(step, i, note, slotsOf(step.placed), 'tone')
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
    return lineNote(step, i, note, slotsOf(step.placed), 'tone')
  })
}

function betweenLine(
  id: LineModeId,
  steps: LineStep[],
  range: number[],
): LineNote[] {
  const notes: LineNote[] = []
  // The line starts on the first chord's tone nearest the middle of its
  // lowest octave; each chord after starts on the tone the last led into.
  let start = nearestTone(steps[0].chord, range[0] + 6, range)
  steps.forEach((step, i) => {
    const slots = slotsOf(step.placed)
    const next = steps[(i + 1) % steps.length]
    const room = slots.length - 1
    const { target, path } = leadInto(
      id,
      step.key,
      start,
      next.chord,
      room,
      range,
    )
    const held = slots.slice(0, slots.length - path.length)
    notes.push(lineNote(step, i, start, held, 'tone'))
    const nextSymbol = chordSymbol(next.chord)
    const what = tonesOf(next.chord).find(
      (t) => pitchClass(t.note) === pitchClass(target),
    )
    const targetName = `${name(target)}, the ${ORDINALS[what?.number ?? 1]} of ${nextSymbol}`
    path.forEach((note, k) => {
      const slot = slots[held.length + k]
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
            `${name(note)}, a step above ${name(start)}, steps back to it: ${targetName}.`,
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
// the middle of the range; a common tone gets a neighbour above it.
// Enclosures go to the nearest tone.
function leadInto(
  id: LineModeId,
  key: Key,
  start: Note,
  next: ChordName,
  room: number,
  range: number[],
): { target: Note; path: Note[] } {
  const targets: Note[] = []
  for (const t of tonesOf(next)) {
    for (let m = range[0]; m <= range[1]; m++) {
      if (mod(m, 12) === pitchClass(t.note)) {
        targets.push(noteAtMidi(t.note, m) as Note)
      }
    }
  }
  const distance = (t: Note) => Math.abs(pitch(t) - pitch(start))
  if (id === 'enclosure') {
    const target = targets.reduce((a, b) => (distance(b) < distance(a) ? b : a))
    // When the held note is already the step above, it is the enclosure's
    // upper half; only the semitone below follows.
    const [above, below] = enclosureOf(key, target)
    const upper = pitch(above) === pitch(start) ? [] : [above]
    const path = room >= 2 ? [...upper, below] : room === 1 ? [below] : []
    return { target, path: path.filter((n) => pitch(n) !== pitch(start)) }
  }
  let best: { target: Note; path: Note[]; score: number } | undefined
  for (const target of targets) {
    const path =
      pitch(target) === pitch(start)
        ? room > 0
          ? [stepAbove(key, start)]
          : []
        : between(key, start, target, id === 'chromatic')
    if (path.length > room) continue
    // Unused room counts most, then the leap; straying more than a 4th
    // from the middle of the range costs as much as unused room, so a long
    // line turns round rather than climbing away.
    const drift = Math.abs(pitch(target) - (range[0] + range[1]) / 2)
    const score =
      room - path.length + distance(target) * 0.1 + Math.max(0, drift - 5)
    if (!best || score < best.score) best = { target, path, score }
  }
  return best ?? { target: place(next.root, pitch(start), range), path: [] }
}
