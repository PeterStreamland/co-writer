import { describe, expect, it } from 'vitest'
import { finishTake, startTake, takeEvent } from '../../src/midi/take'

describe('a melody take on MIDI', () => {
  it('times each key from the end of the count-in, in seconds', () => {
    let t = startTake(1000)
    t = takeEvent(t, { type: 'on', note: 60, velocity: 90 }, 1000)
    t = takeEvent(t, { type: 'on', note: 62, velocity: 90 }, 1400)
    t = takeEvent(t, { type: 'off', note: 60 }, 1500)
    t = takeEvent(t, { type: 'pedal', down: true }, 1600)
    expect(finishTake(t, 2000)).toEqual([
      { midi: 60, on: 0, off: 0.5 },
      { midi: 62, on: 0.4, off: 1 },
    ])
  })

  it('counts a note struck just before the first beat from the beat', () => {
    let t = startTake(1000)
    t = takeEvent(t, { type: 'on', note: 64, velocity: 90 }, 950)
    t = takeEvent(t, { type: 'off', note: 64 }, 1300)
    t = takeEvent(t, { type: 'on', note: 65, velocity: 90 }, 500)
    t = takeEvent(t, { type: 'off', note: 65 }, 700)
    expect(finishTake(t, 2000)).toEqual([{ midi: 64, on: 0, off: 0.3 }])
  })

  it('a key struck again ends the first strike', () => {
    let t = startTake(0)
    t = takeEvent(t, { type: 'on', note: 60, velocity: 90 }, 0)
    t = takeEvent(t, { type: 'on', note: 60, velocity: 90 }, 250)
    expect(finishTake(t, 500)).toEqual([
      { midi: 60, on: 0, off: 0.25 },
      { midi: 60, on: 0.25, off: 0.5 },
    ])
  })
})
