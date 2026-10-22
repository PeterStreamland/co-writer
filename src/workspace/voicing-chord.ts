// The chord a shape or voicing spells: its lowest note becomes the bass,
// so adding a box's shape to the progression keeps its inversion (C/E for
// a first-inversion C).
import {
  chordNotes,
  midiNumber,
  pitchClass,
  type ChordName,
  type Note,
} from '../theory'

export function chordWithBass(
  chord: ChordName,
  notes: readonly (Note | null)[],
): ChordName {
  const plain: ChordName = { root: chord.root, quality: chord.quality }
  const sounding = notes.filter((n): n is Note => n !== null)
  const lowest = sounding.reduce<Note | undefined>(
    (low, n) =>
      low === undefined || (midiNumber(n) ?? 0) < (midiNumber(low) ?? 0)
        ? n
        : low,
    undefined,
  )
  if (!lowest || pitchClass(lowest) === pitchClass(chord.root)) return plain
  // Spell the bass as the chord spells that tone (E, not F♭, under C).
  const tone = chordNotes(plain).find(
    (n) => pitchClass(n) === pitchClass(lowest),
  )
  const bass = tone ?? lowest
  return {
    ...plain,
    bass: { letter: bass.letter, accidental: bass.accidental },
  }
}
