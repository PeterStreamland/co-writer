import { describe, expect, it } from 'vitest'
import {
  DEFAULT_BPM,
  LENGTH_CHOICES,
  beatsOf,
  clampBpm,
  durOfBeats,
  lengthLabel,
  loadBpm,
  saveBpm,
  secondsOf,
} from '../../src/sketch/time'

function memoryStore(): Storage {
  const items = new Map<string, string>()
  return {
    get length() {
      return items.size
    },
    clear: () => items.clear(),
    getItem: (k) => items.get(k) ?? null,
    key: (i) => [...items.keys()][i] ?? null,
    removeItem: (k) => void items.delete(k),
    setItem: (k, v) => void items.set(k, v),
  }
}

describe('chord lengths in 4/4', () => {
  it.each([
    [1, { n: 1, d: 4 }, '1 beat'],
    [2, { n: 1, d: 2 }, '2 beats'],
    [3, { n: 3, d: 4 }, '3 beats'],
    [4, { n: 1, d: 1 }, '1 bar'],
    [6, { n: 3, d: 2 }, '1½ bars'],
    [8, { n: 2, d: 1 }, '2 bars'],
    [16, { n: 4, d: 1 }, '4 bars'],
  ])('%s beats is %o, "%s"', (beats, dur, label) => {
    expect(durOfBeats(beats)).toEqual(dur)
    expect(beatsOf(dur)).toBe(beats)
    expect(lengthLabel(beats)).toBe(label)
  })

  it('offers each choice as an exact fraction', () => {
    for (const beats of LENGTH_CHOICES) {
      expect(beatsOf(durOfBeats(beats))).toBe(beats)
    }
  })
})

describe('tempo', () => {
  it('times a chord at a tempo', () => {
    expect(secondsOf({ n: 1, d: 1 }, 120)).toBe(2) // a bar of 4/4 at 120
    expect(secondsOf({ n: 1, d: 4 }, 60)).toBe(1)
    expect(secondsOf({ n: 2, d: 1 }, 100)).toBeCloseTo(4.8)
  })

  it('keeps the tempo between 40 and 240', () => {
    expect(clampBpm(20)).toBe(40)
    expect(clampBpm(300)).toBe(240)
    expect(clampBpm(97.6)).toBe(98)
    expect(clampBpm(NaN)).toBe(DEFAULT_BPM)
  })

  it('remembers the tempo', () => {
    const store = memoryStore()
    expect(loadBpm(store)).toBe(DEFAULT_BPM)
    saveBpm(132, store)
    expect(loadBpm(store)).toBe(132)
    store.setItem('co-writer:bpm', 'fast')
    expect(loadBpm(store)).toBe(DEFAULT_BPM)
  })
})
