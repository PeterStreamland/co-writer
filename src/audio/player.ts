// Chord playback through Tone.js. A plain synth for now; Phase 2 task 4 adds
// the piano and clean-guitar sounds.
import * as Tone from 'tone'
import type { Note } from '../theory'
import { frequency } from './pitch'

let synth: Tone.PolySynth | undefined

// Plays the notes together as a block chord. The browser only allows sound
// after a click or key press, so call this from one.
export async function playChord(notes: Note[], seconds = 1.5): Promise<void> {
  await Tone.start()
  synth ??= new Tone.PolySynth(Tone.Synth).toDestination()
  synth.releaseAll()
  synth.triggerAttackRelease(notes.map(frequency), seconds)
}
