// Notes to sounding frequencies, for playback. Equal temperament, A4 = 440 Hz.
import { midiNumber, type Note } from '../theory'

export function frequency(note: Note): number {
  const midi = midiNumber(note)
  if (midi === undefined) throw new Error('a note needs an octave to sound')
  return 440 * 2 ** ((midi - 69) / 12)
}
