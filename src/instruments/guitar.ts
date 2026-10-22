// The guitar model (Phase 3): the tuning as spelled open strings, lowest
// first, plus a capo and the fret range to search. Frets are numbered from
// the nut, capo or not (SPEC 5). Pitches are derived from the spelled
// strings, never stored.
import {
  midiNumber,
  noteAtMidi,
  spellPitches,
  type Key,
  type Note,
} from '../theory'

export type FretRange = { low: number; high: number }

export type Guitar = {
  strings: Note[]
  capo: number // the fret the capo sits at; 0 for none
  frets: FretRange
}

export const MAX_FRET = 24
export const MAX_CAPO = 12
export const DEFAULT_FRET_RANGE: FretRange = { low: 0, high: 15 }

export function makeGuitar(
  strings: Note[],
  options: { capo?: number; low?: number; high?: number } = {},
): Guitar {
  const capo = options.capo ?? 0
  const low = options.low ?? DEFAULT_FRET_RANGE.low
  const high = options.high ?? DEFAULT_FRET_RANGE.high
  if (strings.length === 0) throw new RangeError('a guitar needs strings')
  if (strings.some((s) => s.octave === undefined)) {
    throw new RangeError('each open string needs an octave')
  }
  const whole = (n: number, max: number) =>
    Number.isInteger(n) && n >= 0 && n <= max
  if (!whole(capo, MAX_CAPO)) throw new RangeError(`capo must be 0–${MAX_CAPO}`)
  if (!whole(low, MAX_FRET) || !whole(high, MAX_FRET) || low > high) {
    throw new RangeError(`frets must run low to high within 0–${MAX_FRET}`)
  }
  if (capo >= high)
    throw new RangeError('the capo must sit below the last fret')
  return { strings, capo, frets: { low, high } }
}

export function stringCount(guitar: Guitar): number {
  return guitar.strings.length
}

// The frets a string can play, lowest first: the open string (or the capo's
// fret) and then the fretted range above it. The open string stays in even
// when the range starts up the neck; a fingering filter turns it off.
export function playableFrets(guitar: Guitar, string: number): number[] {
  if (!guitar.strings[string]) return []
  const frets = [guitar.capo]
  const from = Math.max(guitar.frets.low, guitar.capo + 1)
  for (let fret = from; fret <= guitar.frets.high; fret++) frets.push(fret)
  return frets
}

// The pitch a fret sounds, or undefined behind the capo, past the last fret
// or off the neck. The range's low end only narrows the search
// (playableFrets); the frets below it still sound.
export function fretMidi(
  guitar: Guitar,
  string: number,
  fret: number,
): number | undefined {
  const open = guitar.strings[string]
  if (!open || fret < guitar.capo || fret > guitar.frets.high) return undefined
  return (midiNumber(open) as number) + fret
}

// What each string sounds unfretted: the open string, or the capo's fret.
export function soundingOpenStrings(guitar: Guitar): number[] {
  return guitar.strings.map(
    (_, s) => fretMidi(guitar, s, guitar.capo) as number,
  )
}

// The open notes with the capo on, spelled by the key, each on its own as a
// lone note is: the scale's spelling, or else by the key signature.
export function capoNotes(guitar: Guitar, key: Key): Note[] {
  return soundingOpenStrings(guitar).map(
    (midi) => noteAtMidi(spellPitches([midi], key)[0], midi) as Note,
  )
}
