import { describe, expect, it } from 'vitest'
import {
  NOTHING_HELD,
  heldNotes,
  nextHeld,
  parseMidiMessage,
  type HeldState,
  type MidiEvent,
} from '../../src/midi/held'

describe('parseMidiMessage', () => {
  it('reads note-on on any channel', () => {
    expect(parseMidiMessage([0x90, 60, 100])).toEqual({
      type: 'on',
      note: 60,
      velocity: 100,
    })
    expect(parseMidiMessage([0x93, 64, 1])).toEqual({
      type: 'on',
      note: 64,
      velocity: 1,
    })
  })

  it('treats note-off and velocity-0 note-on as off', () => {
    expect(parseMidiMessage([0x80, 60, 64])).toEqual({ type: 'off', note: 60 })
    expect(parseMidiMessage([0x90, 60, 0])).toEqual({ type: 'off', note: 60 })
  })

  it('reads the sustain pedal, down from 64', () => {
    expect(parseMidiMessage([0xb0, 64, 127])).toEqual({
      type: 'pedal',
      down: true,
    })
    expect(parseMidiMessage([0xb2, 64, 63])).toEqual({
      type: 'pedal',
      down: false,
    })
  })

  it('ignores other controllers and messages', () => {
    expect(parseMidiMessage([0xb0, 1, 100])).toEqual({ type: 'other' })
    expect(parseMidiMessage([0xf8])).toEqual({ type: 'other' })
  })
})

function play(...events: MidiEvent[]): HeldState {
  return events.reduce(nextHeld, NOTHING_HELD)
}
const on = (note: number): MidiEvent => ({ type: 'on', note, velocity: 90 })
const off = (note: number): MidiEvent => ({ type: 'off', note })
const pedal = (down: boolean): MidiEvent => ({ type: 'pedal', down })

describe('held notes', () => {
  it('holds notes while the keys are down, lowest first', () => {
    expect(heldNotes(play(on(67), on(60), on(64)))).toEqual([60, 64, 67])
    expect(heldNotes(play(on(67), on(60), on(64), off(60)))).toEqual([64, 67])
  })

  it('keeps released notes while the sustain pedal is down', () => {
    const state = play(pedal(true), on(60), on(64), on(67), off(60), off(64))
    expect(heldNotes(state)).toEqual([60, 64, 67])
    expect(heldNotes(nextHeld(state, pedal(false)))).toEqual([67])
  })

  it('does not sustain a note released before the pedal went down', () => {
    expect(heldNotes(play(on(60), off(60), pedal(true)))).toEqual([])
  })

  it('counts a note struck again under the pedal once', () => {
    const state = play(pedal(true), on(60), off(60), on(60))
    expect(heldNotes(state)).toEqual([60])
    expect(heldNotes(nextHeld(state, pedal(false)))).toEqual([60])
  })
})
