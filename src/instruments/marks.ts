// What an instrument view shows on each pitch: whether it's in the scale,
// the root, or a tone of the current chord, spelled as the key spells it.
// Pure: no UI, audio or DOM imports.
import {
  chordNotes,
  degreeLabel,
  formatNote,
  noteAtMidi,
  pitchClass,
  scaleNotes,
  type ChordName,
  type Key,
  type Note,
} from '../theory'

export type Mark = {
  note: Note // spelled, with the octave that sounds the pitch
  name: string // C♯
  degree: string // ♭3
  root: boolean
  inScale: boolean
  chordTone: boolean
}

// A function from MIDI number to its mark, or undefined for a pitch that is
// neither in the scale nor in the current chord. A pitch in the scale takes
// the scale's spelling; a chord tone outside the scale takes the chord's.
export function noteMarker(
  key: Key,
  chord?: ChordName,
): (midi: number) => Mark | undefined {
  const scale = scaleNotes(key.tonic, key.mode)
  const tones = chord ? chordNotes(chord) : []
  if (chord?.bass) tones.push(chord.bass)
  const rootPitch = pitchClass(key.tonic)
  const scalePitches = new Set(scale.map(pitchClass))
  const tonePitches = new Set(tones.map(pitchClass))
  return (midi) => {
    const pitch = ((midi % 12) + 12) % 12
    const spelling =
      scale.find((n) => pitchClass(n) === pitch) ??
      tones.find((n) => pitchClass(n) === pitch)
    if (!spelling) return undefined
    const note = noteAtMidi(spelling, midi) as Note
    return {
      note,
      name: formatNote(spelling),
      degree: degreeLabel(key.tonic, spelling),
      root: pitch === rootPitch,
      inScale: scalePitches.has(pitch),
      chordTone: tonePitches.has(pitch),
    }
  }
}
