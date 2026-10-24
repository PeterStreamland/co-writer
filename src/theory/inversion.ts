// Inversions (Phase 1 task 7). A chord inverts on its root, 3rd (or the 2nd
// or 4th of a sus chord), 5th and 6th or 7th; a 9th, 11th or 13th in the
// bass makes a slash chord, not an inversion (Fadd9/G is F/G, as the namer
// reads it). The bass keeps the chord's own spelling: Bbdim7/A𝄫.
import { chordIntervals } from './chord'
import type { ChordName } from './chord-symbol'
import { transpose } from './interval'
import type { Interval } from './interval'
import { midiNumber, noteAtMidi, pitchClass, type Note } from './note'

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

// The voicing a clicked chord plays: close position with the bass between F3
// and E4, so every chord sits around middle C. C is C4 E4 G4, F is F3 A3 C4,
// G/B is B3 D4 G4.
export function playbackVoicing(chord: ChordName): Note[] {
  const high = closeVoicing(chord, 4)
  const E4 = 64
  return (midiNumber(high[0]) as number) > E4 ? closeVoicing(chord, 3) : high
}

// One step through a chord's inversions (PLAN Phase 7 task 9, David's
// request): ▲ (1) puts the next chord tone in the bass, the nearest above
// the bass now, and ▼ (-1) the one before it, nearest below; the other
// tones stack closely above it, any 9th, 11th or 13th on top. So C goes
// C, C/E, C/G, then C an octave up. octave is 1 when a step up comes back
// round to root position (-1 when a step down leaves it), so the octaves
// moved can be counted. None for a slash chord over a note outside it.
export type InversionStep = {
  chord: ChordName
  notes: Note[]
  inversion: number
  octave: number
}

export function stepInversion(
  chord: ChordName,
  notes: Note[],
  by: 1 | -1,
): InversionStep | undefined {
  const at = inversionOf(chord)
  if (at === undefined || !notes.length) return undefined
  const { invertible } = splitTones(chord.root, chord.quality)
  const count = invertible.length
  const next = (((at + by) % count) + count) % count
  const octave = by > 0 && next === 0 ? 1 : by < 0 && at === 0 ? -1 : 0
  const bassNow = Math.min(...notes.map((n) => midiNumber(n) as number))
  const tone = invertible[next].note
  // The tone's pitch nearest the bass now, the way asked.
  let midi = bassNow - ((((bassNow - pitchClass(tone)) % 12) + 12) % 12)
  while (by > 0 ? midi <= bassNow : midi >= bassNow) midi += 12 * by
  const bass = noteAtMidi(tone, midi) as Note
  const name: ChordName = { root: chord.root, quality: chord.quality }
  if (next > 0) name.bass = { letter: tone.letter, accidental: tone.accidental }
  return {
    chord: name,
    notes: closeVoicing(name, bass.octave as number),
    inversion: next,
    octave,
  }
}

const ORDINALS = ['', '1st', '2nd', '3rd', '4th', '5th']

// What a chord's steps have made it (David's request: never mistake an
// inversion for an octave): "1st inversion", "+1 octave", "2nd inversion,
// −1 octave", or "root position" where it started.
export function inversionStepLabel(inversion: number, octave: number): string {
  const parts: string[] = []
  if (inversion > 0)
    parts.push(`${ORDINALS[inversion] ?? `${inversion}th`} inversion`)
  if (octave) {
    parts.push(
      `${octave > 0 ? '+' : '−'}${Math.abs(octave)} octave${Math.abs(octave) === 1 ? '' : 's'}`,
    )
  }
  return parts.join(', ') || 'root position'
}
