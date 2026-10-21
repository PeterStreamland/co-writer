import { describe, expect, it } from 'vitest'
import {
  allScales,
  chordSymbol,
  chordsInScale,
  diatonicChords,
  formatNote,
  getScale,
  hasDiatonicChords,
  parseNote,
  pitchClass,
  scaleNotes,
  DIATONIC_KINDS,
  type DiatonicKind,
  type Key,
} from '../../src/theory'
import {
  chordsOnC,
  extendedChords,
  spelledChords,
  susAndAddChords,
} from '../fixtures/diatonic-chords'
import { majorKeys, minorKeys } from '../fixtures/key-signatures'
import { scaleChords, spelledScaleChords } from '../fixtures/scale-chords'

function note(text: string) {
  const parsed = parseNote(text)
  if (!parsed) throw new Error(`fixture note ${text} did not parse`)
  return parsed
}

function key(tonic: string, mode: string): Key {
  return { tonic: note(tonic), mode }
}

function symbols(tonic: string, mode: string, kind: DiatonicKind): string[] {
  return diatonicChords(key(tonic, mode), kind).map((c) =>
    chordSymbol(c, { ascii: true }),
  )
}

// A chord symbol with its root taken off: 'F#m7b5' → 'm7b5'.
function suffix(symbol: string): string {
  return symbol.replace(/^[A-G](#+|b+)?/, '')
}

describe('diatonic triads and 7ths', () => {
  it.each(Object.entries(chordsOnC))('C %s', (mode, { triads, sevenths }) => {
    expect(symbols('C', mode, 'triad')).toEqual(triads)
    expect(symbols('C', mode, 'seventh')).toEqual(sevenths)
  })

  it('roots each chord on its scale degree', () => {
    const chords = diatonicChords(key('E', 'dorian'), 'seventh')
    expect(chords.map((c) => c.degree)).toEqual([1, 2, 3, 4, 5, 6, 7])
    expect(chords.map((c) => c.root)).toEqual(scaleNotes(note('E'), 'dorian'))
  })

  const qualities = (mode: string, kind: 'triads' | 'sevenths') =>
    chordsOnC[mode][kind].map(suffix)

  it.each([
    ...majorKeys.map((k) => [k.tonic, 'major'] as const),
    ...minorKeys.map((k) => [k.tonic, 'natural-minor'] as const),
  ])('%s %s has the same qualities as on C', (tonic, mode) => {
    expect(symbols(tonic, mode, 'triad').map(suffix)).toEqual(
      qualities(mode, 'triads'),
    )
    expect(symbols(tonic, mode, 'seventh').map(suffix)).toEqual(
      qualities(mode, 'sevenths'),
    )
  })

  // Every mode's chords are its parent's, starting from the mode's degree.
  it.each(
    allScales()
      .filter((s) => s.modeOf && hasDiatonicChords(s.id))
      .map((s) => [s.id, s.modeOf!.scale, s.modeOf!.degree] as const),
  )('%s rotates %s from degree %i', (mode, parent, degree) => {
    const parentTonic = scaleNotes(note('C'), parent)[degree - 1]
    for (const kind of DIATONIC_KINDS) {
      const fromParent = diatonicChords(
        { tonic: note('C'), mode: parent },
        kind,
      )
      const own = diatonicChords({ tonic: parentTonic, mode }, kind)
      const rotated = [
        ...fromParent.filter((c) => c.degree >= degree),
        ...fromParent.filter((c) => c.degree < degree),
      ]
      expect(
        own.map((c) => chordSymbol(c)),
        kind,
      ).toEqual(rotated.map((c) => chordSymbol(c)))
    }
  })
})

describe('9th, 11th and 13th chords', () => {
  it.each(extendedChords)(
    '$tonic $mode',
    ({ tonic, mode, ninths, elevenths, thirteenths }) => {
      expect(symbols(tonic, mode, 'ninth')).toEqual(ninths)
      expect(symbols(tonic, mode, 'eleventh')).toEqual(elevenths)
      expect(symbols(tonic, mode, 'thirteenth')).toEqual(thirteenths)
    },
  )
})

describe('sus, add and 6th chords', () => {
  it.each(susAndAddChords)('$tonic $mode', ({ tonic, mode, chords }) => {
    for (const [kind, expected] of Object.entries(chords)) {
      expect(symbols(tonic, mode, kind as DiatonicKind), kind).toEqual(expected)
    }
  })
})

describe('spelling', () => {
  it.each(spelledChords)(
    '$tonic $mode degree $degree $kind is $symbol',
    ({ tonic, mode, kind, degree, symbol, notes }) => {
      const chord = diatonicChords(key(tonic, mode), kind as DiatonicKind).find(
        (c) => c.degree === degree,
      )
      expect(chord && chordSymbol(chord, { ascii: true })).toBe(symbol)
      expect(chord?.notes.map((n) => formatNote(n, { ascii: true }))).toEqual(
        notes,
      )
    },
  )

  it('shows accidentals as symbols by default', () => {
    const [, , , , , vi] = diatonicChords(key('Ab', 'natural-minor'), 'seventh')
    expect(chordSymbol(vi)).toBe('F♭maj7')
    const [, ii] = diatonicChords(key('E', 'major'), 'seventh')
    expect(chordSymbol(ii)).toBe('F♯m7')
    const [, , , iv] = diatonicChords(key('Bb', 'major'), 'thirteenth')
    expect(chordSymbol(iv)).toBe('E♭maj13♯11')
    const [, , , , , , vii] = diatonicChords(key('A', 'major'), 'seventh')
    expect(chordSymbol(vii)).toBe('G♯m7♭5')
  })
})

describe('which scales stack in thirds', () => {
  const core = allScales().filter((s) => s.family !== 'other')

  it('includes major, harmonic and melodic minor and all their modes', () => {
    const families = [
      'major-modes',
      'harmonic-minor-modes',
      'melodic-minor-modes',
    ]
    const stacked = core.filter((s) => hasDiatonicChords(s.id)).map((s) => s.id)
    const expected = core
      .filter((s) => families.includes(s.family))
      .map((s) => s.id)
    expect(stacked).toEqual(expected)
    expect(stacked).toHaveLength(21)
  })

  it('leaves out scales that are not seven notes, one per letter', () => {
    for (const id of [
      'major-pentatonic',
      'minor-blues',
      'whole-tone',
      'bebop-major',
    ]) {
      expect(hasDiatonicChords(id), id).toBe(false)
      expect(() => diatonicChords(key('C', id), 'triad')).toThrow()
    }
    expect(getScale('flamenco')?.intervals).toHaveLength(7)
    expect(hasDiatonicChords('flamenco')).toBe(false)
  })

  it('stacks every chord in thirds on every degree', () => {
    for (const scale of allScales().filter((s) => hasDiatonicChords(s.id))) {
      for (const kind of [
        'triad',
        'seventh',
        'ninth',
        'eleventh',
        'thirteenth',
      ] as const) {
        expect(
          diatonicChords(key('C', scale.id), kind),
          `${scale.id} ${kind}`,
        ).toHaveLength(7)
      }
    }
  })
})

describe('chords in any scale', () => {
  const inScale = (tonic: string, mode: string) =>
    chordsInScale(key(tonic, mode))

  it.each(scaleChords)('$tonic $mode', ({ tonic, mode, degrees }) => {
    const chords = inScale(tonic, mode)
    expect(
      degrees.map((_, i) =>
        chords
          .filter((c) => c.degree === i + 1)
          .map((c) => chordSymbol(c, { ascii: true })),
      ),
    ).toEqual(degrees)
    expect(chords.every((c) => c.degree <= degrees.length)).toBe(true)
  })

  it.each(spelledScaleChords)(
    '$symbol in $tonic $mode is spelled from its root',
    ({ tonic, mode, symbol, notes }) => {
      const chord = inScale(tonic, mode).find(
        (c) => chordSymbol(c, { ascii: true }) === symbol,
      )
      expect(chord?.notes.map((n) => formatNote(n, { ascii: true }))).toEqual(
        notes,
      )
    },
  )

  it('only uses pitches from the scale', () => {
    for (const scale of allScales()) {
      const pitches = new Set(scaleNotes(note('F#'), scale.id).map(pitchClass))
      for (const chord of inScale('F#', scale.id)) {
        expect(
          chord.notes.every((n) => pitches.has(pitchClass(n))),
          `${scale.id} ${chordSymbol(chord)}`,
        ).toBe(true)
      }
    }
  })

  it('roots each chord on its degree, spelled as in the scale', () => {
    for (const scale of allScales()) {
      const notes = scaleNotes(note('Eb'), scale.id)
      for (const chord of inScale('Eb', scale.id)) {
        expect(chord.root).toEqual(notes[chord.degree - 1])
      }
    }
  })

  it('agrees with the stacked chords of scales that have them', () => {
    const kinds = DIATONIC_KINDS.filter(
      (k) => !['ninth', 'eleventh', 'thirteenth'].includes(k),
    )
    for (const scale of allScales().filter((s) => hasDiatonicChords(s.id))) {
      const found = new Set(
        inScale('Ab', scale.id).map((c) => chordSymbol(c, { ascii: true })),
      )
      for (const kind of kinds) {
        for (const chord of diatonicChords(key('Ab', scale.id), kind)) {
          const symbol = chordSymbol(chord, { ascii: true })
          expect(found.has(symbol), `${scale.id} ${symbol}`).toBe(true)
        }
      }
    }
  })

  it('finds chords in every core scale', () => {
    for (const scale of allScales().filter((s) => s.family !== 'other')) {
      expect(inScale('C', scale.id).length, scale.id).toBeGreaterThan(0)
    }
  })
})
