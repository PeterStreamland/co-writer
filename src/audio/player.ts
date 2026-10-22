// Playback through Tone.js (SPEC 5): sampled piano played as block chords,
// sampled clean guitar played as a quick strum, low string first.
import * as Tone from 'tone'
import type { Note } from '../theory'
import { frequency } from './pitch'
import { sampleMap, strumSchedule, type Sound } from './sounds'

const samplers: Partial<Record<Sound, Tone.Sampler>> = {}

// Each sound's samples are fetched the first time it plays.
function sampler(sound: Sound): Tone.Sampler {
  samplers[sound] ??= new Tone.Sampler({
    urls: sampleMap(sound),
    baseUrl: `${import.meta.env.BASE_URL}samples/${sound}/`,
    release: sound === 'piano' ? 1 : 0.5,
  }).toDestination()
  return samplers[sound]
}

// Plays the notes as a chord: together on the piano, strummed on the guitar.
// The browser only allows sound after a click or key press, so call this
// from one.
export async function playChord(
  notes: Note[],
  sound: Sound,
  seconds = 1.5,
): Promise<void> {
  await Tone.start()
  const instrument = sampler(sound)
  await Tone.loaded()
  instrument.releaseAll()
  const now = Tone.now()
  if (sound === 'guitar') {
    for (const { note, offset } of strumSchedule(notes)) {
      instrument.triggerAttackRelease(frequency(note), seconds, now + offset)
    }
  } else {
    instrument.triggerAttackRelease(notes.map(frequency), seconds, now)
  }
}
