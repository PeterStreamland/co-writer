// Notes that play along with the progression (Phase 6 task 5): a line from
// the Lines tab, or arpeggios from the Arpeggio tab (David's request). The
// workspace plays the chords and these notes together; `source` lets the
// tab that sent them know they're its own, and `ref` lets it find which of
// its notes is sounding.
import { compareDur, type Dur, type Note } from '../theory'

export type AlongNote = {
  step: number // the chord of the progression it sounds over
  onset: Dur // from the start of the progression
  length: Dur
  note: Note
  ref: number
  // How a row shows it: its interval over the chord (R, ♭3, 9) and the
  // class that colours its box (a line's tag, an arpeggio tone's role).
  label?: string
  look?: string
  // An arpeggio note's place in its bar's pattern.
  place?: number
}

// `voices` splits the notes by the row they light on (the melody, each
// harmony, each row), so each row keeps a light of its own.
export type Along = {
  source: object
  notes: AlongNote[]
  voices?: Record<string, AlongNote[]>
}

// The note lit on each row at a moment (Phase 7 task 13, David's note):
// the one that started last, so it stays lit through a held note or a
// rest until that row's next note takes over, whatever the other rows do.
// A row whose first note hasn't come yet has no light.
export function lightsAt(
  voices: Record<string, AlongNote[]>,
  at: Dur,
): Record<string, AlongNote> {
  const lit: Record<string, AlongNote> = {}
  for (const [voice, notes] of Object.entries(voices)) {
    let latest: AlongNote | undefined
    for (const n of notes) {
      if (compareDur(n.onset, at) > 0) continue
      if (!latest || compareDur(n.onset, latest.onset) >= 0) latest = n
    }
    if (latest) lit[voice] = latest
  }
  return lit
}
