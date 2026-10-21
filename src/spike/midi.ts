// Temporary Phase 0 spike helpers: pure, so they can be unit tested.
import { Chord, Midi } from 'tonal'

export type MidiEvent =
  | { type: 'on'; note: number; velocity: number }
  | { type: 'off'; note: number }
  | { type: 'other' }

export function parseMidiMessage(data: ArrayLike<number>): MidiEvent {
  const [status = 0, note = 0, velocity = 0] = Array.from(data)
  const command = status & 0xf0
  if (command === 0x90 && velocity > 0) return { type: 'on', note, velocity }
  // A note-on with velocity 0 is a note-off.
  if (command === 0x80 || command === 0x90) return { type: 'off', note }
  return { type: 'other' }
}

// Middle C is C4 = MIDI 60.
export function noteName(midi: number): string {
  return Midi.midiToNoteName(midi, { sharps: true })
}

export function chordNames(midiNotes: number[]): string[] {
  const sorted = [...midiNotes].sort((a, b) => a - b)
  const pitchClasses = sorted.map((n) =>
    Midi.midiToNoteName(n, { sharps: true, pitchClass: true }),
  )
  return Chord.detect([...new Set(pitchClasses)])
}
