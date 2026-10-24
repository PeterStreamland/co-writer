// The melody as notes playing along with the chords (SPEC 7.2): each note
// sounds over the chord it starts under. Notes after the last chord ends
// don't play with the chords; Play melody plays them all.
import {
  DEFAULT_RANGE,
  addDur,
  compareDur,
  melodyRange,
  midiNumber,
  type MelodyNote,
  type MelodyRange,
  type Placement,
} from '../theory'
import type { MelodyRangeSetting } from '../sketch/progression'
import type { AlongNote } from './along'

export const MELODY_LOOK = 'melody'
// Harmonies of the melody (SPEC 7.4) play along the same way.
export const HARMONY_LOOK = 'harmony'

export function melodyAlong(
  melody: MelodyNote[],
  timing: Placement[],
  look = MELODY_LOOK,
): AlongNote[] {
  return melody.flatMap((m, ref) => {
    const step = timing.findIndex(
      (t) =>
        compareDur(t.start, m.onset) <= 0 &&
        compareDur(m.onset, addDur(t.start, t.length)) < 0,
    )
    return step < 0
      ? []
      : [
          {
            step,
            onset: m.onset,
            length: m.length,
            note: m.note,
            ref,
            look,
          },
        ]
  })
}

// The melody's range from its setting: a preset's, or the notes chosen for
// a range of your own when both are there and the low one is lower.
// Tenor when unset (SPEC 7.3).
export function rangeFromSetting(setting?: MelodyRangeSetting): MelodyRange {
  if (setting?.preset === 'custom' && setting.low && setting.high) {
    const low = midiNumber(setting.low)
    const high = midiNumber(setting.high)
    if (low !== undefined && high !== undefined && low < high) {
      return { low: setting.low, high: setting.high }
    }
  }
  return melodyRange(setting?.preset ?? DEFAULT_RANGE)
}
