// The melody as notes playing along with the chords (SPEC 7.2): each note
// sounds over the chord it starts under. Notes after the last chord ends
// don't play with the chords; Play melody plays them all.
import { addDur, compareDur, type MelodyNote, type Placement } from '../theory'
import type { AlongNote } from './along'

export const MELODY_LOOK = 'melody'

export function melodyAlong(
  melody: MelodyNote[],
  timing: Placement[],
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
            look: MELODY_LOOK,
          },
        ]
  })
}
