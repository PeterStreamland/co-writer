// MIDI input as data: reading raw messages, and tracking which notes are
// held (SPEC 5). Pure, so it can be tested without a keyboard; the Web MIDI
// connection lives in useMidi.ts.

export type MidiEvent =
  | { type: 'on'; note: number; velocity: number }
  | { type: 'off'; note: number }
  | { type: 'pedal'; down: boolean }
  | { type: 'other' }

const SUSTAIN = 64

// Reads a raw MIDI message on any channel. A note-on with velocity 0 is a
// note-off; the sustain pedal (controller 64) counts as down from 64 up.
export function parseMidiMessage(data: ArrayLike<number>): MidiEvent {
  const [status = 0, first = 0, second = 0] = Array.from(data)
  const command = status & 0xf0
  if (command === 0x90 && second > 0) {
    return { type: 'on', note: first, velocity: second }
  }
  if (command === 0x80 || command === 0x90) return { type: 'off', note: first }
  if (command === 0xb0 && first === SUSTAIN) {
    return { type: 'pedal', down: second >= 64 }
  }
  return { type: 'other' }
}

// Keys down, notes kept ringing by the pedal, and whether it is down.
export type HeldState = {
  down: number[]
  sustained: number[]
  pedal: boolean
}

export const NOTHING_HELD: HeldState = { down: [], sustained: [], pedal: false }

const without = (notes: number[], note: number) =>
  notes.filter((n) => n !== note)

// The state after one event. With the pedal down, a released key keeps
// sounding until the pedal comes up, so the chord stays named after you let
// go of the keys.
export function nextHeld(state: HeldState, event: MidiEvent): HeldState {
  switch (event.type) {
    case 'on':
      return {
        ...state,
        down: [...without(state.down, event.note), event.note],
        sustained: without(state.sustained, event.note),
      }
    case 'off':
      return {
        ...state,
        down: without(state.down, event.note),
        sustained:
          state.pedal && state.down.includes(event.note)
            ? [...without(state.sustained, event.note), event.note]
            : state.sustained,
      }
    case 'pedal':
      return event.down
        ? { ...state, pedal: true }
        : { ...state, pedal: false, sustained: [] }
    default:
      return state
  }
}

// Every note sounding, lowest first.
export function heldNotes(state: HeldState): number[] {
  return [...new Set([...state.down, ...state.sustained])].sort((a, b) => a - b)
}
