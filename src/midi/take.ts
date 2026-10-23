// A melody take on MIDI (SPEC 7.2) as data: key presses timed from the end
// of the count-in, in seconds, ready to snap to the grid. Pure, so it can
// be tested without a keyboard. The sustain pedal is ignored: a melody
// note lasts as long as its key is down.
import type { PlayedNote } from '../theory'
import type { MidiEvent } from './held'

export type Take = {
  start: number // when the count-in ended, in milliseconds
  open: Record<number, number> // keys down, with when they went down
  played: PlayedNote[]
}

export function startTake(start: number): Take {
  return { start, open: {}, played: [] }
}

const seconds = (take: Take, at: number) => (at - take.start) / 1000

function close(take: Take, note: number, at: number): Take {
  const on = take.open[note]
  if (on === undefined) return take
  const open = { ...take.open }
  delete open[note]
  return {
    ...take,
    open,
    played: [...take.played, { midi: note, on, off: seconds(take, at) }],
  }
}

export function takeEvent(take: Take, event: MidiEvent, at: number): Take {
  if (event.type === 'on') {
    const closed = close(take, event.note, at)
    return {
      ...closed,
      open: { ...closed.open, [event.note]: seconds(take, at) },
    }
  }
  if (event.type === 'off') return close(take, event.note, at)
  return take
}

// The notes played, with any keys still down ending now. A note struck a
// moment before the count-in ended counts from the first beat; one
// released before it is dropped.
export function finishTake(take: Take, at: number): PlayedNote[] {
  let done = take
  for (const note of Object.keys(take.open))
    done = close(done, Number(note), at)
  return done.played
    .filter((p) => p.off > 0)
    .map((p) => (p.on < 0 ? { ...p, on: 0 } : p))
}
