import { describe, expect, it } from 'vitest'
import { fretboardGrid } from '../../src/instruments/fretboard'
import {
  KEYBOARD_HIGH,
  KEYBOARD_LOW,
  pianoKeys,
} from '../../src/instruments/keyboard'
import { noteMarker } from '../../src/instruments/marks'
import { STANDARD_TUNING } from '../../src/instruments/tunings'
import {
  allScales,
  enharmonicKey,
  formatNote,
  midiNumber,
  parseChordSymbol,
  parseNote,
  pickerTonics,
  pitchClass,
  scaleNotes,
  type Key,
} from '../../src/theory'

function key(tonic: string, mode: string): Key {
  return { tonic: parseNote(tonic)!, mode }
}

// Every key the picker can reach: each listed tonic and its swap.
function everyKey(): Key[] {
  return allScales().flatMap((scale) =>
    pickerTonics(scale.id).flatMap((tonic) => {
      const k = { tonic, mode: scale.id }
      const swapped = enharmonicKey(k)
      return swapped ? [k, swapped] : [k]
    }),
  )
}

describe('keyboard view', () => {
  it('spans C2 to C6, with black keys where a piano has them', () => {
    const keys = pianoKeys(KEYBOARD_LOW, KEYBOARD_HIGH, () => undefined)
    expect(keys).toHaveLength(49)
    expect(keys[0].midi).toBe(36)
    expect(keys.filter((k) => k.black)).toHaveLength(20)
    expect(keys.find((k) => k.midi === 61)?.black).toBe(true)
  })

  it('marks C major on the white keys, with C as the root', () => {
    const keys = pianoKeys(60, 71, noteMarker(key('C', 'major')))
    expect(keys.filter((k) => k.mark).map((k) => k.mark!.name)).toEqual(
      'C D E F G A B'.split(' '),
    )
    expect(keys.every((k) => !!k.mark === !k.black)).toBe(true)
    expect(keys.filter((k) => k.mark?.root).map((k) => k.midi)).toEqual([60])
  })

  it('labels degrees and spells by the key', () => {
    const keys = pianoKeys(59, 70, noteMarker(key('Eb', 'natural-minor')))
    const marked = keys.filter((k) => k.mark).map((k) => k.mark!)
    expect(marked.map((m) => m.name)).toEqual('C♭ D♭ E♭ F G♭ A♭ B♭'.split(' '))
    expect(marked.map((m) => m.degree)).toEqual('♭6 ♭7 1 2 ♭3 4 5'.split(' '))
    // C♭ sounds as B3's pitch but is spelled C♭4.
    expect(formatNote(marked[0].note, { ascii: true })).toBe('Cb4')
  })

  it('marks the current chord, even a tone outside the scale', () => {
    const mark = noteMarker(key('C', 'major'), parseChordSymbol('E7')!)
    const tones = pianoKeys(60, 71, mark).filter((k) => k.mark?.chordTone)
    expect(tones.map((k) => k.mark!.name)).toEqual(['D', 'E', 'G♯', 'B'])
    expect(tones.find((k) => k.mark!.name === 'G♯')?.mark!.inScale).toBe(false)
  })
})

describe('fretboard view', () => {
  it('tunes six strings to E2 A2 D3 G3 B3 E4, lowest first', () => {
    const grid = fretboardGrid(STANDARD_TUNING, 15, () => undefined)
    expect(grid.map((row) => row[0].midi)).toEqual([40, 45, 50, 55, 59, 64])
    expect(grid.every((row) => row.length === 16)).toBe(true)
    expect(grid[0][15].midi).toBe(55)
  })

  it('shows A minor pentatonic on the low E string', () => {
    const grid = fretboardGrid(
      STANDARD_TUNING,
      12,
      noteMarker(key('A', 'minor-pentatonic')),
    )
    const marked = grid[0].filter((f) => f.mark)
    expect(marked.map((f) => f.fret)).toEqual([0, 3, 5, 8, 10, 12])
    expect(marked.map((f) => f.mark!.name)).toEqual('E G A C D E'.split(' '))
    expect(marked.filter((f) => f.mark!.root).map((f) => f.fret)).toEqual([5])
  })
})

// Phase 2 exit criteria: any key and scale shows the right notes on both
// instruments, checked against the Phase 1 core, and every highlighted note
// plays the pitch it sits on.
describe('every key and scale on both instruments', () => {
  for (const k of everyKey()) {
    const label = `${formatNote(k.tonic, { ascii: true })} ${k.mode}`
    it(label, () => {
      const scale = scaleNotes(k.tonic, k.mode)
      const names = new Set(scale.map((n) => formatNote(n)))
      const pitches = new Set(scale.map(pitchClass))
      const mark = noteMarker(k)
      const keys = pianoKeys(KEYBOARD_LOW, KEYBOARD_HIGH, mark)
      const frets = fretboardGrid(STANDARD_TUNING, 15, mark).flat()
      for (const spot of [...keys, ...frets]) {
        const inScale = pitches.has(spot.midi % 12)
        expect(!!spot.mark, `${label} at ${spot.midi}`).toBe(inScale)
        if (!spot.mark) continue
        expect(names.has(spot.mark.name)).toBe(true)
        expect(midiNumber(spot.mark.note)).toBe(spot.midi)
        expect(spot.mark.root).toBe(spot.midi % 12 === pitchClass(k.tonic))
      }
      const shown = new Set(keys.filter((x) => x.mark).map((x) => x.mark!.name))
      expect(shown).toEqual(names)
    })
  }
})
