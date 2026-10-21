import { describe, expect, it } from 'vitest'
import {
  chordNames,
  chordNotes,
  chordQualityIds,
  chordSymbol,
  formatNote,
  parseChordSymbol,
  parseNote,
  romanNumeral,
  sameSpelling,
  type ChordName,
  type Key,
} from '../../src/theory'
import {
  jazzSymbols,
  nameCases,
  symbolNotes,
  typedSymbols,
} from '../fixtures/chord-symbols'

function note(text: string) {
  const parsed = parseNote(text)
  if (!parsed) throw new Error(`fixture note ${text} did not parse`)
  return parsed
}

function parse(text: string): ChordName {
  const chord = parseChordSymbol(text)
  if (!chord) throw new Error(`${text} did not parse`)
  return chord
}

const ascii = (chord: ChordName) => chordSymbol(chord, { ascii: true })

function sameChord(a: ChordName, b: ChordName): boolean {
  return (
    sameSpelling(a.root, b.root) &&
    a.quality === b.quality &&
    (a.bass && b.bass ? sameSpelling(a.bass, b.bass) : a.bass === b.bass)
  )
}

describe('parseChordSymbol', () => {
  it.each(Object.entries(symbolNotes))('%s is %s', (symbol, notes) => {
    const chord = parse(symbol)
    expect(
      chordNotes(chord).map((n) => formatNote(n, { ascii: true })),
    ).toEqual(notes.split(' '))
    expect(ascii(chord)).toBe(symbol)
  })

  it.each(Object.entries(typedSymbols))('reads %s as %s', (typed, symbol) => {
    expect(ascii(parse(typed))).toBe(symbol)
  })

  it.each(Object.entries(jazzSymbols))('reads jazz %s', (symbol, jazz) => {
    expect(chordSymbol(parse(symbol), { style: 'jazz' })).toBe(jazz)
    expect(ascii(parse(jazz))).toBe(symbol)
  })

  it.each(['', 'H7', 'c', 'Cxyz', 'C7/', 'C/H', 'Cmaj7/9', 'C7b4', '7'])(
    'rejects %j',
    (text) => {
      expect(parseChordSymbol(text)).toBeUndefined()
    },
  )

  it('shows the lead-sheet style with displayed accidentals by default', () => {
    expect(chordSymbol(parse('F#m7b5/C'))).toBe('F♯m7♭5/C')
    expect(chordSymbol(parse('Bb7#9'))).toBe('B♭7♯9')
  })
})

// 21 roots: every letter natural, sharp and flat.
const ROOTS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'].flatMap((l) => [
  l,
  `${l}#`,
  `${l}b`,
])

describe('round trip', () => {
  const qualities = chordQualityIds()
  const symbols = ROOTS.flatMap((root) =>
    qualities.map((quality) => ({ root: note(root), quality })),
  )

  it('covers at least 200 chord symbols', () => {
    expect(symbols.length).toBeGreaterThanOrEqual(200)
  })

  it('parse, name, parse again: every quality on 21 roots, both styles', () => {
    for (const chord of symbols) {
      for (const style of ['lead-sheet', 'jazz'] as const) {
        for (const options of [{ style }, { style, ascii: true }]) {
          const text = chordSymbol(chord, options)
          const again = parseChordSymbol(text)
          expect(again && sameChord(again, chord), text).toBe(true)
        }
      }
    }
  })

  it('names every parsed chord from its notes, first in root position', () => {
    for (const chord of symbols) {
      const names = chordNames(chordNotes(chord))
      expect(names.length, ascii(chord)).toBeGreaterThan(0)
      expect(ascii(names[0]), ascii(chord)).toBe(ascii(chord))
    }
  })

  it('names inversions and slash chords among their names', () => {
    const slashes = ['C/E', 'C/G', 'C7/Bb', 'Am7/G', 'Fmaj7/E', 'C/D', 'F/G']
    for (const text of slashes) {
      const chord = parse(text)
      expect(parseChordSymbol(ascii(chord))).toEqual(chord)
      const names = chordNames(chordNotes(chord)).map(ascii)
      expect(names, text).toContain(text)
    }
  })
})

describe('chordNames', () => {
  it.each(nameCases)('$notes', ({ notes, key, names, omitted }) => {
    const k: Key | undefined = key && { tonic: note(key.tonic), mode: key.mode }
    const found = chordNames(notes.split(' ').map(note), { key: k })
    expect(found.map(ascii)).toEqual(names)
    for (const name of found) {
      expect(name.omitted, ascii(name)).toEqual(omitted?.[ascii(name)])
    }
  })

  it('takes the lowest note by octave as the bass', () => {
    const names = chordNames(['G4', 'E4', 'C5'].map(note))
    expect(ascii(names[0])).toBe('C/E')
  })

  it('returns nothing for one note or none', () => {
    expect(chordNames([])).toEqual([])
    expect(chordNames([note('C')])).toEqual([])
  })
})

describe('power chord numerals', () => {
  const C: Key = { tonic: note('C'), mode: 'major' }
  it.each([
    ['C5', 'I5'],
    ['D5', 'ii5'],
    ['Ab5', '♭VI5'],
    ['Bb5', '♭VII5'],
  ])('%s in C is %s', (symbol, numeral) => {
    expect(romanNumeral(C, parse(symbol)).numeral).toBe(numeral)
  })

  it('reads an all-power-chord progression in E minor', () => {
    const Em: Key = { tonic: note('E'), mode: 'natural-minor' }
    const progression = ['E5', 'C5', 'D5', 'A5'].map(
      (s) => romanNumeral(Em, parse(s)).numeral,
    )
    expect(progression).toEqual(['i5', '♭VI5', '♭VII5', 'iv5'])
  })
})
