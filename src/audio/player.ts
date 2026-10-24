// Playback through Tone.js (SPEC 5, as changed by David): the sampled piano
// for everything, as block chords in the keyboard view and as a quick strum,
// low note first, in the guitar view.
import * as Tone from 'tone'
import type { Note } from '../theory'
import { frequency } from './pitch'
import { sampleMap, strumSchedule } from './sounds'

let piano: Tone.Sampler | undefined

const SAMPLES_URL = `${import.meta.env.BASE_URL}samples/piano/`

function sampler(): Tone.Sampler {
  piano ??= new Tone.Sampler({
    urls: sampleMap(),
    baseUrl: SAMPLES_URL,
    release: 1,
  }).toDestination()
  return piano
}

// Gets the piano ready before the first chord, so it plays straight away:
// the samples download into the browser's cache once the page is idle, and
// the first press anywhere on the page starts decoding them. No sound plays.
export function preparePiano(): void {
  const download = () => {
    for (const file of Object.values(sampleMap())) {
      fetch(SAMPLES_URL + file).catch(() => {})
    }
  }
  if ('requestIdleCallback' in window) requestIdleCallback(download)
  else setTimeout(download, 1000)
  addEventListener('pointerdown', () => void Tone.start().then(sampler), {
    once: true,
  })
}

// keep: let notes already sounding ring on (a line playing over the
// chords), rather than cutting them off.
// strum: true or 'down' strums low to high, 'up' high to low; gap is the
// seconds between strings.
export type PlayOptions = {
  strum?: boolean | 'down' | 'up'
  gap?: number
  seconds?: number
  keep?: boolean
}

// Plays the notes as a chord. The samples are fetched the first time, and the
// browser only allows sound after a click or key press, so call this from
// one.
export async function playChord(
  notes: Note[],
  { strum = false, gap, seconds = 1.5, keep = false }: PlayOptions = {},
): Promise<void> {
  await Tone.start()
  const piano = sampler()
  await Tone.loaded()
  if (!keep) piano.releaseAll()
  const now = Tone.now()
  if (strum) {
    for (const { note, offset } of strumSchedule(notes, gap, strum === 'up')) {
      piano.triggerAttackRelease(frequency(note), seconds, now + offset)
    }
  } else {
    piano.triggerAttackRelease(notes.map(frequency), seconds, now)
  }
}

// Plays one note of a line or arpeggio, letting the notes before it ring
// on (no release of the others).
export async function playNote(note: Note, seconds: number): Promise<void> {
  await Tone.start()
  const piano = sampler()
  await Tone.loaded()
  piano.triggerAttackRelease(frequency(note), seconds, Tone.now())
}

let clicker: Tone.Synth | undefined

// The count-in and recording click (SPEC 5, 7.2): a short tick, higher on
// the first beat of the bar.
export async function playClick(accent: boolean): Promise<void> {
  await Tone.start()
  clicker ??= new Tone.Synth({
    oscillator: { type: 'square' },
    envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.02 },
    volume: -10,
  }).toDestination()
  clicker.triggerAttackRelease(accent ? 1760 : 1175, 0.03, Tone.now())
}
