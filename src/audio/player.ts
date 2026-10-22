// Playback through Tone.js (SPEC 5, as changed by David): the sampled piano
// for everything, as block chords in the keyboard view and as a quick strum,
// low note first, in the guitar view.
import * as Tone from 'tone'
import type { Note } from '../theory'
import { frequency } from './pitch'
import { sampleMap, strumSchedule } from './sounds'

let piano: Tone.Sampler | undefined

export type PlayOptions = { strum?: boolean; seconds?: number }

// Plays the notes as a chord. The samples are fetched the first time, and the
// browser only allows sound after a click or key press, so call this from
// one.
export async function playChord(
  notes: Note[],
  { strum = false, seconds = 1.5 }: PlayOptions = {},
): Promise<void> {
  await Tone.start()
  piano ??= new Tone.Sampler({
    urls: sampleMap(),
    baseUrl: `${import.meta.env.BASE_URL}samples/piano/`,
    release: 1,
  }).toDestination()
  await Tone.loaded()
  piano.releaseAll()
  const now = Tone.now()
  if (strum) {
    for (const { note, offset } of strumSchedule(notes)) {
      piano.triggerAttackRelease(frequency(note), seconds, now + offset)
    }
  } else {
    piano.triggerAttackRelease(notes.map(frequency), seconds, now)
  }
}
