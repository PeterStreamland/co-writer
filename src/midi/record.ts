// Record chords (SPEC 5): notes held together for at least 150 ms are
// committed as one chord when every key is up. The sustain pedal keeps
// released notes sounding, so it extends the hold. Pure, fed the notes
// sounding (heldNotes) and the time each time they change.

// How long notes must sound together to count as a chord.
export const HOLD_MS = 150

export type Recorder = {
  sounding: number[] // the notes sounding now, lowest first
  since: number // when they started sounding together (ms)
  chord: number[] // the fullest set held for HOLD_MS so far, lowest first
}

export const IDLE: Recorder = { sounding: [], since: 0, chord: [] }

// The fullest of two note sets, the earlier on a tie: letting go one key at
// a time never replaces C E G with the C G left under the fingers.
const fuller = (a: number[], b: number[]) => (b.length > a.length ? b : a)

// The recorder after the notes sounding change at a time. When the last note
// stops, it hands back the chord to commit, if one was held long enough;
// a note or two brushed on the way doesn't count.
export function nextRecorder(
  state: Recorder,
  sounding: number[],
  now: number,
): { state: Recorder; commit?: number[] } {
  if (sounding.join() === state.sounding.join()) return { state }
  const heldFor = now - state.since
  const chord =
    state.sounding.length && heldFor >= HOLD_MS
      ? fuller(state.chord, state.sounding)
      : state.chord
  if (sounding.length === 0) {
    return chord.length >= 2 ? { state: IDLE, commit: chord } : { state: IDLE }
  }
  return { state: { sounding, since: now, chord } }
}
