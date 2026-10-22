// The chord last played on the MIDI keyboard (Phase 3 task 7), kept after
// the keys come up so it can be sent to the chord boxes. Each time you play,
// from the first key down to the last key up, it keeps the names of the
// fullest chord you held: letting go one key at a time doesn't replace C
// major with the C5 left under your fingers, and a lone note starting the
// next chord doesn't clear it. No theory lives here.
import type { Played, PlayedName } from './played'

export type LastChord = {
  names: PlayedName[] // the best fit for the key first
  holding: boolean // keys are down
  peak: number // the most notes held at once since the first key went down
}

export const NO_CHORD: LastChord = { names: [], holding: false, peak: 0 }

export function nextLastChord(last: LastChord, playing: Played): LastChord {
  const size = playing.notes.length
  if (size === 0) return last.holding ? { ...last, holding: false } : last
  const peak = last.holding ? last.peak : 0
  if (size < peak) return last
  return {
    names: playing.names.length ? playing.names : last.names,
    holding: true,
    peak: size,
  }
}
