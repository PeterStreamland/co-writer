import { describe, expect, it } from 'vitest'
import {
  ARPEGGIO_PATTERNS,
  ARPEGGIO_RATES,
  arpeggioName,
  arpeggioNotes,
  arpeggioRhythm,
  arpeggioTones,
  chordIntervals,
  compareDur,
  dur,
  eventsLength,
  formatNote,
  parseChordSymbol,
  parseNote,
  patternCycle,
  pitchClass,
  ratioOf,
  type ArpeggioPattern,
  type Key,
} from '../../src/theory'
import { arpeggios, borrowedArpeggios } from '../fixtures/arpeggios'

const ascii = (text: string) =>
  text.replace(/♭/g, 'b').replace(/♯/g, '#').replace(/𝄫/g, 'bb')

function keyOf(text: string): Key {
  const [tonic, mode] = text.split(' ')
  return { tonic: parseNote(tonic)!, mode }
}

function chordOf(text: string) {
  const chord = parseChordSymbol(text)
  if (!chord) throw new Error(`not a chord: ${text}`)
  return chord
}

const pattern = (id: string) =>
  ARPEGGIO_PATTERNS.find((p) => p.id === id) as ArpeggioPattern

describe('arpeggio tones (golden)', () => {
  it.each(
    [...arpeggios, ...borrowedArpeggios].map((f) => [
      `${f.chord} ${f.level} in ${f.key}`,
      f,
    ]),
  )('%s', (_, f) => {
    const { tones, left } = arpeggioTones(
      chordOf(f.chord),
      keyOf(f.key),
      f.level,
    )
    const show = (t: {
      note: Parameters<typeof formatNote>[0]
      label: string
    }) => `${formatNote(t.note, { ascii: true })} ${ascii(t.label)}`
    expect(tones.map(show)).toEqual(f.tones)
    expect(left.map(show)).toEqual(f.left ?? [])
  })

  it('keeps every tone of the chord itself, up to its level', () => {
    const tops = {
      triad: 5,
      seventh: 7,
      ninth: 9,
      eleventh: 11,
      thirteenth: 13,
    }
    for (const f of arpeggios) {
      const chord = chordOf(f.chord)
      const { tones } = arpeggioTones(chord, keyOf(f.key), f.level)
      const own = chordIntervals(chord.quality)!.filter(
        (i) => i.number <= tops[f.level],
      )
      for (const i of own) {
        expect(tones.map((t) => t.number)).toContain(i.number)
      }
    }
  })

  it('says why a tone is left out', () => {
    const { left } = arpeggioTones(chordOf('C'), keyOf('C major'), 'thirteenth')
    expect(left[0].reason).toBe('a semitone above the 3rd')
    const em = arpeggioTones(chordOf('Em'), keyOf('C major'), 'thirteenth')
    expect(em.left.map((t) => t.reason)).toEqual([
      'a semitone above the root',
      'a semitone above the 5th',
    ])
  })
})

describe('arpeggio names', () => {
  const name = (
    chord: string,
    key: string,
    level: 'seventh' | 'ninth' | 'thirteenth',
  ) => {
    const c = chordOf(chord)
    return arpeggioName(c, arpeggioTones(c, keyOf(key), level))
  }
  it.each([
    ['C', 'C major', 'seventh', 'Cmaj7'],
    ['C', 'C major', 'ninth', 'Cmaj9'],
    ['G', 'C major', 'seventh', 'G7'],
    ['G', 'C major', 'ninth', 'G9'],
    ['Dm', 'C major', 'thirteenth', 'Dm13'],
    ['Bdim', 'C major', 'seventh', 'Bm7♭5'],
    ['E', 'A natural-minor', 'seventh', 'E7'],
  ] as const)('%s %s in %s is %s', (chord, key, level, expected) => {
    expect(name(chord, key, level)).toBe(expected)
  })

  it('names a 13th without its 11th as arrangers do', () => {
    expect(name('C', 'C major', 'thirteenth')).toBe('Cmaj13')
    expect(name('G', 'C major', 'thirteenth')).toBe('G13')
  })
})

describe('arpeggio range', () => {
  const tones = arpeggioTones(chordOf('C'), keyOf('C major'), 'seventh').tones

  it('runs from the root up through the octaves, ending on the root', () => {
    const notes = arpeggioNotes(tones, parseNote('C3')!, 2)
    expect(notes.map((n) => formatNote(n.note))).toEqual([
      'C3',
      'E3',
      'G3',
      'B3',
      'C4',
      'E4',
      'G4',
      'B4',
      'C5',
    ])
    expect(notes.map((n) => n.label)).toEqual([
      'R',
      '3',
      '5',
      '7',
      'R',
      '3',
      '5',
      '7',
      'R',
    ])
  })

  it('spells each note as the chord does, with its pitch', () => {
    const ab = chordOf('Ab')
    const notes = arpeggioNotes(
      arpeggioTones(ab, keyOf('C major'), 'triad').tones,
      parseNote('Ab2')!,
      1,
    )
    expect(notes.map((n) => [formatNote(n.note), n.midi])).toEqual([
      ['A♭2', 44],
      ['C3', 48],
      ['E♭3', 51],
      ['A♭3', 56],
    ])
  })

  it('labels extensions as extensions in every octave', () => {
    const ninth = arpeggioTones(chordOf('C'), keyOf('C major'), 'ninth').tones
    const notes = arpeggioNotes(ninth, parseNote('C3')!, 1)
    expect(notes.map((n) => `${formatNote(n.note)} ${n.label}`)).toEqual([
      'C3 R',
      'D3 9',
      'E3 3',
      'G3 5',
      'B3 7',
      'C4 R',
    ])
  })
})

describe('arpeggio patterns', () => {
  it.each([
    ['up', [0, 1, 2, 3]],
    ['down', [3, 2, 1, 0]],
    ['up-down', [0, 1, 2, 3, 2, 1]],
    ['down-up', [3, 2, 1, 0, 1, 2]],
    ['broken-up', [0, 2, 1, 3]],
    ['broken-down', [3, 1, 2, 0]],
    ['threes-up', [0, 1, 2, 1, 2, 3]],
    ['threes-down', [3, 2, 1, 2, 1, 0]],
  ])('%s over four notes is %o', (id, cycle) => {
    expect(patternCycle(4, pattern(id))).toEqual(cycle)
  })

  it('falls back to the plain direction when there are too few notes', () => {
    expect(patternCycle(2, pattern('threes-up'))).toEqual([0, 1])
  })
})

describe('arpeggio rhythm', () => {
  const lengths = [
    dur(1, 1), // a bar of 4/4
    dur(3, 4), // 3/4
    dur(7, 8), // 7/8
    dur(1, 2),
    dur(3, 2),
  ]
  it.each(
    ARPEGGIO_PATTERNS.flatMap((p) =>
      ARPEGGIO_RATES.flatMap((r) =>
        lengths.map(
          (l) =>
            [`${p.id} in ${r.id} over ${l.n}/${l.d}`, p, r.note, l] as const,
        ),
      ),
    ),
  )('%s fits exactly, on the grid', (_, p, rate, length) => {
    const events = arpeggioRhythm(9, p, rate, length)
    expect(eventsLength(events)).toEqual(length)
    events.forEach((e, i) => {
      expect(e.onset).toEqual(dur(rate.n * i, rate.d))
      expect(compareDur(e.length, rate)).toBeLessThanOrEqual(0)
      expect(e.index).toBeGreaterThanOrEqual(0)
      expect(e.index).toBeLessThan(9)
    })
  })

  it('plays eight 8ths in a bar of 4/4, repeating the cycle', () => {
    const events = arpeggioRhythm(4, pattern('up'), dur(1, 8), dur(1, 1))
    expect(events.map((e) => e.index)).toEqual([0, 1, 2, 3, 0, 1, 2, 3])
  })

  it('cuts the last triplet short in 7/8', () => {
    const events = arpeggioRhythm(4, pattern('up'), dur(1, 12), dur(7, 8))
    expect(events).toHaveLength(11)
    expect(events.at(-1)?.length).toEqual(dur(1, 24))
    expect(ratioOf(dur(7, 8), dur(1, 12))).toBe(10.5)
  })

  it('plays nothing with no notes or no time', () => {
    expect(arpeggioRhythm(0, pattern('up'), dur(1, 8), dur(1, 1))).toEqual([])
    expect(arpeggioRhythm(3, pattern('up'), dur(1, 8), dur(0, 1))).toEqual([])
  })
})

describe('arpeggio names and tensions (Phase 6 gate review)', () => {
  it('names a 13th sus4 chord', () => {
    const g = chordOf('G7sus4')
    expect(
      arpeggioName(g, arpeggioTones(g, keyOf('C major'), 'thirteenth')),
    ).toBe('G13sus4')
  })

  it('names borrowed chords from their source mode', () => {
    const fm = chordOf('Fm')
    expect(
      arpeggioName(fm, arpeggioTones(fm, keyOf('C major'), 'seventh')),
    ).toBe('Fm7')
    const bb = chordOf('Bb')
    expect(
      arpeggioName(bb, arpeggioTones(bb, keyOf('C major'), 'seventh')),
    ).toBe('B♭7')
  })

  it('gives a diminished 7th only tensions a whole tone above its notes', () => {
    const b = chordOf('Bdim7')
    const { tones, left } = arpeggioTones(b, keyOf('C major'), 'thirteenth')
    const own = new Set(['B', 'D', 'F', 'Ab'])
    for (const t of tones) {
      const name = formatNote(t.note, { ascii: true })
      if (own.has(name)) continue
      const below = [...own].some(
        (o) => (pitchClass(t.note) - pitchClass(parseNote(o)!) + 12) % 12 === 2,
      )
      expect(below, `${name} is a whole tone above a chord tone`).toBe(true)
    }
    expect(left.map((t) => formatNote(t.note, { ascii: true }))).toContain('C')
  })
})
