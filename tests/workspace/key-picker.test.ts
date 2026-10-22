import { describe, expect, it } from 'vitest'
import {
  keyName,
  scaleGroups,
  scaleView,
  signatureText,
  swapTarget,
  tonicOptions,
  withScale,
  withTonic,
  DEFAULT_KEY,
} from '../../src/workspace/key-picker'
import { allScales, parseNote, type Key } from '../../src/theory'

function key(tonic: string, mode: string): Key {
  const note = parseNote(tonic)
  if (!note) throw new Error(`bad note ${tonic}`)
  return { tonic: note, mode }
}

describe('tonicOptions', () => {
  it('lists the common major spellings', () => {
    expect(tonicOptions(DEFAULT_KEY).map((o) => o.label)).toEqual(
      'C D♭ D E♭ E F F♯ G♭ G A♭ A B♭ B'.split(' '),
    )
  })

  it('shows a swapped spelling in place of the one it swapped from', () => {
    const labels = tonicOptions(key('C#', 'major')).map((o) => o.label)
    expect(labels).toContain('C♯')
    expect(labels).not.toContain('D♭')
    expect(labels).toHaveLength(13)
  })
})

describe('changing key', () => {
  it('changes tonic and keeps the scale', () => {
    expect(withTonic(DEFAULT_KEY, 'Eb')).toEqual(key('Eb', 'major'))
  })

  it('respells the tonic when the new scale needs it', () => {
    expect(withScale(key('Db', 'major'), 'natural-minor')).toEqual(
      key('C#', 'natural-minor'),
    )
  })

  it('swaps D♭ major to C♯ major and back', () => {
    const swapped = swapTarget(key('Db', 'major'))
    expect(swapped).toEqual(key('C#', 'major'))
    expect(swapTarget(swapped!)).toEqual(key('Db', 'major'))
  })
})

describe('scaleGroups', () => {
  it('shows only the common scales until More… is opened', () => {
    const groups = scaleGroups(false, 'major')
    expect(groups.map((g) => g.label)).toEqual(['Common'])
  })

  it('keeps a scale chosen from More… listed', () => {
    const groups = scaleGroups(false, 'phrygian-dominant')
    expect(groups[1].scales.map((s) => s.value)).toEqual(['phrygian-dominant'])
  })

  it('lists every scale exactly once with More… open', () => {
    const ids = scaleGroups(true, 'major').flatMap((g) =>
      g.scales.map((s) => s.value),
    )
    expect(ids.sort()).toEqual(
      allScales()
        .map((s) => s.id)
        .sort(),
    )
  })
})

describe('scaleView', () => {
  it('shows E Dorian with its notes, degrees, intervals, names and steps', () => {
    const view = scaleView(key('E', 'dorian'))
    expect(view.degrees.map((d) => d.note)).toEqual(
      'E F♯ G A B C♯ D'.split(' '),
    )
    expect(view.degrees.map((d) => d.label)).toEqual(
      '1 2 ♭3 4 5 6 ♭7'.split(' '),
    )
    expect(view.degrees.map((d) => d.interval)).toEqual(
      'P1 M2 m3 P4 P5 M6 m7'.split(' '),
    )
    expect(view.degrees[6].name).toBe('subtonic')
    expect(view.steps).toEqual('T S T T T S T'.split(' '))
  })

  it('works for every scale in the dictionary', () => {
    for (const scale of allScales()) {
      const view = scaleView({ tonic: DEFAULT_KEY.tonic, mode: scale.id })
      expect(view.steps).toHaveLength(view.degrees.length)
    }
  })
})

describe('labels', () => {
  it('names the key and its signature', () => {
    expect(keyName(key('E', 'dorian'))).toBe('E Dorian')
    expect(signatureText(key('E', 'dorian'))).toBe(
      '2 sharps, from D Major (Ionian)',
    )
    expect(signatureText(key('F', 'major'))).toBe('1 flat')
    expect(signatureText(DEFAULT_KEY)).toBe('no sharps or flats')
    expect(signatureText(key('A', 'minor-pentatonic'))).toBeUndefined()
  })
})
