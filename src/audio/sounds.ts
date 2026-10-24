// The playback sound as data: which piano sample files there are, and how a
// chord is strummed in the guitar view (SPEC 5). Pure: Tone.js lives in
// player.ts.
import { midiNumber, type Note } from '../theory'

// Sample files in public/samples/piano/, named as Tone.js names notes but
// with 's' for sharp: Ds4 is D♯4. Credits in public/samples/CREDITS.md.
export const PIANO_SAMPLES =
  'A1 C2 Ds2 Fs2 A2 C3 Ds3 Fs3 A3 C4 Ds4 Fs4 A4 C5 Ds5 Fs5 A5 C6 Ds6 Fs6 A6 C7'.split(
    ' ',
  )

// Tone.js sampler map: note name to file name: { 'D#4': 'Ds4.mp3' }.
export function sampleMap(): Record<string, string> {
  return Object.fromEntries(
    PIANO_SAMPLES.map((name) => [name.replace('s', '#'), `${name}.mp3`]),
  )
}

// Seconds between strings in a strum: about 15 ms (SPEC 5).
export const STRUM_GAP = 0.015

// The Strum chord style's slower strum, so it is heard as one (David's
// request, 2026-10-24).
export const SLOW_STRUM_GAP = 0.05

// When each note of a strummed chord starts: lowest note first, or highest
// first for an up-strum.
export function strumSchedule(
  notes: Note[],
  gap = STRUM_GAP,
  up = false,
): { note: Note; offset: number }[] {
  const sorted = [...notes].sort(
    (a, b) => (midiNumber(a) as number) - (midiNumber(b) as number),
  )
  if (up) sorted.reverse()
  return sorted.map((note, i) => ({ note, offset: i * gap }))
}
