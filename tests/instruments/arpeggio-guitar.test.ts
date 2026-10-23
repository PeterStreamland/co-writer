import { describe, expect, it } from 'vitest'
import {
  arpeggioPositions,
  arpeggioRun,
  positionBox,
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
  pitchClass,
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

function tonesOf(chord: string, level: ArpeggioLevel = 'triad') {
  return arpeggioTones(parseChordSymbol(chord)!, C_MAJOR, level).tones
}

const guitars: [string, Guitar][] = [
  ['standard', standard],
  ['drop D', dropD],
  ['7-string', seven],
]

describe('arpeggios in one position', () => {
  it.each(
    guitars.flatMap(([name, guitar]) =>
      (['C', 'G', 'Am', 'E', 'Bdim'] as const).flatMap((chord) =>
        (['triad', 'seventh', 'ninth'] as const).map(
          (level) =>
            [`${chord} ${level} on ${name}`, guitar, chord, level] as const,
        ),
      ),
    ),
  )(
    '%s: every position is the tones in four frets, rising',
    (_, guitar, chord, level) => {
      const tones = tonesOf(chord, level)
      const pcs = new Set(tones.map((t) => pitchClass(t.note)))
      const positions = arpeggioPositions(guitar, tones)
      expect(positions.length).toBeGreaterThanOrEqual(5)
      for (const p of positions) {
        expect(sounds(guitar, p.spots)).toEqual(p.notes.map((n) => n.midi))
        expect(climbs(p.spots)).toBe(true)
        p.notes.forEach((n, i) => {
          expect(pcs.has(pitchClass(n.note))).toBe(true)
          if (i > 0) expect(n.midi).toBeGreaterThan(p.notes[i - 1].midi)
        })
        const fretted = p.spots.map((s) => s.fret).filter((f) => f > 0)
        if (fretted.length) {
          expect(
            Math.max(...fretted) - Math.min(...fretted) + 1,
          ).toBeLessThanOrEqual(DEFAULT_SPAN)
        }
      }
    },
  )

  it('finds a position at every stretch of the neck for C', () => {
    const froms = arpeggioPositions(standard, tonesOf('C')).map((p) => p.from)
    expect(froms[0]).toBe(0)
    expect(froms.at(-1)).toBeGreaterThanOrEqual(10)
    // No two positions are the same notes.
    const ids = arpeggioPositions(standard, tonesOf('C')).map((p) =>
      p.spots.map((s) => `${s.string}:${s.fret}`).join(),
    )
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('finds C in 8th position across all six strings', () => {
    const spots = arpeggioPositions(standard, tonesOf('C')).find(
      (p) => p.from === 7,
    )?.spots
    expect(spots?.map((s) => `${s.string}:${s.fret}`)).toEqual([
      '0:8',
      '1:7',
      '1:10',
      '2:10',
      '3:9',
      '4:8',
      '5:8',
    ])
  })

  it('uses open strings in the open position, without repeating a note', () => {
    const open = arpeggioPositions(standard, tonesOf('E'))[0]
    expect(open.spots[0]).toEqual({ string: 0, fret: 0 })
    const midis = open.notes.map((n) => n.midi)
    expect(new Set(midis).size).toBe(midis.length)
  })

  it("needn't start on the root: some C positions start on E or G", () => {
    const firsts = arpeggioPositions(standard, tonesOf('C')).map(
      (p) => p.notes[0].label,
    )
    expect(firsts).toContain('R')
    expect(firsts.some((l) => l !== 'R')).toBe(true)
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

describe('an arpeggio position as a box', () => {
  it('draws C in 8th position from its lowest fret, every note a dot', () => {
    const p = arpeggioPositions(standard, tonesOf('C')).find(
      (q) => q.from === 7,
    )!
    const box = positionBox(standard, p.spots, p.notes)
    expect([box.first, box.rows, box.top]).toEqual([7, 4, 'none'])
    expect(box.dots.map((d) => `${d.string}:${d.row} ${d.label}`)).toEqual([
      '0:2 R',
      '1:1 3',
      '1:4 5',
      '2:4 R',
      '3:3 3',
      '4:2 5',
      '5:2 R',
    ])
    expect(box.dots.map((d) => d.role)).toEqual([
      'root',
      'third',
      'fifth',
      'root',
      'third',
      'fifth',
      'root',
    ])
  })

  it('draws the nut and open strings in the open position', () => {
    const p = arpeggioPositions(standard, tonesOf('E'))[0]
    const box = positionBox(standard, p.spots, p.notes)
    expect(box.top).toBe('nut')
    expect(box.first).toBe(1)
    expect(box.dots[0]).toMatchObject({ string: 0, open: true, label: 'R' })
  })
})
