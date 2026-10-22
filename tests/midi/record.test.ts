import { describe, expect, it } from 'vitest'
import {
  NOTHING_HELD,
  heldNotes,
  nextHeld,
  type MidiEvent,
} from '../../src/midi/held'
import { HOLD_MS, IDLE, nextRecorder } from '../../src/midi/record'

// Feeds MIDI events at their times (ms) through the held-note tracker and
// the recorder, returning every chord committed.
function record(...events: [number, MidiEvent][]): number[][] {
  let held = NOTHING_HELD
  let recorder = IDLE
  const commits: number[][] = []
  for (const [time, event] of events) {
    held = nextHeld(held, event)
    const step = nextRecorder(recorder, heldNotes(held), time)
    recorder = step.state
    if (step.commit) commits.push(step.commit)
  }
  return commits
}

const on = (note: number): MidiEvent => ({ type: 'on', note, velocity: 90 })
const off = (note: number): MidiEvent => ({ type: 'off', note })
const pedal = (down: boolean): MidiEvent => ({ type: 'pedal', down })

// C E G pressed at 0 ms and let go after a hold.
const cMajor = (hold: number, at = 0): [number, MidiEvent][] => [
  [at, on(60)],
  [at, on(64)],
  [at, on(67)],
  [at + hold, off(60)],
  [at + hold, off(64)],
  [at + hold, off(67)],
]

describe('record chords', () => {
  it('commits a chord held for exactly the threshold, once every key is up', () => {
    expect(HOLD_MS).toBe(150)
    expect(record(...cMajor(150))).toEqual([[60, 64, 67]])
  })

  it('ignores a chord held for less than the threshold', () => {
    expect(record(...cMajor(149))).toEqual([])
  })

  it('waits until every key is up before committing', () => {
    const commits = record(
      [0, on(60)],
      [0, on(64)],
      [0, on(67)],
      [400, off(67)],
      [450, off(64)],
    )
    expect(commits).toEqual([])
  })

  it('keeps the fullest chord as keys come up one at a time', () => {
    const commits = record(
      [0, on(60)],
      [0, on(64)],
      [0, on(67)],
      [300, off(64)],
      [600, off(67)],
      [900, off(60)],
    )
    expect(commits).toEqual([[60, 64, 67]])
  })

  it('takes a rolled chord as one chord', () => {
    const commits = record(
      [0, on(48)],
      [40, on(55)],
      [80, on(64)],
      [120, on(67)],
      [500, off(48)],
      [500, off(55)],
      [500, off(64)],
      [500, off(67)],
    )
    expect(commits).toEqual([[48, 55, 64, 67]])
  })

  it('records one chord after another', () => {
    expect(record(...cMajor(300), ...cMajor(300, 1000))).toEqual([
      [60, 64, 67],
      [60, 64, 67],
    ])
  })

  it("doesn't record a lone note", () => {
    expect(record([0, on(60)], [500, off(60)])).toEqual([])
  })

  it('lets the sustain pedal extend the hold', () => {
    // The keys are up after 100 ms, but the pedal keeps the chord sounding.
    const commits = record(
      [0, pedal(true)],
      [0, on(60)],
      [0, on(64)],
      [0, on(67)],
      [100, off(60)],
      [100, off(64)],
      [100, off(67)],
      [400, pedal(false)],
    )
    expect(commits).toEqual([[60, 64, 67]])
  })

  it('waits for the pedal to come up before committing', () => {
    const commits = record(
      [0, pedal(true)],
      [0, on(60)],
      [0, on(64)],
      [0, on(67)],
      [300, off(60)],
      [300, off(64)],
      [300, off(67)],
    )
    expect(commits).toEqual([])
  })
})
