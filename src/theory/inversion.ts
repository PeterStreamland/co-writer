// Inversions (Phase 1 task 7). A chord inverts on its root, 3rd (or the 2nd
// or 4th of a sus chord), 5th and 6th or 7th; a 9th, 11th or 13th in the
// bass makes a slash chord, not an inversion (Fadd9/G is F/G, as the namer
// reads it). The bass keeps the chord's own spelling: Bbdim7/A𝄫.
import { chordIntervals } from './chord'
import type { ChordName } from './chord-symbol'
import { transpose } from './interval'
import type { Interval } from './interval'
import { midiNumber, pitchClass, type Note } from './note'

// A chord with one of its tones in the bass. inversion is 0 for root
// position, 1 for the first inversion and so on; bassTone is the bass's
// interval number above the root (3 for the 3rd).
export type Inversion = {
  inversion: number
  bassTone: number
  chord: ChordName
}

const INVERSION_NAMES = [
  'root position',
  'first inversion',
  'second inversion',
  'third inversion',
]

function requireIntervals(quality: string): Interval[] {
  const intervals = chordIntervals(quality)
  if (!intervals) throw new Error(`unknown chord quality ${quality}`)
  return intervals
}

// The tones that can go in the bass, in inversion order, and the 9ths, 11ths
// and 13ths that stay above them.
function splitTones(root: Note, quality: string) {
  const intervals = [...requireIntervals(quality)].sort(
    (a, b) => a.number - b.number,
  )
  const tones = intervals.map((i) => ({
    number: i.number,
    note: transpose(root, i),
  }))
  return {
    invertible: tones.filter((t) => t.number <= 7),
    upper: tones.filter((t) => t.number > 7),
  }
}

// 'root position', 'first inversion', 'second inversion', 'third inversion'.
export function inversionName(inversion: number): string {
  return INVERSION_NAMES[inversion] ?? `inversion ${inversion}`
}

// Every inversion of a chord, root position first: C, C/E, C/G. Any bass on
// the chord given is ignored.
export function inversions(chord: {
  root: Note
  quality: string
}): Inversion[] {
  const { root, quality } = chord
  return splitTones(root, quality).invertible.map((tone, inversion) => {
    const name: ChordName = { root, quality }
    if (inversion > 0) name.bass = tone.note
    return { inversion, bassTone: tone.number, chord: name }
  })
}

// Which inversion a chord is: 0 with no bass or the root in the bass, 1 for
// C/E. A bass that matches a chord tone by pitch counts, as chord symbols read
// it (Caug/A♭ is a second inversion). Undefined when the bass is outside the
// chord or is a 9th, 11th or 13th: a slash chord such as F/G.
export function inversionOf(chord: ChordName): number | undefined {
  if (!chord.bass) return 0
  const bass = pitchClass(chord.bass)
  const at = splitTones(chord.root, chord.quality).invertible.findIndex(
    (t) => pitchClass(t.note) === bass,
  )
  return at < 0 ? undefined : at
}

// The note's spelling at the lowest octave above a MIDI number.
function above(note: Note, floor: number): Note {
  const placed = { ...note, octave: -1 }
  while ((midiNumber(placed) as number) <= floor) placed.octave += 1
  return placed
}

// A close-position voicing with octaves: the bass at the octave given, then
// the other chord tones in order, each the next one up, then any 9th, 11th or
// 13th above them. C/E at octave 4 is E4 G4 C5; a bass outside the chord sits
// under it in root position, so F/G at octave 2 is G2 F3 A3 C4.
export function closeVoicing(chord: ChordName, octave: number): Note[] {
  const { invertible, upper } = splitTones(chord.root, chord.quality)
  const at = inversionOf(chord)
  const bass: Note = { ...(chord.bass ?? chord.root), octave }
  const rest =
    at === undefined
      ? invertible
      : [...invertible.slice(at + 1), ...invertible.slice(0, at)]
  const voicing = [bass]
  for (const tone of [...rest, ...upper]) {
    const previous = midiNumber(voicing[voicing.length - 1]) as number
    voicing.push(above(tone.note, previous))
  }
  return voicing
}
