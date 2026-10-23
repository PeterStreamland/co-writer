import { describe, expect, it } from 'vitest'
import {
  arpeggioPositions,
  arpeggioRun,
  type Spot,
} from '../../src/instruments/arpeggio-guitar'
import { DEFAULT_SPAN } from '../../src/instruments/fingering'
import { fretMidi, makeGuitar, type Guitar } from '../../src/instruments/guitar'
import { STANDARD_TUNING, tuningStrings } from '../../src/instruments/tunings'
import {
  arpeggioNotes,
  arpeggioTones,
  parseChordSymbol,
  parseNote,
  type ArpeggioLevel,
} from '../../src/theory'

const standard = makeGuitar(STANDARD_TUNING)
const dropD = makeGuitar(tuningStrings('drop-d', false))
const seven = makeGuitar(tuningStrings('standard', true))
const C_MAJOR = { tonic: parseNote('C')!, mode: 'major' }

function midis(
  chord: string,
  low: string,
  octaves: number,
  level: ArpeggioLevel = 'triad',
) {
  const tones = arpeggioTones(parseChordSymbol(chord)!, C_MAJOR, level).tones
  return arpeggioNotes(tones, parseNote(low)!, octaves).map((n) => n.midi)
}

function sounds(guitar: Guitar, spots: Spot[]) {
  return spots.map((s) => fretMidi(guitar, s.string, s.fret))
}

function climbs(spots: Spot[]) {
  return spots.every((s, i) => i === 0 || s.string >= spots[i - 1].string)
}

const cases: [string, Guitar, string, string, number, ArpeggioLevel][] = [
  ['C two octaves', standard, 'C', 'C3', 2, 'triad'],
  ['G7 two octaves', standard, 'G', 'G2', 2, 'seventh'],
  ['Am9 one octave', standard, 'Am', 'A2', 1, 'ninth'],
  ['E from the open low string', standard, 'E', 'E2', 2, 'triad'],
  ['D from the low D in drop D', dropD, 'D', 'D2', 2, 'triad'],
  ['B from the low B of a 7-string', seven, 'B', 'B1', 2, 'triad'],
]

describe('arpeggios in one position', () => {
  it.each(cases)('%s', (_, guitar, chord, low, octaves, level) => {
    const notes = midis(chord, low, octaves, level)
    const positions = arpeggioPositions(guitar, notes)
    expect(positions.length).toBeGreaterThan(0)
    for (const p of positions) {
      expect(sounds(guitar, p.spots)).toEqual(notes)
      expect(climbs(p.spots)).toBe(true)
      const fretted = p.spots.map((s) => s.fret).filter((f) => f > 0)
      if (fretted.length) {
        expect(
          Math.max(...fretted) - Math.min(...fretted) + 1,
        ).toBeLessThanOrEqual(DEFAULT_SPAN)
      }
    }
  })

  it('finds C in 8th position, from the low string', () => {
    const notes = midis('C', 'C3', 2)
    const spots = arpeggioPositions(standard, notes).find((p) => p.from === 7)
    expect(spots?.spots.map((s) => `${s.string}:${s.fret}`)).toEqual([
      '0:8',
      '1:7',
      '1:10',
      '2:10',
      '3:9',
      '4:8',
      '5:8',
    ])
  })

  it('uses open strings in the open position', () => {
    const notes = midis('E', 'E2', 2)
    const open = arpeggioPositions(standard, notes)[0]
    expect(open.spots[0]).toEqual({ string: 0, fret: 0 })
  })

  it('finds nothing when the notes leave the neck', () => {
    expect(arpeggioPositions(standard, midis('C', 'C1', 1))).toEqual([])
  })
})

describe('arpeggios as a run across the neck', () => {
  it.each(cases)('%s', (_, guitar, chord, low, octaves, level) => {
    const notes = midis(chord, low, octaves, level)
    const run = arpeggioRun(guitar, notes)
    expect(run).toBeDefined()
    const spots = run as Spot[]
    expect(sounds(guitar, spots)).toEqual(notes)
    expect(climbs(spots)).toBe(true)
    // At most three notes a string, sliding up it.
    for (let s = 0; s < guitar.strings.length; s++) {
      const on = spots.filter((x) => x.string === s).map((x) => x.fret)
      expect(on.length).toBeLessThanOrEqual(3)
      on.forEach((f, i) => i > 0 && expect(f).toBeGreaterThan(on[i - 1]))
    }
  })

  it('moves up the neck over two octaves', () => {
    const run = arpeggioRun(standard, midis('C', 'C3', 2)) as Spot[]
    expect(run.at(-1)!.fret).toBeGreaterThan(run[0].fret)
    expect(run.some((s, i) => i > 0 && s.string === run[i - 1].string)).toBe(
      true,
    )
  })

  it('is undefined when a note is off the neck', () => {
    expect(arpeggioRun(standard, midis('C', 'C1', 1))).toBeUndefined()
  })
})
