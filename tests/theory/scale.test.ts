import { ScaleType as TonalScaleType } from 'tonal'
import { describe, expect, it } from 'vitest'
import {
  allScales,
  formatNote,
  getScale,
  intervalBetween,
  keySignature,
  parentKey,
  parseNote,
  pitchClass,
  scaleNotes,
  semitones,
  formatInterval,
  type Note,
} from '../../src/theory'
import { majorKeys, minorKeys } from '../fixtures/key-signatures'
import { awkwardScales, parentScales, scalesOnC } from '../fixtures/scales'

function note(text: string) {
  const parsed = parseNote(text)
  if (!parsed) throw new Error(`fixture note ${text} did not parse`)
  return parsed
}

function spelled(tonic: string, scale: string): string[] {
  return scaleNotes(note(tonic), scale).map((n) =>
    formatNote(n, { ascii: true }),
  )
}

const core = allScales().filter((s) => s.family !== 'other')

describe('core scale dictionary', () => {
  it('has every scale in the golden fixture, and no others', () => {
    expect(core.map((s) => s.id).sort()).toEqual(Object.keys(scalesOnC).sort())
  })

  it.each(Object.entries(scalesOnC))('spells C %s', (id, notes) => {
    expect(spelled('C', id)).toEqual(notes)
  })

  it('finds every scale by its own id and aliases', () => {
    const ids = allScales().map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const scale of allScales()) {
      for (const name of [scale.id, ...scale.aliases]) {
        expect(getScale(name)?.id, name).toBe(scale.id)
      }
    }
  })

  it('spells seven-note scales with one note per letter', () => {
    for (const scale of core.filter((s) => s.intervals.length === 7)) {
      const numbers = scale.intervals.map((i) => i.number)
      expect(numbers, scale.id).toEqual([1, 2, 3, 4, 5, 6, 7])
    }
  })

  it('lists intervals rising from the tonic within an octave', () => {
    for (const scale of allScales()) {
      const sizes = scale.intervals.map(semitones)
      expect(sizes[0], scale.id).toBe(0)
      for (let i = 1; i < sizes.length; i++) {
        expect(sizes[i], scale.id).toBeGreaterThan(sizes[i - 1])
      }
      expect(sizes[sizes.length - 1], scale.id).toBeLessThan(12)
    }
  })
})

describe('modes', () => {
  const modes = core.filter((s) => s.modeOf)

  it('covers major, harmonic minor and melodic minor, seven modes each', () => {
    for (const parent of ['major', 'harmonic-minor', 'melodic-minor']) {
      const degrees = modes
        .filter((s) => s.modeOf?.scale === parent)
        .map((s) => s.modeOf?.degree)
        .sort()
      expect(degrees, parent).toEqual([1, 2, 3, 4, 5, 6, 7])
    }
  })

  it.each(modes.map((s) => [s.id, s] as const))(
    '%s is an exact rotation of its parent',
    (_, mode) => {
      const { scale, degree } = mode.modeOf!
      const parent = scaleNotes(note('C'), scale)
      const rotated = [
        ...parent.slice(degree - 1),
        ...parent.slice(0, degree - 1),
      ]
      const intervals = rotated.map((n) =>
        formatInterval(intervalBetween(rotated[0], n)),
      )
      expect(intervals).toEqual(mode.intervals.map(formatInterval))
    },
  )
})

describe('scaleNotes', () => {
  it.each(majorKeys)('spells $tonic major as its key signature', (key) => {
    expect(spelled(key.tonic, 'major')).toEqual(key.scale)
  })

  it.each(minorKeys)(
    'spells $tonic natural minor as its key signature',
    (key) => {
      expect(spelled(key.tonic, 'natural-minor')).toEqual(key.scale)
    },
  )

  it.each(awkwardScales)('spells $tonic $scale', ({ tonic, scale, notes }) => {
    expect(spelled(tonic, scale)).toEqual(notes)
  })

  it('keeps the octave of a tonic that has one', () => {
    const notes = scaleNotes(note('A3'), 'natural-minor').map((n) =>
      formatNote(n),
    )
    expect(notes).toEqual(['A3', 'B3', 'C4', 'D4', 'E4', 'F4', 'G4'])
  })

  it('throws for an unknown scale', () => {
    expect(() => scaleNotes(note('C'), 'no-such-scale')).toThrow()
  })
})

describe('getScale', () => {
  it.each([
    ['dorian', 'dorian'],
    ['aeolian', 'natural-minor'],
    ['minor', 'natural-minor'],
    ['ionian', 'major'],
    ['Blues', 'minor-blues'],
    ['super locrian', 'altered'],
    ['  Phrygian Dominant ', 'phrygian-dominant'],
    ['spanish', 'phrygian-dominant'],
    ['bebop', 'bebop-dominant'],
  ])('finds %s as %s', (name, id) => {
    expect(getScale(name)?.id).toBe(id)
  })

  it('returns undefined for an unknown name', () => {
    expect(getScale('no-such-scale')).toBeUndefined()
  })
})

describe('wider dictionary', () => {
  const wider = allScales().filter((s) => s.family === 'other')

  it('adds tonal scales the core does not cover', () => {
    expect(wider.length).toBeGreaterThan(50)
    expect(getScale('hirajoshi')?.family).toBe('other')
    expect(getScale("messiaen's mode #5")?.id).toBe('messiaens-mode-5')
    expect(spelled('C', 'hungarian-minor')).toEqual([
      'C',
      'D',
      'Eb',
      'F#',
      'G',
      'Ab',
      'B',
    ])
  })

  it('reaches every tonal scale by pitch content', () => {
    const pitches = (notes: Note[]) =>
      notes
        .map(pitchClass)
        .sort((a, b) => a - b)
        .join()
    const ours = new Set(
      allScales().map((s) => pitches(scaleNotes(note('C'), s.id))),
    )
    for (const tonal of TonalScaleType.all()) {
      const sizes = tonal.intervals
        .map((i) => semitones(parseIntervalTonal(i)) % 12)
        .sort((a, b) => a - b)
        .join()
      expect(ours.has(sizes), tonal.name).toBe(true)
    }
  })
})

function parseIntervalTonal(text: string) {
  const [, number, quality] = /^(\d+)(.+)$/.exec(text)!
  return { quality, number: Number(number) }
}

describe('parentKey', () => {
  it.each(parentScales)('$tonic $mode belongs to its parent', (fixture) => {
    const parent = parentKey({ tonic: note(fixture.tonic), mode: fixture.mode })
    expect({
      tonic: formatNote(parent.tonic, { ascii: true }),
      mode: parent.mode,
    }).toEqual(fixture.parent)
  })

  it('leaves a scale that is not a mode as it is', () => {
    const parent = parentKey({ tonic: note('A'), mode: 'minor-pentatonic' })
    expect(parent.mode).toBe('minor-pentatonic')
    expect(formatNote(parent.tonic)).toBe('A')
  })
})

describe('keySignature', () => {
  it.each(majorKeys)('$tonic major has $signature', (key) => {
    expect(keySignature({ tonic: note(key.tonic), mode: 'major' })).toBe(
      key.signature,
    )
  })

  it.each(minorKeys)('$tonic minor has $signature', (key) => {
    expect(
      keySignature({ tonic: note(key.tonic), mode: 'natural-minor' }),
    ).toBe(key.signature)
  })

  it.each([
    ['E', 'dorian', 2],
    ['F', 'locrian', -6],
    ['Bb', 'lydian', -1],
    ['D#', 'harmonic-minor', 6],
    ['Ab', 'harmonic-minor', -7],
    ['E', 'phrygian-dominant', 0],
    ['G', 'altered', -7],
  ] as const)('%s %s shows its parent signature, %i', (tonic, mode, n) => {
    expect(keySignature({ tonic: note(tonic), mode })).toBe(n)
  })

  it('has none for a scale that is not a mode', () => {
    expect(
      keySignature({ tonic: note('A'), mode: 'minor-pentatonic' }),
    ).toBeUndefined()
  })
})
