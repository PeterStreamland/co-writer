// A melody as spelled notes in time (SPEC 7.2, 12): entered by tapping the
// instrument, typing note names or recording on MIDI. Onsets and lengths
// are exact fractions of a whole note from the start of the section.
import {
  ZERO,
  addDur,
  compareDur,
  dur,
  durEquals,
  ratioOf,
  subDur,
  timesDur,
  type Dur,
} from './duration'
import { spellPitch } from './lines'
import {
  barLength,
  meterOfBar,
  tempoUnit,
  type Meter,
  type MeterMap,
} from './meter'
import { letterIndex, midiNumber, parseNote, type Note } from './note'
import { keySignature, type Key } from './scale'
import {
  FIRST_OCTAVE,
  GRIDS,
  HOLD_WORDS,
  NOTE_VALUES,
  REST_WORDS,
  type GridId,
} from './melody-data'

export * from './melody-data'

export type MelodyNote = {
  note: Note
  onset: Dur
  length: Dur
  // Where it was held on over a note's place (David's request), from its
  // onset: no new note there, but the lane shows where the hold began.
  holds?: Dur[]
}

// Where the melody ends: the end of its last note, or the start.
export function melodyEnd(melody: MelodyNote[]): Dur {
  return melody.reduce((end, m) => {
    const e = addDur(m.onset, m.length)
    return compareDur(e, end) > 0 ? e : end
  }, ZERO)
}

// Step entry: a note after the last, or after a rest of `gap`.
export function appendNote(
  melody: MelodyNote[],
  note: Note,
  length: Dur,
  gap: Dur = ZERO,
): MelodyNote[] {
  return [...melody, { note, onset: addDur(melodyEnd(melody), gap), length }]
}

export function removeLast(melody: MelodyNote[]): MelodyNote[] {
  return melody.slice(0, -1)
}

// The octave for a note typed without one: the nearer to the note before,
// within a 4th by letter (C up to F, C down to G), as LilyPond's relative
// mode reads it.
export function nearestOctave(note: Note, from: Note): Note {
  const fromOctave = from.octave ?? FIRST_OCTAVE
  const fromStep = fromOctave * 7 + letterIndex(from.letter)
  let best = fromOctave
  for (const octave of [fromOctave - 1, fromOctave, fromOctave + 1]) {
    const step = octave * 7 + letterIndex(note.letter)
    const bestStep = best * 7 + letterIndex(note.letter)
    if (Math.abs(step - fromStep) < Math.abs(bestStep - fromStep)) best = octave
  }
  return { ...note, octave: best }
}

// Reads a typed melody: note names, each lasting `value`, r for a rest and
// - to hold the note before. Spelling is kept as typed; a note without an
// octave takes the nearer one to the note before (octave 4 for the first).
// Words it can't read are listed in `unknown`.
export function typeMelody(
  text: string,
  value: Dur,
  { start = ZERO, from }: { start?: Dur; from?: Note } = {},
): { notes: MelodyNote[]; unknown: string[] } {
  const notes: MelodyNote[] = []
  const unknown: string[] = []
  let at = start
  let previous = from
  let held: 'note' | 'rest' | undefined
  for (const word of text.split(/[\s,]+/).filter(Boolean)) {
    if (HOLD_WORDS.includes(word)) {
      const last = notes.at(-1)
      if (held === 'note' && last) last.length = addDur(last.length, value)
      at = addDur(at, value)
      continue
    }
    if (REST_WORDS.includes(word)) {
      at = addDur(at, value)
      held = 'rest'
      continue
    }
    const parsed = parseNote(word)
    if (!parsed) {
      unknown.push(word)
      continue
    }
    const note =
      parsed.octave !== undefined
        ? parsed
        : previous
          ? nearestOctave(parsed, previous)
          : { ...parsed, octave: FIRST_OCTAVE }
    notes.push({ note, onset: at, length: value })
    at = addDur(at, value)
    previous = note
    held = 'note'
  }
  return { notes, unknown }
}

// A pitch entered by tapping or playing, spelled for the key: the key's
// spelling where it has one, else a natural, else raised going up and
// lowered coming down. With no direction to go by, the key signature
// decides (sharps unless the key has flats).
export function spellMelodyPitch(
  key: Key,
  midi: number,
  direction?: 'up' | 'down',
): Note {
  const rising =
    direction === undefined ? (keySignature(key) ?? 0) >= 0 : direction === 'up'
  return spellPitch(key, midi, rising)
}

// The direction from one pitch to the next, if it moves.
function towards(
  from: number,
  to: number | undefined,
): 'up' | 'down' | undefined {
  if (to === undefined || to === from) return undefined
  return to > from ? 'up' : 'down'
}

// A tapped note's spelling, going by the note before it.
export function spellTapped(key: Key, midi: number, before?: Note): Note {
  const prev = before && midiNumber(before)
  const direction = prev === undefined ? undefined : towards(prev, midi)
  return spellMelodyPitch(key, midi, direction)
}

export function gridStep(grid: GridId): Dur {
  return (GRIDS.find((g) => g.id === grid) ?? GRIDS[0]).step
}

// A position in whole notes, rounded to the nearest grid step.
export function snapTo(wholes: number, step: Dur): Dur {
  return timesDur(step, Math.round(wholes / ratioOf(step, dur(1, 1))))
}

// Seconds at a tempo as whole notes: the tempo counts the meter's beat (a
// dotted crotchet in 6/8).
export function wholesIn(seconds: number, bpm: number, meter: Meter): number {
  return ((seconds * bpm) / 60) * ratioOf(tempoUnit(meter), dur(1, 1))
}

// A key pressed while recording, in seconds from the end of the count-in.
export type PlayedNote = { midi: number; on: number; off: number }

// Turns a recording into melody notes (SPEC 7.2): onsets and ends snapped
// to the grid; one note at a time, so notes struck together keep the
// highest and a note held into the next ends there, while one let go a
// grid step or less before the next lasts until it; never shorter than a
// grid step; nothing at or past the section's end, if it has one. Notes
// are spelled for the key, by the way the melody moves.
export function quantise(
  played: PlayedNote[],
  {
    bpm,
    meter,
    grid,
    key,
    end,
  }: { bpm: number; meter: Meter; grid: GridId; key: Key; end?: Dur },
): MelodyNote[] {
  const step = gridStep(grid)
  const snapped = played
    .map((p) => {
      const onset = snapTo(wholesIn(p.on, bpm, meter), step)
      let off = snapTo(wholesIn(p.off, bpm, meter), step)
      if (compareDur(off, onset) <= 0) off = addDur(onset, step)
      return { midi: p.midi, onset, off }
    })
    .filter((p) => !end || compareDur(p.onset, end) < 0)
    .sort((a, b) => compareDur(a.onset, b.onset) || b.midi - a.midi)
  const kept = snapped.filter(
    (p, i) => i === 0 || !durEquals(p.onset, snapped[i - 1].onset),
  )
  return kept.map((p, i) => {
    const next = kept[i + 1]
    let off = p.off
    // Held into the next note, or let go a grid step or less before it.
    if (next && compareDur(next.onset, addDur(off, step)) <= 0) {
      off = next.onset
    }
    if (end && compareDur(end, off) < 0) off = end
    const direction =
      towards(p.midi, next?.midi) ??
      (i > 0 ? towards(kept[i - 1].midi, p.midi) : undefined)
    return {
      note: spellMelodyPitch(key, p.midi, direction),
      onset: p.onset,
      length: subDur(off, p.onset),
    }
  })
}

// Which bar a position falls in (from 1), and where in that bar.
export function barPosition(
  map: MeterMap,
  at: Dur,
): { bar: number; offset: Dur } {
  let bar = 1
  let start = ZERO
  for (;;) {
    const next = addDur(start, barLength(meterOfBar(map, bar)))
    if (compareDur(next, at) > 0) return { bar, offset: subDur(at, start) }
    start = next
    bar++
  }
}

// The melody's notes grouped by the bar each starts in, in order.
export function melodyBars(
  melody: MelodyNote[],
  map: MeterMap,
): { bar: number; notes: number[] }[] {
  const bars: { bar: number; notes: number[] }[] = []
  melody.forEach((m, i) => {
    const { bar } = barPosition(map, m.onset)
    const last = bars.at(-1)
    if (last?.bar === bar) last.notes.push(i)
    else bars.push({ bar, notes: [i] })
  })
  return bars
}

// A length as a note value's symbol (♩, ♪.), or as a fraction.
export function valueSymbol(length: Dur): string {
  const value = NOTE_VALUES.find((v) => durEquals(v.length, length))
  return value ? value.symbol : `${length.n}/${length.d}`
}

// A length as a fraction of a whole note, as the lane shows it: 1/4, 3/8,
// 1 for a semibreve.
export function valueFraction(length: Dur): string {
  return length.d === 1 ? String(length.n) : `${length.n}/${length.d}`
}

// A length's name: "crotchet", or its fraction when it has no name.
export function valueName(length: Dur): string {
  const value = NOTE_VALUES.find((v) => durEquals(v.length, length))
  return value ? value.name : valueFraction(length)
}

// Silences a note: it goes, and the notes after it keep their places, so
// a rest is left where it was (David's request).
export function silenceNote(melody: MelodyNote[], index: number): MelodyNote[] {
  return melody.filter((_, i) => i !== index)
}

// A rest of `length` before a note: it and every note after it move later.
export function restBefore(
  melody: MelodyNote[],
  index: number,
  length: Dur,
): MelodyNote[] {
  return melody.map((m, i) =>
    i < index ? m : { ...m, onset: addDur(m.onset, length) },
  )
}

// Another note in a note's place, at its start and for its length.
export function swapMelodyNote(
  melody: MelodyNote[],
  index: number,
  note: Note,
): MelodyNote[] {
  return melody.map((m, i) => (i === index ? { ...m, note } : m))
}

// Holds the note before through a note's place (David's request): no new
// note is struck there, and the note before rings on to its end. The first
// note has nothing before it, so it falls silent.
export function holdOver(melody: MelodyNote[], index: number): MelodyNote[] {
  const gone = melody[index]
  if (!gone) return melody
  return melody.flatMap((m, i) => {
    if (i === index) return []
    if (i === index - 1) {
      const at = subDur(gone.onset, m.onset)
      const theirs = (gone.holds ?? []).map((h) => addDur(h, at))
      return [
        {
          ...m,
          length: subDur(addDur(gone.onset, gone.length), m.onset),
          holds: [...(m.holds ?? []), at, ...theirs],
        },
      ]
    }
    return [m]
  })
}

// A note made longer or shorter (David's request): the notes after it
// move along by the difference, so the rest of the melody keeps its
// rhythm and its rests. Holds past the new end go.
export function setNoteLength(
  melody: MelodyNote[],
  index: number,
  length: Dur,
): MelodyNote[] {
  const target = melody[index]
  if (!target) return melody
  const shift = subDur(length, target.length)
  return melody.map((m, i) => {
    if (i < index) return m
    if (i > index) return { ...m, onset: addDur(m.onset, shift) }
    const changed: MelodyNote = { ...m, length }
    const holds = (m.holds ?? []).filter((h) => compareDur(h, length) < 0)
    if (holds.length) changed.holds = holds
    else delete changed.holds
    return changed
  })
}
