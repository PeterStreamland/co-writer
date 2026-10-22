// A chord recorded on the MIDI keyboard (Record chords, SPEC 5): its best
// name for the key, as the MIDI panel shows it first, and the exact notes
// played, so the progression plays it back as voiced. No theory lives here.
import {
  noteAtMidi,
  pitchClass,
  type ChordName,
  type Key,
  type Note,
} from '../theory'
import type { ChordVoicing } from '../sketch/progression'
import { played } from './played'

export type Recorded = { chord: ChordName; voicing: ChordVoicing }

// Undefined when the notes have no chord name.
export function recordedChord(key: Key, midis: number[]): Recorded | undefined {
  const heard = played(key, midis)
  const best = heard.names[0]
  if (!best) return undefined
  const notes = [...midis]
    .sort((a, b) => a - b)
    .map((midi) => {
      const spelling = heard.notes.find((n) => pitchClass(n) === midi % 12)
      return noteAtMidi(spelling as Note, midi) as Note
    })
  return { chord: best.chord, voicing: { instrument: 'keyboard', notes } }
}
